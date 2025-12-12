'use client';

/**
 * useSupabaseSync Hook
 * Syncs Zustand store with Supabase database
 * Loads initial data and provides sync utilities
 */

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import * as dataService from '../services/dataService';
import type { Wedding, Event, Venue } from '../types';

interface SyncState {
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
}

export function useSupabaseSync() {
    const { profile, isConfigured, refreshProfile } = useAuth();
    // Don't subscribe to store updates to avoid infinite loops
    // const store = useStore();

    const [syncState, setSyncState] = useState<SyncState>({
        isLoading: false,
        isLoaded: false,
        error: null,
    });

    // Load all data for the current wedding
    const loadWeddingData = useCallback(async (weddingId: string) => {
        if (!isSupabaseConfigured()) {
            setSyncState({ isLoading: false, isLoaded: true, error: null });
            return;
        }

        setSyncState({ isLoading: true, isLoaded: false, error: null });

        try {
            const data = await dataService.loadAllWeddingData(weddingId);

            // Update store with fetched data using getState() to avoid re-renders
            const store = useStore.getState();

            if (data.wedding) {
                store.setCurrentWedding(data.wedding);
            }
            store.setGuests(data.guests);
            // Debug: Log first guest to verify rsvpToken is loaded
            if (data.guests.length > 0) {
                console.log('[Debug] First guest rsvpToken:', data.guests[0].firstName, data.guests[0].rsvpToken);
            }
            store.setEvents(data.events);
            store.setVenues(data.venues);
            store.setHotels(data.hotels);
            store.setRooms(data.rooms);
            store.setTables(data.tables);
            store.setTableAssignments(data.tableAssignments);

            setSyncState({ isLoading: false, isLoaded: true, error: null });
        } catch (err) {
            console.error('Error loading wedding data:', err);
            setSyncState({
                isLoading: false,
                isLoaded: false,
                error: err instanceof Error ? err.message : 'Failed to load data',
            });
        }
    }, []); // Removed store dependency

    // Load data when user profile is available
    useEffect(() => {
        if (!isConfigured) {
            // Not using Supabase, data stays in localStorage
            setSyncState({ isLoading: false, isLoaded: true, error: null });
            return;
        }

        if (profile?.weddingId) {
            loadWeddingData(profile.weddingId);
        } else if (profile) {
            // User exists but no wedding - they need to create one
            setSyncState({ isLoading: false, isLoaded: true, error: null });
        }
    }, [profile, isConfigured, loadWeddingData]);

    // Create a new wedding with initial data (for onboarding flow)
    const createWeddingWithData = useCallback(async (
        weddingData: Omit<Wedding, 'id' | 'createdAt' | 'updatedAt'>,
        venueData: Omit<Venue, 'id' | 'weddingId' | 'createdAt' | 'updatedAt'>,
        eventsData: Array<Omit<Event, 'id' | 'weddingId' | 'createdAt' | 'updatedAt'>>
    ) => {
        const isConfigured = isSupabaseConfigured();
        // Use imperative store access to prevent stale closures and re-renders
        const store = useStore.getState();

        console.log('[createWeddingWithData] Starting...', { isConfigured, weddingData });

        if (!isConfigured) {
            console.log('[createWeddingWithData] Using localStorage fallback');
            // Fallback to local store logic...
            const wedding: Wedding = {
                ...weddingData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.setCurrentWedding(wedding);

            const venue: Venue = {
                ...venueData,
                id: Date.now().toString() + '-venue',
                weddingId: wedding.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.setVenues([venue]);

            const events: Event[] = eventsData.map((e, idx) => ({
                ...e,
                id: Date.now().toString() + '-event-' + idx,
                weddingId: wedding.id,
                venueId: venue.id,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }));
            store.setEvents(events);

            console.log('[createWeddingWithData] Created in localStorage:', { wedding, venue, events });
            return { wedding, venue, events };
        }

        try {
            // Create wedding in Supabase
            const wedding = await dataService.createWedding(weddingData);
            if (!wedding) {
                throw new Error('Failed to create wedding');
            }

            console.log('[createWeddingWithData] Wedding created in Supabase. Refreshing profile...');

            // IMPORTANT: Refresh profile to get the new weddingId linked to the user
            // This prevents the app from redirecting back to onboarding
            await refreshProfile();
            console.log('[createWeddingWithData] Profile refreshed.');

            // Update local store
            store.setCurrentWedding(wedding);

            // Create venue
            const venue = await dataService.createVenue({
                ...venueData,
                weddingId: wedding.id,
            });
            if (venue) {
                store.setVenues([venue]);
            }

            // Create events
            const createdEvents: Event[] = [];
            for (const eventData of eventsData) {
                const event = await dataService.createEvent({
                    ...eventData,
                    weddingId: wedding.id,
                    venueId: venue?.id || '',
                });
                if (event) {
                    createdEvents.push(event);
                }
            }
            store.setEvents(createdEvents);

            return { wedding, venue, events: createdEvents };
        } catch (err) {
            console.error('Error creating wedding with data:', err);
            throw err;
        }
    }, [refreshProfile]); // Removed store dependency

    // Sync a single guest to Supabase
    const syncGuest = useCallback(async (guest: Parameters<typeof dataService.createGuest>[0]) => {
        if (!isSupabaseConfigured()) return null;
        return dataService.createGuest(guest);
    }, []);

    // Sync a single event to Supabase
    const syncEvent = useCallback(async (event: Parameters<typeof dataService.createEvent>[0]) => {
        if (!isSupabaseConfigured()) return null;
        return dataService.createEvent(event);
    }, []);

    // Sync a single venue to Supabase
    const syncVenue = useCallback(async (venue: Parameters<typeof dataService.createVenue>[0]) => {
        if (!isSupabaseConfigured()) return null;
        return dataService.createVenue(venue);
    }, []);

    // Sync a single hotel to Supabase
    const syncHotel = useCallback(async (hotel: Parameters<typeof dataService.createHotel>[0]) => {
        if (!isSupabaseConfigured()) return null;
        return dataService.createHotel(hotel);
    }, []);

    // Create a new wedding
    const createWedding = useCallback(async (wedding: Parameters<typeof dataService.createWedding>[0]) => {
        if (!isSupabaseConfigured()) return null;
        return dataService.createWedding(wedding);
    }, []);

    // Refresh data from Supabase
    const refresh = useCallback(() => {
        if (profile?.weddingId) {
            loadWeddingData(profile.weddingId);
        }
    }, [profile, loadWeddingData]);

    return {
        ...syncState,
        refresh,
        createWedding,
        createWeddingWithData,
        syncGuest,
        syncEvent,
        syncVenue,
        syncHotel,
    };
}

/**
 * Hook to wrap store actions with Supabase sync
 * Use this to add Supabase persistence to existing store actions
 */
export function useSupabaseActions() {
    const store = useStore();

    // Add guest with Supabase sync
    const addGuest = useCallback(async (guestData: Omit<Parameters<typeof store.addGuest>[0], 'id' | 'createdAt' | 'updatedAt'> & { weddingId: string }) => {
        if (!isSupabaseConfigured()) {
            // Fallback to local store
            const localGuest = {
                ...guestData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addGuest(localGuest as Parameters<typeof store.addGuest>[0]);
            return localGuest;
        }

        // Create in Supabase first
        const newGuest = await dataService.createGuest(guestData as Parameters<typeof dataService.createGuest>[0]);
        if (newGuest) {
            store.addGuest(newGuest);
            return newGuest;
        }
        return null;
    }, [store]);

    // Update guest with Supabase sync
    const updateGuest = useCallback(async (id: string, updates: Partial<Parameters<typeof store.updateGuest>[1]>) => {
        console.log('[useSupabaseActions.updateGuest] Called with id:', id, 'updates:', updates);

        // Update locally first for immediate UI feedback
        store.updateGuest(id, updates);
        console.log('[useSupabaseActions.updateGuest] Local store updated');

        const configured = isSupabaseConfigured();
        console.log('[useSupabaseActions.updateGuest] Supabase configured:', configured);

        if (configured) {
            console.log('[useSupabaseActions.updateGuest] Calling dataService.updateGuest...');
            const success = await dataService.updateGuest(id, updates);
            console.log('[useSupabaseActions.updateGuest] dataService.updateGuest returned:', success);
            if (!success) {
                console.error('[useSupabaseActions.updateGuest] Failed to sync guest update to Supabase');
            }
            return success;
        }
        console.log('[useSupabaseActions.updateGuest] Supabase not configured, skipping sync');
        return true;
    }, [store]);

    // Delete guest with Supabase sync
    const deleteGuest = useCallback(async (id: string) => {
        // Delete locally first
        store.deleteGuest(id);

        if (isSupabaseConfigured()) {
            const success = await dataService.deleteGuest(id);
            if (!success) {
                console.error('Failed to sync guest deletion to Supabase');
            }
            return success;
        }
        return true;
    }, [store]);

    // Add venue with Supabase sync
    const addVenue = useCallback(async (venueData: Omit<Venue, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured()) {
            const localVenue: Venue = {
                ...venueData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addVenue(localVenue);
            return localVenue;
        }

        const newVenue = await dataService.createVenue(venueData);
        if (newVenue) {
            store.addVenue(newVenue);
            return newVenue;
        }
        return null;
    }, [store]);

    // Add event with Supabase sync
    const addEvent = useCallback(async (eventData: Omit<Parameters<typeof store.addEvent>[0], 'id' | 'createdAt' | 'updatedAt'> & { weddingId: string }) => {
        if (!isSupabaseConfigured()) {
            const localEvent = {
                ...eventData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addEvent(localEvent as Parameters<typeof store.addEvent>[0]);
            return localEvent;
        }

        const newEvent = await dataService.createEvent(eventData as Parameters<typeof dataService.createEvent>[0]);
        if (newEvent) {
            store.addEvent(newEvent);
            return newEvent;
        }
        return null;
    }, [store]);

    // Delete event with Supabase sync
    const deleteEvent = useCallback(async (id: string) => {
        store.deleteEvent(id);

        if (isSupabaseConfigured()) {
            return dataService.deleteEvent(id);
        }
        return true;
    }, [store]);

    // Add hotel with Supabase sync
    const addHotel = useCallback(async (hotelData: Omit<Parameters<typeof store.addHotel>[0], 'id' | 'createdAt' | 'updatedAt'> & { weddingId: string }) => {
        if (!isSupabaseConfigured()) {
            const localHotel = {
                ...hotelData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addHotel(localHotel as Parameters<typeof store.addHotel>[0]);
            return localHotel;
        }

        const newHotel = await dataService.createHotel(hotelData as Parameters<typeof dataService.createHotel>[0]);
        if (newHotel) {
            store.addHotel(newHotel);
            return newHotel;
        }
        return null;
    }, [store]);

    // Add room with Supabase sync
    const addRoom = useCallback(async (roomData: Omit<Parameters<typeof store.addRoom>[0], 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured()) {
            const localRoom = {
                ...roomData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addRoom(localRoom as Parameters<typeof store.addRoom>[0]);
            return localRoom;
        }

        const newRoom = await dataService.createRoom(roomData as Parameters<typeof dataService.createRoom>[0]);
        if (newRoom) {
            store.addRoom(newRoom);
            return newRoom;
        }
        return null;
    }, [store]);

    // Add table with Supabase sync
    const addTable = useCallback(async (tableData: Omit<Parameters<typeof store.addTable>[0], 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isSupabaseConfigured()) {
            const localTable = {
                ...tableData,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            store.addTable(localTable as Parameters<typeof store.addTable>[0]);
            return localTable;
        }

        const newTable = await dataService.createTable(tableData as Parameters<typeof dataService.createTable>[0]);
        if (newTable) {
            store.addTable(newTable);
            return newTable;
        }
        return null;
    }, [store]);

    // Update room with Supabase sync
    const updateRoom = useCallback(async (id: string, updates: Partial<Parameters<typeof store.updateRoom>[1]>) => {
        // Update local store
        store.updateRoom(id, updates);

        // Sync to Supabase
        if (isSupabaseConfigured()) {
            await dataService.updateRoom(id, updates as Parameters<typeof dataService.updateRoom>[1]);
        }
    }, [store]);

    return {
        addGuest,
        updateGuest,
        deleteGuest,
        addVenue,
        addEvent,
        deleteEvent,
        addHotel,
        addRoom,
        updateRoom,
        addTable,
    };
}

