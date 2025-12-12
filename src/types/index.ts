// Core data types for Wedding Ops

export interface Wedding {
    id: string;
    coupleName1: string;
    coupleName2: string;
    // Alternative property names used in some components
    partner1Name?: string;
    partner2Name?: string;
    weddingStartDate: string;
    weddingEndDate: string;
    // Alternative property names
    weddingDate?: string;
    eventStartDate?: string;
    eventEndDate?: string;
    primaryTimezone: string;
    estimatedGuestCount: number;
    coverPhotoUrl?: string;
    primaryContactEmail: string;
    createdAt: string;
    updatedAt: string;
}

export interface Guest {
    id: string;
    weddingId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    country?: string;
    relationship: string;
    tags: string[];
    householdId?: string;
    isPlusOne: boolean;
    primaryGuestId?: string;
    plusOneName?: string;
    globalRsvpStatus: 'pending' | 'yes' | 'no' | 'maybe';
    allowPlusOne: boolean;
    arrivalDate?: string;
    arrivalTime?: string;
    arrivalFlight?: string;
    originCity?: string;
    departureDate?: string;
    departureTime?: string;
    departureFlight?: string;
    accommodationPreference?: string;
    assignedHotelId?: string;
    assignedRoomId?: string;
    checkInDate?: string;
    checkOutDate?: string;
    dietaryRestrictions: string[];
    accessibilityNeeds?: string;
    isVip: boolean;
    avoidSeatingWith: string[];
    notes?: string;
    internalComments?: string;
    rsvpToken?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Event {
    id: string;
    weddingId: string;
    name: string;
    eventType: 'ceremony' | 'reception' | 'party' | 'casual' | 'other';
    eventDate: string;
    startTime: string;
    endTime?: string;
    venueId?: string;
    venueSpace?: string;
    capacityEstimate?: number;
    description?: string;
    defaultGuestSegment?: 'all' | 'vip_only' | 'family_only';
    dressCode?: string;
    createdAt: string;
    updatedAt: string;
}

export interface GuestEventRSVP {
    id: string;
    guestId: string;
    eventId: string;
    rsvpStatus: 'invited' | 'yes' | 'no' | 'maybe';
    rsvpSubmittedAt?: string;
    mealPreference?: string;
    plusOneAttending: boolean;
    notes?: string;
}

export interface Venue {
    id: string;
    weddingId: string;
    name: string;
    address: string;
    city?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    mapLink?: string;
    contactPerson?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    notes?: string;
    spaces: VenueSpace[];
    createdAt: string;
    updatedAt: string;
}

export interface VenueSpace {
    id: string;
    name: string;
    capacity?: number;
    isIndoor: boolean;
}

export interface Hotel {
    id: string;
    weddingId: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    contactPerson?: string;
    contactPhone?: string;
    contactEmail?: string;
    roomBlockStartDate?: string;
    roomBlockEndDate?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Room {
    id: string;
    hotelId: string;
    roomNumber: string;
    roomType: 'single' | 'double' | 'twin' | 'suite' | 'standard' | 'deluxe' | 'family' | 'other';
    capacity: number;
    maxOccupancy?: number;
    bedConfiguration?: string;
    pricePerNight?: number;
    floor?: number;
    isAccessible?: boolean;
    assignedGuestIds?: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Table {
    id: string;
    eventId: string;
    name: string;
    tableNumber?: number;
    capacity: number;
    tableType: 'round' | 'rectangular' | 'high_top' | 'vip';
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
    rotation?: number;
    attributes: string[];
    createdAt: string;
    updatedAt: string;
}

export interface TableAssignment {
    id: string;
    guestId: string;
    tableId: string;
    seatNumber?: number;
    assignedAt: string;
    assignedByUserId: string;
}

export interface Route {
    id: string;
    weddingId: string;
    name: string;
    routeType: 'shuttle' | 'charter' | 'rideshare' | 'private' | 'pickup' | 'dropoff' | 'transfer';
    pickupLocation?: string;
    dropoffLocation?: string;
    departureTime?: string;
    originLocation?: string;
    originAddress?: string;
    destinationLocation?: string;
    destinationAddress?: string;
    routeDate?: string;
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    recurrenceIntervalMinutes?: number;
    eventId?: string;
    linkedEventId?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Vehicle {
    id: string;
    routeId: string;
    name?: string;
    vehicleName?: string;
    vehicleType: 'bus' | 'van' | 'car' | 'suv' | 'shuttle';
    capacity: number;
    departureTime?: string;
    driverName?: string;
    driverPhone?: string;
    licensePlate?: string;
    assignedGuestIds?: string[];
    createdAt: string;
    updatedAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    role: 'admin' | 'planner' | 'couple' | 'vendor' | 'hotel_liaison';
    permissions: string[];
    createdAt: string;
    lastLogin: string;
}
