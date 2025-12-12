'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { ChevronRight, ChevronLeft, Calendar, MapPin, Users, Check } from 'lucide-react';
import type { Event } from '@/types';

const steps = ['Couple Info', 'Venue', 'Events', 'Review'];

export default function OnboardingPage() {
    const router = useRouter();
    const { createWeddingWithData } = useSupabaseSync();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form data
    const [weddingData, setWeddingData] = useState({
        coupleName1: '',
        coupleName2: '',
        weddingStartDate: '',
        weddingEndDate: '',
        estimatedGuestCount: 100,
        primaryTimezone: 'UTC',
        primaryContactEmail: '',
    });

    const [venueData, setVenueData] = useState({
        name: '',
        address: '',
        city: '',
        country: '',
        spaces: [] as Array<{ id: string; name: string; capacity?: number; isIndoor: boolean }>,
    });

    const [eventsData, setEventsData] = useState<Array<{
        name: string;
        eventType: Event['eventType'];
        eventDate: string;
        startTime: string;
    }>>([
        { name: 'Ceremony', eventType: 'ceremony', eventDate: '', startTime: '' },
        { name: 'Reception', eventType: 'reception', eventDate: '', startTime: '' },
    ]);

    const handleFinish = async () => {
        setLoading(true);
        setError('');

        try {
            await createWeddingWithData(weddingData, venueData, eventsData);
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create wedding');
        } finally {
            setLoading(false);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return weddingData.coupleName1 && weddingData.coupleName2;
            case 1:
                return venueData.name;
            case 2:
                return eventsData.some(e => e.name && e.eventDate);
            default:
                return true;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        W
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Welcome to Wedding Ops</h1>
                    <p className="text-slate-600 mt-2">Let's set up your wedding</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {steps.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index < currentStep ? 'bg-primary-600 text-white' :
                                    index === currentStep ? 'bg-primary-600 text-white' :
                                        'bg-slate-200 text-slate-500'
                                }`}>
                                {index < currentStep ? <Check className="w-4 h-4" /> : index + 1}
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`w-12 h-0.5 mx-2 ${index < currentStep ? 'bg-primary-600' : 'bg-slate-200'
                                    }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Form Card */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6">{steps[currentStep]}</h2>

                    {/* Step 0: Couple Info */}
                    {currentStep === 0 && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Partner 1 Name *</label>
                                    <input
                                        type="text"
                                        value={weddingData.coupleName1}
                                        onChange={(e) => setWeddingData({ ...weddingData, coupleName1: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Partner 2 Name *</label>
                                    <input
                                        type="text"
                                        value={weddingData.coupleName2}
                                        onChange={(e) => setWeddingData({ ...weddingData, coupleName2: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Start Date</label>
                                    <input
                                        type="date"
                                        value={weddingData.weddingStartDate}
                                        onChange={(e) => setWeddingData({ ...weddingData, weddingStartDate: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">End Date</label>
                                    <input
                                        type="date"
                                        value={weddingData.weddingEndDate}
                                        onChange={(e) => setWeddingData({ ...weddingData, weddingEndDate: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Estimated Guest Count</label>
                                <input
                                    type="number"
                                    value={weddingData.estimatedGuestCount}
                                    onChange={(e) => setWeddingData({ ...weddingData, estimatedGuestCount: parseInt(e.target.value) || 0 })}
                                    className="input"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 1: Venue */}
                    {currentStep === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="label">Venue Name *</label>
                                <input
                                    type="text"
                                    value={venueData.name}
                                    onChange={(e) => setVenueData({ ...venueData, name: e.target.value })}
                                    className="input"
                                    placeholder="e.g., The Grand Ballroom"
                                />
                            </div>
                            <div>
                                <label className="label">Address</label>
                                <input
                                    type="text"
                                    value={venueData.address}
                                    onChange={(e) => setVenueData({ ...venueData, address: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label">City</label>
                                    <input
                                        type="text"
                                        value={venueData.city}
                                        onChange={(e) => setVenueData({ ...venueData, city: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Country</label>
                                    <input
                                        type="text"
                                        value={venueData.country}
                                        onChange={(e) => setVenueData({ ...venueData, country: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Events */}
                    {currentStep === 2 && (
                        <div className="space-y-4">
                            {eventsData.map((event, index) => (
                                <div key={index} className="p-4 bg-slate-50 rounded-lg">
                                    <div className="flex gap-3 items-end">
                                        <div className="flex-1">
                                            <label className="label">Event Name</label>
                                            <input
                                                type="text"
                                                value={event.name}
                                                onChange={(e) => {
                                                    const updated = [...eventsData];
                                                    updated[index].name = e.target.value;
                                                    setEventsData(updated);
                                                }}
                                                className="input"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="label">Date</label>
                                            <input
                                                type="date"
                                                value={event.eventDate}
                                                onChange={(e) => {
                                                    const updated = [...eventsData];
                                                    updated[index].eventDate = e.target.value;
                                                    setEventsData(updated);
                                                }}
                                                className="input"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label className="label">Start Time</label>
                                            <input
                                                type="time"
                                                value={event.startTime}
                                                onChange={(e) => {
                                                    const updated = [...eventsData];
                                                    updated[index].startTime = e.target.value;
                                                    setEventsData(updated);
                                                }}
                                                className="input"
                                            />
                                        </div>
                                        {eventsData.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = eventsData.filter((_, i) => i !== index);
                                                    setEventsData(updated);
                                                }}
                                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg mb-0.5"
                                                title="Remove event"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            <button
                                onClick={() => setEventsData([...eventsData, { name: '', eventType: 'other', eventDate: '', startTime: '' }])}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                            >
                                + Add Another Event
                            </button>
                        </div>
                    )}

                    {/* Step 3: Review */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Couple</span>
                                </div>
                                <p>{weddingData.coupleName1} & {weddingData.coupleName2}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Venue</span>
                                </div>
                                <p>{venueData.name}</p>
                                {venueData.address && <p className="text-sm text-slate-600">{venueData.address}</p>}
                            </div>
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Events ({eventsData.filter(e => e.name).length})</span>
                                </div>
                                {eventsData.filter(e => e.name).map((event, i) => (
                                    <p key={i}>{event.name} - {event.eventDate || 'TBD'}</p>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setCurrentStep(currentStep - 1)}
                            disabled={currentStep === 0}
                            className="btn-secondary flex items-center gap-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back
                        </button>

                        {currentStep < steps.length - 1 ? (
                            <button
                                onClick={() => setCurrentStep(currentStep + 1)}
                                disabled={!canProceed()}
                                className="btn-primary flex items-center gap-2"
                            >
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className="btn-primary flex items-center gap-2"
                            >
                                {loading ? 'Creating...' : 'Finish Setup'}
                                <Check className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
