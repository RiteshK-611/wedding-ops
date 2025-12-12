import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Wedding, Guest, Event, Venue, Hotel, Room, Route, Vehicle, Table, TableAssignment, User } from '../types';

interface AppState {
    // Current user
    currentUser: User | null;
    setCurrentUser: (user: User | null) => void;

    // Current wedding
    currentWedding: Wedding | null;
    setCurrentWedding: (wedding: Wedding | null) => void;

    // Guests
    guests: Guest[];
    addGuest: (guest: Guest) => void;
    updateGuest: (id: string, updates: Partial<Guest>) => void;
    deleteGuest: (id: string) => void;
    setGuests: (guests: Guest[]) => void;

    // Events
    events: Event[];
    addEvent: (event: Event) => void;
    updateEvent: (id: string, updates: Partial<Event>) => void;
    deleteEvent: (id: string) => void;
    setEvents: (events: Event[]) => void;

    // Venues
    venues: Venue[];
    addVenue: (venue: Venue) => void;
    updateVenue: (id: string, updates: Partial<Venue>) => void;
    deleteVenue: (id: string) => void;
    setVenues: (venues: Venue[]) => void;

    // Hotels
    hotels: Hotel[];
    addHotel: (hotel: Hotel) => void;
    updateHotel: (id: string, updates: Partial<Hotel>) => void;
    deleteHotel: (id: string) => void;
    setHotels: (hotels: Hotel[]) => void;

    // Rooms
    rooms: Room[];
    addRoom: (room: Room) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    deleteRoom: (id: string) => void;
    setRooms: (rooms: Room[]) => void;

    // Routes
    routes: Route[];
    addRoute: (route: Route) => void;
    updateRoute: (id: string, updates: Partial<Route>) => void;
    deleteRoute: (id: string) => void;
    setRoutes: (routes: Route[]) => void;

    // Vehicles
    vehicles: Vehicle[];
    addVehicle: (vehicle: Vehicle) => void;
    updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
    deleteVehicle: (id: string) => void;
    setVehicles: (vehicles: Vehicle[]) => void;

    // Tables
    tables: Table[];
    addTable: (table: Table) => void;
    updateTable: (id: string, updates: Partial<Table>) => void;
    deleteTable: (id: string) => void;
    setTables: (tables: Table[]) => void;

    // Table Assignments
    tableAssignments: TableAssignment[];
    addTableAssignment: (assignment: TableAssignment) => void;
    removeTableAssignment: (id: string) => void;
    setTableAssignments: (assignments: TableAssignment[]) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // User
            currentUser: null,
            setCurrentUser: (user) => set({ currentUser: user }),

            // Wedding
            currentWedding: null,
            setCurrentWedding: (wedding) => set({ currentWedding: wedding }),

            // Guests
            guests: [],
            addGuest: (guest) => set((state) => ({ guests: [...state.guests, guest] })),
            updateGuest: (id, updates) =>
                set((state) => ({
                    guests: state.guests.map((g) => (g.id === id ? { ...g, ...updates, updatedAt: new Date().toISOString() } : g)),
                })),
            deleteGuest: (id) => set((state) => ({ guests: state.guests.filter((g) => g.id !== id) })),
            setGuests: (guests) => set({ guests }),

            // Events
            events: [],
            addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
            updateEvent: (id, updates) =>
                set((state) => ({
                    events: state.events.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
                })),
            deleteEvent: (id) => set((state) => ({ events: state.events.filter((e) => e.id !== id) })),
            setEvents: (events) => set({ events }),

            // Venues
            venues: [],
            addVenue: (venue) => set((state) => ({ venues: [...state.venues, venue] })),
            updateVenue: (id, updates) =>
                set((state) => ({
                    venues: state.venues.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v)),
                })),
            deleteVenue: (id) => set((state) => ({ venues: state.venues.filter((v) => v.id !== id) })),
            setVenues: (venues) => set({ venues }),

            // Hotels
            hotels: [],
            addHotel: (hotel) => set((state) => ({ hotels: [...state.hotels, hotel] })),
            updateHotel: (id, updates) =>
                set((state) => ({
                    hotels: state.hotels.map((h) => (h.id === id ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h)),
                })),
            deleteHotel: (id) => set((state) => ({ hotels: state.hotels.filter((h) => h.id !== id) })),
            setHotels: (hotels) => set({ hotels }),

            // Rooms
            rooms: [],
            addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
            updateRoom: (id, updates) =>
                set((state) => ({
                    rooms: state.rooms.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)),
                })),
            deleteRoom: (id) => set((state) => ({ rooms: state.rooms.filter((r) => r.id !== id) })),
            setRooms: (rooms) => set({ rooms }),

            // Routes
            routes: [],
            addRoute: (route) => set((state) => ({ routes: [...state.routes, route] })),
            updateRoute: (id, updates) =>
                set((state) => ({
                    routes: state.routes.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r)),
                })),
            deleteRoute: (id) => set((state) => ({ routes: state.routes.filter((r) => r.id !== id) })),
            setRoutes: (routes) => set({ routes }),

            // Vehicles
            vehicles: [],
            addVehicle: (vehicle) => set((state) => ({ vehicles: [...state.vehicles, vehicle] })),
            updateVehicle: (id, updates) =>
                set((state) => ({
                    vehicles: state.vehicles.map((v) => (v.id === id ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v)),
                })),
            deleteVehicle: (id) => set((state) => ({ vehicles: state.vehicles.filter((v) => v.id !== id) })),
            setVehicles: (vehicles) => set({ vehicles }),

            // Tables
            tables: [],
            addTable: (table) => set((state) => ({ tables: [...state.tables, table] })),
            updateTable: (id, updates) =>
                set((state) => ({
                    tables: state.tables.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t)),
                })),
            deleteTable: (id) => set((state) => ({ tables: state.tables.filter((t) => t.id !== id) })),
            setTables: (tables) => set({ tables }),

            // Table Assignments
            tableAssignments: [],
            addTableAssignment: (assignment) => set((state) => ({ tableAssignments: [...state.tableAssignments, assignment] })),
            removeTableAssignment: (id) => set((state) => ({ tableAssignments: state.tableAssignments.filter((a) => a.id !== id) })),
            setTableAssignments: (assignments) => set({ tableAssignments: assignments }),
        }),
        {
            name: 'wedding-ops-storage',
        }
    )
);

