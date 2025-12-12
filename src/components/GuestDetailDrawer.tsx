'use client';

import React, { useState } from 'react';
import type { Guest, Event } from '../types';
import { useStore } from '../store';
import {
    X, User, Mail, Phone, MapPin, Calendar, Hotel,
    Utensils, Accessibility, Star, Edit, Trash2,
    Clock, Plane, Grid
} from 'lucide-react';

interface GuestDetailDrawerProps {
    guest: Guest;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}

export default function GuestDetailDrawer({ guest, onClose, onEdit, onDelete }: GuestDetailDrawerProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'travel' | 'accommodation' | 'seating' | 'dietary'>('overview');

    const events = useStore((state) => state.events);
    const hotels = useStore((state) => state.hotels);
    const rooms = useStore((state) => state.rooms);
    const tables = useStore((state) => state.tables);
    const tableAssignments = useStore((state) => state.tableAssignments);

    // Get guest's room assignment
    const assignedRoom = rooms.find(r => r.id === guest.assignedRoomId);
    const assignedHotel = hotels.find(h => h.id === guest.assignedHotelId);

    // Get guest's table assignments
    const guestTableAssignments = tableAssignments.filter(ta => ta.guestId === guest.id);
    const assignedTables = guestTableAssignments.map(ta => ({
        table: tables.find(t => t.id === ta.tableId),
        event: events.find(e => e.id === tables.find(t => t.id === ta.tableId)?.eventId)
    }));

    const tabs = [
        { id: 'overview', label: 'Overview', icon: User },
        { id: 'events', label: 'Events', icon: Calendar },
        { id: 'travel', label: 'Travel', icon: Plane },
        { id: 'accommodation', label: 'Accommodation', icon: Hotel },
        { id: 'seating', label: 'Seating', icon: Grid },
        { id: 'dietary', label: 'Dietary', icon: Utensils },
    ];

    return (
        <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />

            {/* Drawer */}
            <div className="ml-auto w-full max-w-xl bg-white shadow-xl relative flex flex-col h-full animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                                <span className="text-2xl font-bold text-primary-600">
                                    {guest.firstName[0]}{guest.lastName[0]}
                                </span>
                            </div>
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {guest.firstName} {guest.lastName}
                                    </h2>
                                    {guest.isVip && (
                                        <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    )}
                                </div>
                                <p className="text-slate-500">{guest.relationship}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded ${guest.globalRsvpStatus === 'yes'
                                        ? 'bg-green-100 text-green-700'
                                        : guest.globalRsvpStatus === 'no'
                                            ? 'bg-red-100 text-red-700'
                                            : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        RSVP: {guest.globalRsvpStatus.charAt(0).toUpperCase() + guest.globalRsvpStatus.slice(1)}
                                    </span>
                                    {guest.isPlusOne && (
                                        <span className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded">
                                            Plus One
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={onEdit}
                                className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onDelete}
                                className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-1 mt-6 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 mr-1.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {activeTab === 'overview' && (
                        <OverviewTab guest={guest} />
                    )}
                    {activeTab === 'events' && (
                        <EventsTab guest={guest} events={events} />
                    )}
                    {activeTab === 'travel' && (
                        <TravelTab guest={guest} />
                    )}
                    {activeTab === 'accommodation' && (
                        <AccommodationTab guest={guest} hotel={assignedHotel} room={assignedRoom} />
                    )}
                    {activeTab === 'seating' && (
                        <SeatingTab guest={guest} assignedTables={assignedTables} />
                    )}
                    {activeTab === 'dietary' && (
                        <DietaryTab guest={guest} />
                    )}
                </div>
            </div>
        </div>
    );
}

// Overview Tab
function OverviewTab({ guest }: { guest: Guest }) {
    return (
        <div className="space-y-6">
            <Section title="Contact Information">
                <InfoRow icon={Mail} label="Email" value={guest.email || 'Not provided'} />
                <InfoRow icon={Phone} label="Phone" value={guest.phone || 'Not provided'} />
                <InfoRow icon={MapPin} label="Country" value={guest.country || 'Not provided'} />
            </Section>

            <Section title="Tags">
                {guest.tags && guest.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {guest.tags.map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">No tags assigned</p>
                )}
            </Section>

            <Section title="Plus One">
                {guest.allowPlusOne ? (
                    <div>
                        <p className="text-green-600 text-sm font-medium">Plus one allowed</p>
                        {guest.plusOneName && (
                            <p className="text-slate-700 mt-1">Name: {guest.plusOneName}</p>
                        )}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm">No plus one</p>
                )}
            </Section>

            {guest.notes && (
                <Section title="Notes">
                    <p className="text-slate-700 whitespace-pre-wrap">{guest.notes}</p>
                </Section>
            )}

            {guest.internalComments && (
                <Section title="Internal Comments">
                    <p className="text-slate-600 text-sm bg-slate-50 p-3 rounded-lg">
                        {guest.internalComments}
                    </p>
                </Section>
            )}
        </div>
    );
}

// Events Tab
function EventsTab({ guest, events }: { guest: Guest; events: Event[] }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
                Invited to {events.length} events
            </p>
            {events.map((event) => (
                <div key={event.id} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-slate-900">{event.name}</h4>
                            <p className="text-sm text-slate-500">
                                {new Date(event.eventDate).toLocaleDateString()} at {event.startTime}
                            </p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${guest.globalRsvpStatus === 'yes'
                            ? 'bg-green-100 text-green-700'
                            : guest.globalRsvpStatus === 'no'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                            {guest.globalRsvpStatus === 'yes' ? 'Attending' :
                                guest.globalRsvpStatus === 'no' ? 'Declined' : 'Pending'}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Travel Tab
function TravelTab({ guest }: { guest: Guest }) {
    return (
        <div className="space-y-6">
            <Section title="Arrival">
                <InfoRow icon={Calendar} label="Date" value={guest.arrivalDate || 'Not set'} />
                <InfoRow icon={Clock} label="Time" value={guest.arrivalTime || 'Not set'} />
                <InfoRow icon={Plane} label="Flight" value={guest.arrivalFlight || 'Not provided'} />
                <InfoRow icon={MapPin} label="Origin City" value={guest.originCity || 'Not provided'} />
            </Section>

            <Section title="Departure">
                <InfoRow icon={Calendar} label="Date" value={guest.departureDate || 'Not set'} />
                <InfoRow icon={Clock} label="Time" value={guest.departureTime || 'Not set'} />
                <InfoRow icon={Plane} label="Flight" value={guest.departureFlight || 'Not provided'} />
            </Section>
        </div>
    );
}

// Accommodation Tab
function AccommodationTab({ guest, hotel, room }: { guest: Guest; hotel?: any; room?: any }) {
    return (
        <div className="space-y-6">
            <Section title="Hotel Assignment">
                {hotel ? (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <h4 className="font-medium text-slate-900">{hotel.name}</h4>
                        {hotel.address && <p className="text-sm text-slate-500 mt-1">{hotel.address}</p>}
                    </div>
                ) : (
                    <p className="text-slate-500">No hotel assigned</p>
                )}
            </Section>

            <Section title="Room Assignment">
                {room ? (
                    <div className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-slate-900">Room {room.roomNumber}</h4>
                            <span className="text-sm text-slate-500">{room.roomType}</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-500">No room assigned</p>
                )}
            </Section>

            <Section title="Stay Dates">
                <InfoRow icon={Calendar} label="Check-in" value={guest.checkInDate || 'Not set'} />
                <InfoRow icon={Calendar} label="Check-out" value={guest.checkOutDate || 'Not set'} />
            </Section>

            {guest.accommodationPreference && (
                <Section title="Preferences">
                    <p className="text-slate-700">{guest.accommodationPreference}</p>
                </Section>
            )}
        </div>
    );
}

// Seating Tab
function SeatingTab({ guest, assignedTables }: { guest: Guest; assignedTables: any[] }) {
    return (
        <div className="space-y-4">
            <p className="text-sm text-slate-500 mb-4">
                Table assignments for each event
            </p>

            {assignedTables.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                    <Grid className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                    <p>No table assignments yet</p>
                </div>
            ) : (
                assignedTables.map(({ table, event }, i) => (
                    <div key={i} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-medium text-slate-900">{table?.name || 'Unknown Table'}</h4>
                                <p className="text-sm text-slate-500">{event?.name || 'Unknown Event'}</p>
                            </div>
                            <span className="text-sm text-slate-600">
                                Seat capacity: {table?.capacity || 0}
                            </span>
                        </div>
                    </div>
                ))
            )}

            {guest.avoidSeatingWith && guest.avoidSeatingWith.length > 0 && (
                <Section title="Seating Preferences">
                    <p className="text-sm text-slate-500">Avoid seating with:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {guest.avoidSeatingWith.map((id, i) => (
                            <span key={i} className="px-2 py-1 bg-red-50 text-red-700 text-sm rounded">
                                Guest {id}
                            </span>
                        ))}
                    </div>
                </Section>
            )}
        </div>
    );
}

// Dietary Tab
function DietaryTab({ guest }: { guest: Guest }) {
    return (
        <div className="space-y-6">
            <Section title="Dietary Restrictions">
                {guest.dietaryRestrictions && guest.dietaryRestrictions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {guest.dietaryRestrictions.map((restriction, i) => (
                            <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg flex items-center">
                                <Utensils className="w-4 h-4 mr-1.5" />
                                {restriction}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-slate-500">No dietary restrictions</p>
                )}
            </Section>

            <Section title="Accessibility Needs">
                {guest.accessibilityNeeds ? (
                    <div className="p-4 bg-blue-50 rounded-lg flex items-start">
                        <Accessibility className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                        <p className="text-blue-800">{guest.accessibilityNeeds}</p>
                    </div>
                ) : (
                    <p className="text-slate-500">No accessibility needs specified</p>
                )}
            </Section>
        </div>
    );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">{title}</h3>
            {children}
        </div>
    );
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
    return (
        <div className="flex items-center py-2 border-b border-slate-100 last:border-0">
            <Icon className="w-4 h-4 text-slate-400 mr-3" />
            <span className="text-sm text-slate-500 w-24">{label}</span>
            <span className="text-sm text-slate-900">{value}</span>
        </div>
    );
}
