/**
 * Supabase Data Service
 * Handles all CRUD operations with Supabase database
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import type { Wedding, Guest, Event, Venue, Hotel, Room, Table, TableAssignment } from '../types';

// ============================================
// Wedding Operations
// ============================================

export async function fetchWedding(weddingId: string): Promise<Wedding | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('weddings')
        .select('*')
        .eq('id', weddingId)
        .single();

    if (error) {
        console.error('Error fetching wedding:', error);
        return null;
    }

    return transformWedding(data);
}

export async function createWedding(wedding: Omit<Wedding, 'id' | 'createdAt' | 'updatedAt'>): Promise<Wedding | null> {
    if (!isSupabaseConfigured()) return null;

    console.log('[dataService] Creating wedding:', wedding);

    const { data, error } = await supabase
        .from('weddings')
        .insert({
            partner1_name: wedding.coupleName1,
            partner2_name: wedding.coupleName2,
            wedding_date: (wedding.weddingDate || wedding.weddingStartDate) || null,
            event_start_date: wedding.weddingStartDate || null,
            event_end_date: wedding.weddingEndDate || null,
            timezone: wedding.primaryTimezone,
            estimated_guest_count: wedding.estimatedGuestCount,
            primary_contact_email: wedding.primaryContactEmail,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating wedding:', error);
        return null;
    }

    console.log('[dataService] Wedding created:', data);

    // Link the user to this wedding
    const { error: linkError } = await supabase.rpc('link_user_to_wedding', {
        p_wedding_id: data.id
    });

    if (linkError) {
        console.warn('[dataService] Failed to link user to wedding:', linkError);
        // Don't fail - the wedding was created, user just needs to be linked manually
    } else {
        console.log('[dataService] User linked to wedding');
    }

    return transformWedding(data);
}

export async function updateWedding(id: string, updates: Partial<Wedding>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.coupleName1) dbUpdates.partner1_name = updates.coupleName1;
    if (updates.coupleName2) dbUpdates.partner2_name = updates.coupleName2;
    if (updates.weddingStartDate) dbUpdates.event_start_date = updates.weddingStartDate;
    if (updates.weddingEndDate) dbUpdates.event_end_date = updates.weddingEndDate;
    if (updates.primaryTimezone) dbUpdates.timezone = updates.primaryTimezone;
    if (updates.estimatedGuestCount) dbUpdates.estimated_guest_count = updates.estimatedGuestCount;
    if (updates.primaryContactEmail) dbUpdates.primary_contact_email = updates.primaryContactEmail;

    const { error } = await supabase
        .from('weddings')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error('Error updating wedding:', error);
        return false;
    }

    return true;
}

// ============================================
// Guest Operations
// ============================================

export async function fetchGuests(weddingId: string): Promise<Guest[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('last_name');

    if (error) {
        console.error('Error fetching guests:', error);
        return [];
    }

    return (data || []).map(transformGuest);
}

export async function createGuest(guest: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guest | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('guests')
        .insert({
            wedding_id: guest.weddingId,
            first_name: guest.firstName,
            last_name: guest.lastName,
            email: guest.email || null,
            phone: guest.phone || null,
            relationship: guest.relationship || null,
            global_rsvp_status: guest.globalRsvpStatus || 'pending',
            is_vip: guest.isVip || false,
            dietary_restrictions: guest.dietaryRestrictions || [],
            accessibility_needs: guest.accessibilityNeeds || null,
            arrival_date: guest.arrivalDate || null,
            departure_date: guest.departureDate || null,
            notes: guest.notes || null,
            tags: guest.tags || [],
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating guest:', error);
        return null;
    }

    return transformGuest(data);
}

export async function updateGuest(id: string, updates: Partial<Guest>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const dbUpdates: Record<string, unknown> = {};

    // Core text fields that exist in the DB
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.email !== undefined) dbUpdates.email = updates.email || null;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone || null;
    if (updates.relationship !== undefined) dbUpdates.relationship = updates.relationship || null;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;
    // Note: 'country' and 'accessibility_needs' columns don't exist in DB - skip them

    // Status fields
    if (updates.globalRsvpStatus !== undefined) dbUpdates.global_rsvp_status = updates.globalRsvpStatus;

    // Boolean fields
    if (updates.isVip !== undefined) dbUpdates.is_vip = updates.isVip;
    // Note: allow_plus_one and is_plus_one columns don't exist in DB - skip them

    // Array fields
    if (updates.dietaryRestrictions !== undefined) dbUpdates.dietary_restrictions = updates.dietaryRestrictions;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;

    // Date fields
    if (updates.arrivalDate !== undefined) dbUpdates.arrival_date = updates.arrivalDate || null;
    if (updates.departureDate !== undefined) dbUpdates.departure_date = updates.departureDate || null;

    // Don't update if there's nothing to update
    if (Object.keys(dbUpdates).length === 0) {
        console.log('No fields to update');
        return true;
    }

    console.log('[updateGuest] Updating guest', id, 'with:', dbUpdates);

    try {
        const { data, error } = await supabase
            .from('guests')
            .update(dbUpdates)
            .eq('id', id)
            .select();

        console.log('[updateGuest] Supabase response received, error:', error, 'data:', data);

        if (error) {
            console.error('[updateGuest] Error updating guest:', error);
            return false;
        }

        if (!data || data.length === 0) {
            console.warn('[updateGuest] No rows updated! ID may not exist or RLS policy blocking update');
            console.log('[updateGuest] Guest ID:', id);
            return false;
        }

        console.log('[updateGuest] Successfully updated guest', id, '- Updated data:', data[0]);
        return true;
    } catch (err) {
        console.error('[updateGuest] Exception thrown during update:', err);
        return false;
    }
}

export async function deleteGuest(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting guest:', error);
        return false;
    }

    return true;
}

// ============================================
// Event Operations
// ============================================

export async function fetchEvents(weddingId: string): Promise<Event[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('wedding_id', weddingId)
        .order('event_date');

    if (error) {
        console.error('Error fetching events:', error);
        return [];
    }

    return (data || []).map(transformEvent);
}

export async function createEvent(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('events')
        .insert({
            wedding_id: event.weddingId,
            name: event.name,
            event_type: event.eventType,
            event_date: event.eventDate || null,
            start_time: event.startTime || null,
            end_time: event.endTime || null,
            venue_id: event.venueId || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating event:', error);
        return null;
    }

    return transformEvent(data);
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.eventType) dbUpdates.event_type = updates.eventType;
    if (updates.eventDate !== undefined) dbUpdates.event_date = updates.eventDate || null;
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime || null;
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime || null;
    if (updates.venueId !== undefined) dbUpdates.venue_id = updates.venueId || null;

    const { error } = await supabase
        .from('events')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error('Error updating event:', error);
        return false;
    }

    return true;
}

export async function deleteEvent(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting event:', error);
        return false;
    }

    return true;
}

// ============================================
// Venue Operations
// ============================================

export async function fetchVenues(weddingId: string): Promise<Venue[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('venues')
        .select('*')
        .eq('wedding_id', weddingId);

    if (error) {
        console.error('Error fetching venues:', error);
        return [];
    }

    return (data || []).map(transformVenue);
}

export async function createVenue(venue: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>): Promise<Venue | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('venues')
        .insert({
            wedding_id: venue.weddingId,
            name: venue.name,
            address: venue.address,
            city: venue.city,
            country: venue.country,
            contact_name: venue.contactName,
            contact_phone: venue.contactPhone,
            contact_email: venue.contactEmail,
            notes: venue.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating venue:', error);
        return null;
    }

    return transformVenue(data);
}

export async function deleteVenue(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('venues')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting venue:', error);
        return false;
    }

    return true;
}

// ============================================
// Hotel Operations
// ============================================

export async function fetchHotels(weddingId: string): Promise<Hotel[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('wedding_id', weddingId);

    if (error) {
        console.error('Error fetching hotels:', error);
        return [];
    }

    return (data || []).map(transformHotel);
}

export async function createHotel(hotel: Omit<Hotel, 'id' | 'createdAt' | 'updatedAt'>): Promise<Hotel | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('hotels')
        .insert({
            wedding_id: hotel.weddingId,
            name: hotel.name,
            address: hotel.address,
            contact_person: hotel.contactPerson,
            contact_phone: hotel.contactPhone,
            contact_email: hotel.contactEmail,
            notes: hotel.notes,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating hotel:', error);
        return null;
    }

    return transformHotel(data);
}

export async function deleteHotel(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('hotels')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting hotel:', error);
        return false;
    }

    return true;
}

// ============================================
// Room Operations
// ============================================

export async function fetchRooms(hotelIds: string[]): Promise<Room[]> {
    if (!isSupabaseConfigured() || hotelIds.length === 0) return [];

    const { data, error } = await supabase
        .from('rooms')
        .select('*')
        .in('hotel_id', hotelIds);

    if (error) {
        console.error('Error fetching rooms:', error);
        return [];
    }

    return (data || []).map(transformRoom);
}

export async function createRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt'>): Promise<Room | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('rooms')
        .insert({
            hotel_id: room.hotelId,
            room_number: room.roomNumber,
            room_type: room.roomType || 'standard',
            max_occupancy: Number(room.maxOccupancy || room.capacity || 2),
            assigned_guest_ids: room.assignedGuestIds || [],
            notes: room.notes || null,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating room:', error);
        return null;
    }

    return transformRoom(data);
}

export async function updateRoom(id: string, updates: Partial<Room>): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const dbUpdates: Record<string, unknown> = {};
    if (updates.roomNumber !== undefined) dbUpdates.room_number = updates.roomNumber;
    if (updates.roomType !== undefined) dbUpdates.room_type = updates.roomType;
    if (updates.maxOccupancy !== undefined) dbUpdates.max_occupancy = updates.maxOccupancy;
    if (updates.capacity !== undefined) dbUpdates.max_occupancy = updates.capacity;
    if (updates.assignedGuestIds !== undefined) dbUpdates.assigned_guest_ids = updates.assignedGuestIds;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes || null;

    const { error } = await supabase
        .from('rooms')
        .update(dbUpdates)
        .eq('id', id);

    if (error) {
        console.error('Error updating room:', error);
        return false;
    }

    return true;
}

export async function deleteRoom(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting room:', error);
        return false;
    }

    return true;
}

// ============================================
// Table Operations
// ============================================

export async function fetchTables(eventIds: string[]): Promise<Table[]> {
    if (!isSupabaseConfigured() || eventIds.length === 0) return [];

    const { data, error } = await supabase
        .from('seating_tables')
        .select('*')
        .in('event_id', eventIds);

    if (error) {
        console.error('Error fetching tables:', error);
        return [];
    }

    return (data || []).map(transformTable);
}

export async function createTable(table: Omit<Table, 'id' | 'createdAt' | 'updatedAt'>): Promise<Table | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('seating_tables')
        .insert({
            event_id: table.eventId,
            name: table.name,
            capacity: Number(table.capacity) || 8,
            table_type: table.tableType || 'round',
            position_x: Number(table.positionX), // 0 is valid, allow it
            position_y: Number(table.positionY),
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating table:', error);
        return null;
    }

    return transformTable(data);
}

export async function deleteTable(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('seating_tables')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting table:', error);
        return false;
    }

    return true;
}

// ============================================
// Table Assignment Operations
// ============================================

export async function fetchTableAssignments(tableIds: string[]): Promise<TableAssignment[]> {
    if (!isSupabaseConfigured() || tableIds.length === 0) return [];

    const { data, error } = await supabase
        .from('table_assignments')
        .select('*')
        .in('table_id', tableIds);

    if (error) {
        console.error('Error fetching table assignments:', error);
        return [];
    }

    return (data || []).map(transformTableAssignment);
}

export async function createTableAssignment(assignment: TableAssignment): Promise<TableAssignment | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
        .from('table_assignments')
        .insert({
            table_id: assignment.tableId,
            guest_id: assignment.guestId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating table assignment:', error);
        return null;
    }

    return transformTableAssignment(data);
}

export async function deleteTableAssignment(id: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    const { error } = await supabase
        .from('table_assignments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting table assignment:', error);
        return false;
    }

    return true;
}

// ============================================
// Data Transformers (DB → App Types)
// ============================================

function transformWedding(data: Record<string, unknown>): Wedding {
    return {
        id: data.id as string,
        coupleName1: data.partner1_name as string,
        coupleName2: data.partner2_name as string,
        partner1Name: data.partner1_name as string,
        partner2Name: data.partner2_name as string,
        weddingStartDate: data.event_start_date as string,
        weddingEndDate: data.event_end_date as string,
        weddingDate: data.wedding_date as string,
        eventStartDate: data.event_start_date as string,
        eventEndDate: data.event_end_date as string,
        primaryTimezone: (data.timezone as string) || 'UTC',
        estimatedGuestCount: (data.estimated_guest_count as number) || 0,
        primaryContactEmail: (data.primary_contact_email as string) || '',
        createdAt: data.created_at as string,
        updatedAt: data.updated_at as string,
    };
}

function transformGuest(data: Record<string, unknown>): Guest {
    return {
        id: data.id as string,
        weddingId: data.wedding_id as string,
        firstName: data.first_name as string,
        lastName: data.last_name as string,
        email: data.email as string | undefined,
        phone: data.phone as string | undefined,
        relationship: (data.relationship as string) || '',
        tags: (data.tags as string[]) || [],
        householdId: undefined,
        isPlusOne: false,
        allowPlusOne: false,
        globalRsvpStatus: (data.global_rsvp_status as 'pending' | 'yes' | 'no' | 'maybe') || 'pending',
        dietaryRestrictions: (data.dietary_restrictions as string[]) || [],
        accessibilityNeeds: data.accessibility_needs as string | undefined,
        isVip: (data.is_vip as boolean) || false,
        avoidSeatingWith: [],
        arrivalDate: data.arrival_date as string | undefined,
        departureDate: data.departure_date as string | undefined,
        notes: data.notes as string | undefined,
        rsvpToken: data.rsvp_token as string | undefined,
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformEvent(data: Record<string, unknown>): Event {
    return {
        id: data.id as string,
        weddingId: data.wedding_id as string,
        name: data.name as string,
        eventType: (data.event_type as 'ceremony' | 'reception' | 'party' | 'casual' | 'other') || 'other',
        eventDate: data.event_date as string,
        startTime: data.start_time as string,
        endTime: data.end_time as string | undefined,
        venueId: data.venue_id as string | undefined,
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformVenue(data: Record<string, unknown>): Venue {
    return {
        id: data.id as string,
        weddingId: data.wedding_id as string,
        name: data.name as string,
        address: (data.address as string) || '',
        city: data.city as string | undefined,
        country: data.country as string | undefined,
        contactName: data.contact_name as string | undefined,
        contactPhone: data.contact_phone as string | undefined,
        contactEmail: data.contact_email as string | undefined,
        notes: data.notes as string | undefined,
        spaces: [],
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformHotel(data: Record<string, unknown>): Hotel {
    return {
        id: data.id as string,
        weddingId: data.wedding_id as string,
        name: data.name as string,
        address: (data.address as string) || '',
        contactPerson: data.contact_person as string | undefined,
        contactPhone: data.contact_phone as string | undefined,
        contactEmail: data.contact_email as string | undefined,
        notes: data.notes as string | undefined,
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformRoom(data: Record<string, unknown>): Room {
    return {
        id: data.id as string,
        hotelId: data.hotel_id as string,
        roomNumber: data.room_number as string,
        roomType: (data.room_type as Room['roomType']) || 'standard',
        capacity: (data.max_occupancy as number) || 2,
        maxOccupancy: (data.max_occupancy as number) || 2,
        assignedGuestIds: (data.assigned_guest_ids as string[]) || [],
        notes: data.notes as string | undefined,
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformTable(data: Record<string, unknown>): Table {
    return {
        id: data.id as string,
        eventId: data.event_id as string,
        name: data.name as string,
        capacity: (data.capacity as number) || 8,
        tableType: (data.table_type as Table['tableType']) || 'round',
        positionX: (data.position_x as number) || 100,
        positionY: (data.position_y as number) || 100,
        attributes: [],
        createdAt: data.created_at as string,
        updatedAt: data.created_at as string,
    };
}

function transformTableAssignment(data: Record<string, unknown>): TableAssignment {
    return {
        id: data.id as string,
        tableId: data.table_id as string,
        guestId: data.guest_id as string,
        assignedAt: data.created_at as string,
        assignedByUserId: '',
    };
}

// ============================================
// Bulk Load for Initial App Load
// ============================================

export async function loadAllWeddingData(weddingId: string): Promise<{
    wedding: Wedding | null;
    guests: Guest[];
    events: Event[];
    venues: Venue[];
    hotels: Hotel[];
    rooms: Room[];
    tables: Table[];
    tableAssignments: TableAssignment[];
}> {
    if (!isSupabaseConfigured()) {
        return {
            wedding: null,
            guests: [],
            events: [],
            venues: [],
            hotels: [],
            rooms: [],
            tables: [],
            tableAssignments: [],
        };
    }

    // Parallel fetch for performance
    const [wedding, guests, events, venues, hotels] = await Promise.all([
        fetchWedding(weddingId),
        fetchGuests(weddingId),
        fetchEvents(weddingId),
        fetchVenues(weddingId),
        fetchHotels(weddingId),
    ]);

    // Fetch dependent data
    const hotelIds = hotels.map(h => h.id);
    const eventIds = events.map(e => e.id);

    const [rooms, tables] = await Promise.all([
        fetchRooms(hotelIds),
        fetchTables(eventIds),
    ]);

    const tableIds = tables.map(t => t.id);
    const tableAssignments = await fetchTableAssignments(tableIds);

    return {
        wedding,
        guests,
        events,
        venues,
        hotels,
        rooms,
        tables,
        tableAssignments,
    };
}
