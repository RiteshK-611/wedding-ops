import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Calendar, Check, X, HelpCircle, Loader2, UtensilsCrossed, Accessibility } from 'lucide-react';
import {
    getGuestByToken,
    getWeddingEvents,
    getWeddingDetails,
    getGuestRsvps,
    submitRsvp,
} from '../services/rsvpService';
import type { Tables } from '../types/supabase';

type Guest = Tables<'guests'>;
type Event = Tables<'events'>;

type RsvpStatus = 'yes' | 'no' | 'maybe';

interface EventResponse {
    eventId: string;
    eventName: string;
    eventDate: string | null;
    status: RsvpStatus | null;
}

export default function RSVPPortal() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [guest, setGuest] = useState<Guest | null>(null);
    const [wedding, setWedding] = useState<{ partner1_name: string; partner2_name: string } | null>(null);
    const [, setEvents] = useState<Event[]>([]);
    const [responses, setResponses] = useState<EventResponse[]>([]);

    const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
    const [customDietary, setCustomDietary] = useState('');
    const [accessibilityNeeds, setAccessibilityNeeds] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [departureDate, setDepartureDate] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid RSVP link');
            setLoading(false);
            return;
        }

        loadRsvpData();
    }, [token]);

    async function loadRsvpData() {
        try {
            setLoading(true);

            // Fetch guest
            const guestData = await getGuestByToken(token!);
            if (!guestData) {
                setError('Invalid or expired RSVP link');
                return;
            }
            setGuest(guestData);
            setDietaryRestrictions(guestData.dietary_restrictions || []);
            setAccessibilityNeeds(guestData.accessibility_needs || '');
            setArrivalDate(guestData.arrival_date || '');
            setDepartureDate(guestData.departure_date || '');

            // Fetch wedding details
            const weddingData = await getWeddingDetails(guestData.wedding_id);
            if (weddingData) {
                setWedding(weddingData);
            }

            // Fetch events
            const eventsData = await getWeddingEvents(guestData.wedding_id);
            setEvents(eventsData);

            // Fetch existing RSVPs
            const existingRsvps = await getGuestRsvps(guestData.id);

            // Build responses array
            const responseList = eventsData.map((event) => {
                const existing = existingRsvps.find((r) => r.event_id === event.id);
                return {
                    eventId: event.id,
                    eventName: event.name,
                    eventDate: event.event_date,
                    status: existing?.status as RsvpStatus | null,
                };
            });
            setResponses(responseList);
        } catch (err) {
            setError('Failed to load RSVP data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    function updateResponse(eventId: string, status: RsvpStatus) {
        setResponses((prev) =>
            prev.map((r) => (r.eventId === eventId ? { ...r, status } : r))
        );
    }

    function toggleDietary(restriction: string) {
        setDietaryRestrictions((prev) =>
            prev.includes(restriction)
                ? prev.filter((r) => r !== restriction)
                : [...prev, restriction]
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!guest) return;

        // Validate at least one response
        const answeredResponses = responses.filter((r) => r.status !== null);
        if (answeredResponses.length === 0) {
            setError('Please respond to at least one event');
            return;
        }

        setSubmitting(true);
        setError(null);

        const allDietary = customDietary
            ? [...dietaryRestrictions, customDietary]
            : dietaryRestrictions;

        const result = await submitRsvp(
            guest.id,
            answeredResponses.map((r) => ({
                eventId: r.eventId,
                status: r.status!,
            })),
            {
                dietaryRestrictions: allDietary,
                accessibilityNeeds,
                arrivalDate: arrivalDate || undefined,
                departureDate: departureDate || undefined,
            }
        );

        setSubmitting(false);

        if (result.success) {
            navigate('/rsvp/success');
        } else {
            setError(result.error || 'Failed to submit RSVP');
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading your invitation...</p>
                </div>
            </div>
        );
    }

    if (error && !guest) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
                    <p className="text-slate-600">{error}</p>
                </div>
            </div>
        );
    }

    const commonDietaryOptions = [
        'Vegetarian',
        'Vegan',
        'Gluten-free',
        'Dairy-free',
        'Nut allergy',
        'Halal',
        'Kosher',
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-primary-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        {wedding ? `${wedding.partner1_name} & ${wedding.partner2_name}` : 'Wedding RSVP'}
                    </h1>
                    <p className="text-lg text-slate-600">
                        Dear {guest?.first_name}, you're invited to celebrate with us!
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Event RSVPs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-primary-600" />
                            Your Response
                        </h2>
                        <p className="text-slate-600 mb-6">
                            Please let us know if you'll be able to attend each event:
                        </p>

                        <div className="space-y-4">
                            {responses.map((response) => (
                                <div
                                    key={response.eventId}
                                    className="p-4 border border-slate-200 rounded-lg"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h3 className="font-medium text-slate-900">{response.eventName}</h3>
                                            {response.eventDate && (
                                                <p className="text-sm text-slate-500">
                                                    {new Date(response.eventDate).toLocaleDateString('en-US', {
                                                        weekday: 'long',
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => updateResponse(response.eventId, 'yes')}
                                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${response.status === 'yes'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-green-50 hover:text-green-600'
                                                    }`}
                                            >
                                                <Check className="w-4 h-4 mr-1" />
                                                Yes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateResponse(response.eventId, 'no')}
                                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${response.status === 'no'
                                                    ? 'bg-red-600 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600'
                                                    }`}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                No
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateResponse(response.eventId, 'maybe')}
                                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${response.status === 'maybe'
                                                    ? 'bg-amber-500 text-white'
                                                    : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-600'
                                                    }`}
                                            >
                                                <HelpCircle className="w-4 h-4 mr-1" />
                                                Maybe
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dietary Restrictions */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                            <UtensilsCrossed className="w-5 h-5 mr-2 text-primary-600" />
                            Dietary Requirements
                        </h2>
                        <div className="flex flex-wrap gap-2 mb-4">
                            {commonDietaryOptions.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => toggleDietary(option)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${dietaryRestrictions.includes(option)
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-primary-50'
                                        }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            placeholder="Other dietary requirements..."
                            value={customDietary}
                            onChange={(e) => setCustomDietary(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Accessibility Needs */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center">
                            <Accessibility className="w-5 h-5 mr-2 text-primary-600" />
                            Accessibility Needs
                        </h2>
                        <textarea
                            placeholder="Please let us know if you have any accessibility requirements..."
                            value={accessibilityNeeds}
                            onChange={(e) => setAccessibilityNeeds(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    {/* Travel Dates (Optional) */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <h2 className="text-xl font-semibold text-slate-900 mb-4">
                            Travel Dates (Optional)
                        </h2>
                        <p className="text-slate-600 mb-4 text-sm">
                            Help us plan transport and accommodations by sharing your travel dates.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Arrival Date
                                </label>
                                <input
                                    type="date"
                                    value={arrivalDate}
                                    onChange={(e) => setArrivalDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Departure Date
                                </label>
                                <input
                                    type="date"
                                    value={departureDate}
                                    onChange={(e) => setDepartureDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-primary-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                Submitting...
                            </>
                        ) : (
                            'Submit RSVP'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
