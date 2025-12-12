import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useSupabaseActions } from '../hooks/useSupabaseSync';
import type { Event } from '../types';
import { Calendar, Plus, Edit, Trash2, X, Clock, Users, Grid } from 'lucide-react';

export default function Events() {
    const navigate = useNavigate();
    const events = useStore((state) => state.events);
    const currentWedding = useStore((state) => state.currentWedding);
    const tables = useStore((state) => state.tables);
    const tableAssignments = useStore((state) => state.tableAssignments);
    const guests = useStore((state) => state.guests);

    // Use Supabase-synced actions
    const { addEvent, deleteEvent } = useSupabaseActions();
    const updateEvent = useStore((state) => state.updateEvent); // Keep local for now

    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    // Get seating stats for an event
    const getSeatingStats = (eventId: string) => {
        const eventTables = tables.filter(t => t.eventId === eventId);
        const seatedCount = tableAssignments.filter(a =>
            eventTables.some(t => t.id === a.tableId)
        ).length;
        const confirmedGuests = guests.filter(g => g.globalRsvpStatus === 'yes').length;
        return { tables: eventTables.length, seated: seatedCount, total: confirmedGuests };
    };

    const handleAdd = async (formData: Partial<Event>) => {
        const eventData = {
            weddingId: currentWedding?.id || '1',
            name: formData.name || '',
            eventType: formData.eventType || 'other',
            eventDate: formData.eventDate || '',
            startTime: formData.startTime || '',
            endTime: formData.endTime,
            venueId: formData.venueId,
            description: formData.description,
            dressCode: formData.dressCode,
            capacityEstimate: formData.capacityEstimate,
        };
        await addEvent(eventData);
        setShowModal(false);
    };

    const handleUpdate = (formData: Partial<Event>) => {
        if (editingEvent) {
            updateEvent(editingEvent.id, formData);
            setEditingEvent(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            await deleteEvent(id);
        }
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'ceremony': return 'bg-purple-100 text-purple-700';
            case 'reception': return 'bg-pink-100 text-pink-700';
            case 'party': return 'bg-amber-100 text-amber-700';
            case 'casual': return 'bg-green-100 text-green-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Events</h1>
                    <p className="text-slate-600 mt-1">{events.length} events planned</p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Event
                </button>
            </div>

            {events.length === 0 ? (
                <div className="card text-center py-12">
                    <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No events yet</h3>
                    <p className="text-slate-500 mb-4">Create your first event to start planning</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        Add Event
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedEvents.map((event) => {
                        const stats = getSeatingStats(event.id);

                        return (
                            <div key={event.id} className="card hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <button
                                            onClick={() => setEditingEvent(event)}
                                            className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(event.id)}
                                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getEventTypeColor(event.eventType)}`}>
                                    {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                                </span>

                                <h3 className="text-lg font-semibold text-slate-900 mt-2">{event.name}</h3>

                                <div className="mt-3 space-y-2 text-sm text-slate-600">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        {new Date(event.eventDate).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="w-4 h-4 mr-2" />
                                        {event.startTime}{event.endTime && ` - ${event.endTime}`}
                                    </div>
                                    {event.dressCode && (
                                        <div className="text-xs text-slate-500">
                                            Dress Code: {event.dressCode}
                                        </div>
                                    )}
                                </div>

                                {event.description && (
                                    <p className="mt-3 text-sm text-slate-500 line-clamp-2">{event.description}</p>
                                )}

                                {/* Seating Stats & Link */}
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center text-sm text-slate-600">
                                            <Users className="w-4 h-4 mr-1" />
                                            <span>{stats.seated}/{stats.total} seated</span>
                                            <span className="mx-2">·</span>
                                            <span>{stats.tables} tables</span>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/events/${event.id}/seating`)}
                                            className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                                        >
                                            <Grid className="w-4 h-4 mr-1" />
                                            Seating Plan
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add/Edit Modal */}
            {(showModal || editingEvent) && (
                <EventFormModal
                    event={editingEvent}
                    onSave={editingEvent ? handleUpdate : handleAdd}
                    onClose={() => {
                        setShowModal(false);
                        setEditingEvent(null);
                    }}
                />
            )}
        </div>
    );
}

// Event Form Modal
function EventFormModal({
    event,
    onSave,
    onClose,
}: {
    event: Event | null;
    onSave: (data: Partial<Event>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Event>>(
        event || {
            name: '',
            eventType: 'party',
            eventDate: '',
            startTime: '',
            endTime: '',
            description: '',
            dressCode: '',
            capacityEstimate: undefined,
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (field: keyof Event, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {event ? 'Edit Event' : 'Add Event'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Event Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            className="input"
                            placeholder="e.g., Wedding Reception"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Event Type *</label>
                        <select
                            value={formData.eventType}
                            onChange={(e) => handleChange('eventType', e.target.value)}
                            className="input"
                        >
                            <option value="ceremony">Ceremony</option>
                            <option value="reception">Reception</option>
                            <option value="party">Party</option>
                            <option value="casual">Casual</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Date *</label>
                            <input
                                type="date"
                                value={formData.eventDate}
                                onChange={(e) => handleChange('eventDate', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Start Time *</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">End Time</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Capacity</label>
                            <input
                                type="number"
                                value={formData.capacityEstimate || ''}
                                onChange={(e) => handleChange('capacityEstimate', parseInt(e.target.value) || undefined)}
                                className="input"
                                placeholder="e.g., 200"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Dress Code</label>
                        <input
                            type="text"
                            value={formData.dressCode}
                            onChange={(e) => handleChange('dressCode', e.target.value)}
                            className="input"
                            placeholder="e.g., Black Tie, Casual, Indian Attire"
                        />
                    </div>

                    <div>
                        <label className="label">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="input min-h-[80px]"
                            placeholder="Event details, notes, etc."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {event ? 'Update Event' : 'Add Event'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
