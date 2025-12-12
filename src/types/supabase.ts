// Supabase Database Types
// These types match the database schema

export type Database = {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string;
                    email: string;
                    role: 'planner' | 'couple' | 'hotel' | 'vendor';
                    wedding_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    email: string;
                    role?: 'planner' | 'couple' | 'hotel' | 'vendor';
                    wedding_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    role?: 'planner' | 'couple' | 'hotel' | 'vendor';
                    wedding_id?: string | null;
                    created_at?: string;
                };
            };
            weddings: {
                Row: {
                    id: string;
                    partner1_name: string;
                    partner2_name: string;
                    wedding_date: string | null;
                    event_start_date: string | null;
                    event_end_date: string | null;
                    timezone: string;
                    estimated_guest_count: number | null;
                    primary_contact_email: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    partner1_name: string;
                    partner2_name: string;
                    wedding_date?: string | null;
                    event_start_date?: string | null;
                    event_end_date?: string | null;
                    timezone?: string;
                    estimated_guest_count?: number | null;
                    primary_contact_email?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    partner1_name?: string;
                    partner2_name?: string;
                    wedding_date?: string | null;
                    event_start_date?: string | null;
                    event_end_date?: string | null;
                    timezone?: string;
                    estimated_guest_count?: number | null;
                    primary_contact_email?: string | null;
                    updated_at?: string;
                };
            };
            guests: {
                Row: {
                    id: string;
                    wedding_id: string;
                    first_name: string;
                    last_name: string;
                    email: string | null;
                    phone: string | null;
                    relationship: string | null;
                    rsvp_token: string;
                    global_rsvp_status: 'pending' | 'yes' | 'no' | 'maybe';
                    is_vip: boolean;
                    dietary_restrictions: string[] | null;
                    accessibility_needs: string | null;
                    arrival_date: string | null;
                    departure_date: string | null;
                    notes: string | null;
                    tags: string[] | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    wedding_id: string;
                    first_name: string;
                    last_name: string;
                    email?: string | null;
                    phone?: string | null;
                    relationship?: string | null;
                    rsvp_token?: string;
                    global_rsvp_status?: 'pending' | 'yes' | 'no' | 'maybe';
                    is_vip?: boolean;
                    dietary_restrictions?: string[] | null;
                    accessibility_needs?: string | null;
                    arrival_date?: string | null;
                    departure_date?: string | null;
                    notes?: string | null;
                    tags?: string[] | null;
                    created_at?: string;
                };
                Update: {
                    first_name?: string;
                    last_name?: string;
                    email?: string | null;
                    phone?: string | null;
                    relationship?: string | null;
                    global_rsvp_status?: 'pending' | 'yes' | 'no' | 'maybe';
                    is_vip?: boolean;
                    dietary_restrictions?: string[] | null;
                    accessibility_needs?: string | null;
                    arrival_date?: string | null;
                    departure_date?: string | null;
                    notes?: string | null;
                    tags?: string[] | null;
                };
            };
            events: {
                Row: {
                    id: string;
                    wedding_id: string;
                    name: string;
                    event_type: string | null;
                    event_date: string | null;
                    start_time: string | null;
                    end_time: string | null;
                    venue_id: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    wedding_id: string;
                    name: string;
                    event_type?: string | null;
                    event_date?: string | null;
                    start_time?: string | null;
                    end_time?: string | null;
                    venue_id?: string | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    event_type?: string | null;
                    event_date?: string | null;
                    start_time?: string | null;
                    end_time?: string | null;
                    venue_id?: string | null;
                };
            };
            event_rsvps: {
                Row: {
                    id: string;
                    guest_id: string;
                    event_id: string;
                    status: 'pending' | 'yes' | 'no' | 'maybe';
                    responded_at: string | null;
                };
                Insert: {
                    id?: string;
                    guest_id: string;
                    event_id: string;
                    status?: 'pending' | 'yes' | 'no' | 'maybe';
                    responded_at?: string | null;
                };
                Update: {
                    status?: 'pending' | 'yes' | 'no' | 'maybe';
                    responded_at?: string | null;
                };
            };
            venues: {
                Row: {
                    id: string;
                    wedding_id: string;
                    name: string;
                    address: string | null;
                    city: string | null;
                    country: string | null;
                    contact_name: string | null;
                    contact_phone: string | null;
                    contact_email: string | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    wedding_id: string;
                    name: string;
                    address?: string | null;
                    city?: string | null;
                    country?: string | null;
                    contact_name?: string | null;
                    contact_phone?: string | null;
                    contact_email?: string | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    address?: string | null;
                    city?: string | null;
                    country?: string | null;
                    contact_name?: string | null;
                    contact_phone?: string | null;
                    contact_email?: string | null;
                    notes?: string | null;
                };
            };
            hotels: {
                Row: {
                    id: string;
                    wedding_id: string;
                    name: string;
                    address: string | null;
                    contact_person: string | null;
                    contact_phone: string | null;
                    contact_email: string | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    wedding_id: string;
                    name: string;
                    address?: string | null;
                    contact_person?: string | null;
                    contact_phone?: string | null;
                    contact_email?: string | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    name?: string;
                    address?: string | null;
                    contact_person?: string | null;
                    contact_phone?: string | null;
                    contact_email?: string | null;
                    notes?: string | null;
                };
            };
            rooms: {
                Row: {
                    id: string;
                    hotel_id: string;
                    room_number: string;
                    room_type: string;
                    max_occupancy: number;
                    assigned_guest_ids: string[] | null;
                    notes: string | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    hotel_id: string;
                    room_number: string;
                    room_type?: string;
                    max_occupancy?: number;
                    assigned_guest_ids?: string[] | null;
                    notes?: string | null;
                    created_at?: string;
                };
                Update: {
                    room_number?: string;
                    room_type?: string;
                    max_occupancy?: number;
                    assigned_guest_ids?: string[] | null;
                    notes?: string | null;
                };
            };
        };
    };
};

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
    Database['public']['Tables'][T]['Update'];
