import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { Users, Calendar, Hotel, Bus, ChevronRight, AlertCircle } from 'lucide-react';

export default function Dashboard() {
    const currentWedding = useStore((state) => state.currentWedding);
    const guests = useStore((state) => state.guests);
    const events = useStore((state) => state.events);
    const hotels = useStore((state) => state.hotels);

    // Calculate metrics
    const metrics = useMemo(() => {
        const confirmed = guests.filter((g) => g.globalRsvpStatus === 'yes').length;
        const declined = guests.filter((g) => g.globalRsvpStatus === 'no').length;
        const pending = guests.filter((g) => g.globalRsvpStatus === 'pending').length;
        const responseRate = guests.length > 0 ? ((confirmed + declined) / guests.length) * 100 : 0;

        return {
            totalGuests: guests.length,
            confirmed,
            declined,
            pending,
            responseRate,
            totalEvents: events.length,
            totalHotels: hotels.length,
        };
    }, [guests, events, hotels]);

    // Calculate days until wedding
    const daysUntil = useMemo(() => {
        if (!currentWedding?.weddingStartDate) return null;
        const today = new Date();
        const weddingDate = new Date(currentWedding.weddingStartDate);
        const diff = Math.ceil((weddingDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diff;
    }, [currentWedding]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                {daysUntil !== null && (
                    <p className="text-slate-600 mt-1">
                        {daysUntil > 0
                            ? `${daysUntil} days until the wedding`
                            : daysUntil === 0
                                ? "It's the wedding day!"
                                : 'Wedding has passed'}
                    </p>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary-600" />
                        </div>
                        <Link to="/guests" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{metrics.totalGuests}</div>
                    <div className="text-sm text-slate-600 mt-1">Total Guests</div>
                    <div className="mt-3 text-sm">
                        <span className="text-green-600 font-medium">{metrics.confirmed} confirmed</span>
                        <span className="text-slate-400 mx-2">·</span>
                        <span className="text-slate-600">{metrics.pending} pending</span>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-indigo-600" />
                        </div>
                        <Link to="/events" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{metrics.totalEvents}</div>
                    <div className="text-sm text-slate-600 mt-1">Events Planned</div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <Hotel className="w-5 h-5 text-emerald-600" />
                        </div>
                        <Link
                            to="/accommodations"
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            View all
                        </Link>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{metrics.totalHotels}</div>
                    <div className="text-sm text-slate-600 mt-1">Hotels</div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <Bus className="w-5 h-5 text-amber-600" />
                        </div>
                        <Link to="/transport" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                            View all
                        </Link>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">0</div>
                    <div className="text-sm text-slate-600 mt-1">Transport Routes</div>
                </div>
            </div>

            {/* RSVP Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">RSVP Progress</h3>
                    <div className="space-y-4">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-slate-600">Response Rate</span>
                                <span className="font-medium text-slate-900">{metrics.responseRate.toFixed(0)}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                                <div
                                    className="bg-primary-600 h-2 rounded-full transition-all"
                                    style={{ width: `${metrics.responseRate}%` }}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-4">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{metrics.confirmed}</div>
                                <div className="text-xs text-slate-600 mt-1">Confirmed</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{metrics.declined}</div>
                                <div className="text-xs text-slate-600 mt-1">Declined</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-slate-400">{metrics.pending}</div>
                                <div className="text-xs text-slate-600 mt-1">No Response</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link
                            to="/guests"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Users className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-900">Add Guests</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>

                        <Link
                            to="/events"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Calendar className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-900">Create Event</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>

                        <Link
                            to="/accommodations"
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            <div className="flex items-center space-x-3">
                                <Hotel className="w-5 h-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-900">Add Hotel</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Alerts */}
            {metrics.totalGuests === 0 && (
                <div className="card bg-amber-50 border-amber-200">
                    <div className="flex items-start space-x-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                        <div>
                            <h4 className="font-medium text-amber-900">Get started by adding guests</h4>
                            <p className="text-sm text-amber-700 mt-1">
                                Import your guest list or add guests manually to start managing your wedding operations.
                            </p>
                            <Link to="/guests" className="text-sm text-amber-900 font-medium mt-2 inline-block hover:underline">
                                Go to Guests →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Event Timeline */}
            {events.length > 0 && (
                <div className="card">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Upcoming Events</h3>
                    <div className="space-y-3">
                        {events
                            .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
                            .slice(0, 5)
                            .map((event) => (
                                <div key={event.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                    <div>
                                        <div className="font-medium text-slate-900">{event.name}</div>
                                        <div className="text-sm text-slate-600 mt-0.5">
                                            {new Date(event.eventDate).toLocaleDateString()} at {event.startTime}
                                        </div>
                                    </div>
                                    <Link to={`/events`} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                                        Details
                                    </Link>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
