import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseSync } from '../hooks/useSupabaseSync';
import { ChevronRight, ChevronLeft } from 'lucide-react';

type EventType = 'ceremony' | 'reception' | 'party';

export default function Onboarding() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const { createWeddingWithData } = useSupabaseSync();

    // Form state
    const [weddingData, setWeddingData] = useState({
        coupleName1: '',
        coupleName2: '',
        startDate: '',
        endDate: '',
        timezone: 'America/New_York',
        estimatedGuests: 200,
        contactEmail: '',
    });

    const [eventsData, setEventsData] = useState<{ name: string; date: string; time: string; type: EventType }[]>([
        { name: 'Welcome Dinner', date: '', time: '19:00', type: 'party' },
        { name: 'Wedding Ceremony', date: '', time: '16:00', type: 'ceremony' },
        { name: 'Reception', date: '', time: '18:00', type: 'reception' },
    ]);

    const handleWeddingChange = (field: string, value: string | number) => {
        setWeddingData((prev) => ({ ...prev, [field]: value }));
    };

    const handleEventChange = (index: number, field: string, value: string) => {
        const updated = [...eventsData];
        updated[index] = { ...updated[index], [field]: value };
        setEventsData(updated);
    };

    const addEventRow = () => {
        // Use wedding start date as default for new events
        setEventsData([...eventsData, { name: '', date: weddingData.startDate || '', time: '10:00', type: 'party' }]);
    };

    const removeEventRow = (index: number) => {
        setEventsData(eventsData.filter((_, i) => i !== index));
    };

    // Auto-populate event dates when moving from step 1 to step 2
    const goToStep = (newStep: number) => {
        if (step === 1 && newStep === 2 && weddingData.startDate && weddingData.endDate) {
            // Calculate dates for events based on wedding dates
            const startDate = new Date(weddingData.startDate);
            const endDate = new Date(weddingData.endDate);
            const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            const updated = eventsData.map((event, idx) => {
                if (!event.date) {
                    let eventDate = new Date(startDate);
                    if (daysDiff >= 2) {
                        // Multi-day wedding: spread events across days
                        if (idx === 0) eventDate = new Date(startDate); // Welcome dinner on start
                        else if (idx === 1) {
                            eventDate = new Date(endDate); // Ceremony on last day
                        }
                        else if (idx === 2) {
                            eventDate = new Date(endDate); // Reception on last day
                        }
                        else eventDate = new Date(startDate);
                    } else {
                        // Single day wedding: all on same day
                        eventDate = new Date(startDate);
                    }
                    return { ...event, date: eventDate.toISOString().split('T')[0] };
                }
                return event;
            });
            setEventsData(updated);
        }
        setStep(newStep);
    };

    const handleFinish = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            // Prepare wedding data
            const weddingPayload = {
                coupleName1: weddingData.coupleName1,
                coupleName2: weddingData.coupleName2,
                weddingStartDate: weddingData.startDate,
                weddingEndDate: weddingData.endDate,
                primaryTimezone: weddingData.timezone,
                estimatedGuestCount: weddingData.estimatedGuests,
                primaryContactEmail: weddingData.contactEmail,
            };

            // Prepare venue data
            const venuePayload = {
                name: 'Main Venue',
                address: '',
                spaces: [],
            };

            // Prepare events data
            const eventsPayload = eventsData
                .filter((e) => e.name && e.date)
                .map((e) => ({
                    name: e.name,
                    eventType: e.type,
                    eventDate: e.date,
                    startTime: e.time,
                    venueId: '', // Will be set by createWeddingWithData
                }));

            // Create everything in Supabase (or local store as fallback)
            await createWeddingWithData(weddingPayload, venuePayload, eventsPayload);

            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to create wedding:', err);
            setError(err instanceof Error ? err.message : 'Failed to create wedding. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="card">
            {/* Progress bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700">Step {step} of 3</span>
                    <span className="text-sm text-slate-500">{Math.round((step / 3) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>
            </div>

            {/* Step 1: Wedding Basics */}
            {step === 1 && (
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Wedding Basics</h2>
                    <p className="text-slate-600 mb-6">Let's start with some basic information about the wedding.</p>

                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Partner 1 Name</label>
                                <input
                                    type="text"
                                    value={weddingData.coupleName1}
                                    onChange={(e) => handleWeddingChange('coupleName1', e.target.value)}
                                    className="input"
                                    placeholder="Alex"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">Partner 2 Name</label>
                                <input
                                    type="text"
                                    value={weddingData.coupleName2}
                                    onChange={(e) => handleWeddingChange('coupleName2', e.target.value)}
                                    className="input"
                                    placeholder="Jordan"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label">Start Date</label>
                                <input
                                    type="date"
                                    value={weddingData.startDate}
                                    onChange={(e) => handleWeddingChange('startDate', e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>
                            <div>
                                <label className="label">End Date</label>
                                <input
                                    type="date"
                                    value={weddingData.endDate}
                                    onChange={(e) => handleWeddingChange('endDate', e.target.value)}
                                    className="input"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Primary Timezone</label>
                            <select
                                value={weddingData.timezone}
                                onChange={(e) => handleWeddingChange('timezone', e.target.value)}
                                className="input"
                            >
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="America/Phoenix">Arizona Time (MST)</option>
                                <option value="Europe/London">London (GMT)</option>
                                <option value="Asia/Kolkata">India (IST)</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Estimated Guest Count</label>
                            <input
                                type="number"
                                value={weddingData.estimatedGuests}
                                onChange={(e) => handleWeddingChange('estimatedGuests', parseInt(e.target.value))}
                                className="input"
                                min="1"
                                required
                            />
                        </div>

                        <div>
                            <label className="label">Primary Contact Email</label>
                            <input
                                type="email"
                                value={weddingData.contactEmail}
                                onChange={(e) => handleWeddingChange('contactEmail', e.target.value)}
                                className="input"
                                placeholder="contact@wedding.com"
                                required
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Create Events */}
            {step === 2 && (
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Create Events</h2>
                    <p className="text-slate-600 mb-6">Add the events you're planning. You can edit these later.</p>

                    <div className="space-y-4">
                        {eventsData.map((event, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-lg">
                                <div className="flex flex-col gap-4">
                                    {/* Event Name - Full Width */}
                                    <div>
                                        <label className="label">Event Name</label>
                                        <input
                                            type="text"
                                            value={event.name}
                                            onChange={(e) => handleEventChange(index, 'name', e.target.value)}
                                            className="input"
                                            placeholder="e.g., Reception"
                                        />
                                    </div>

                                    {/* Date, Time, and Remove in a row */}
                                    <div className="flex flex-wrap items-end gap-3">
                                        <div className="flex-1 min-w-[140px]">
                                            <label className="label">Date</label>
                                            <input
                                                type="date"
                                                value={event.date}
                                                onChange={(e) => handleEventChange(index, 'date', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        <div className="w-[100px]">
                                            <label className="label">Time</label>
                                            <input
                                                type="time"
                                                value={event.time}
                                                onChange={(e) => handleEventChange(index, 'time', e.target.value)}
                                                className="input"
                                            />
                                        </div>
                                        {eventsData.length > 1 && (
                                            <button
                                                onClick={() => removeEventRow(index)}
                                                className="btn-secondary h-10 px-3 text-sm whitespace-nowrap"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button onClick={addEventRow} className="btn-secondary w-full">
                            + Add Another Event
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">You're All Set!</h2>
                    <p className="text-slate-600 mb-6">
                        Your wedding workspace is ready. Let's start managing your operations.
                    </p>
                    <div className="bg-slate-50 rounded-lg p-4 text-left space-y-2 mb-6">
                        <div className="flex justify-between">
                            <span className="text-slate-600">Couple:</span>
                            <span className="font-medium">{weddingData.coupleName1} & {weddingData.coupleName2}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Dates:</span>
                            <span className="font-medium">{weddingData.startDate} to {weddingData.endDate}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Events:</span>
                            <span className="font-medium">{eventsData.filter(e => e.name && e.date).length} events</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-600">Estimated Guests:</span>
                            <span className="font-medium">{weddingData.estimatedGuests}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t">
                {step > 1 ? (
                    <button
                        onClick={() => goToStep(step - 1)}
                        className="btn-secondary flex items-center"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </button>
                ) : (
                    <div />
                )}

                {step < 3 ? (
                    <button
                        onClick={() => goToStep(step + 1)}
                        className="btn-primary flex items-center"
                        disabled={
                            (step === 1 &&
                                (!weddingData.coupleName1 ||
                                    !weddingData.coupleName2 ||
                                    !weddingData.startDate ||
                                    !weddingData.endDate ||
                                    !weddingData.contactEmail)) ||
                            (step === 2 && eventsData.filter((e) => e.name).length === 0)
                        }
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                ) : (
                    <div className="flex flex-col items-end">
                        {error && (
                            <p className="text-red-600 text-sm mb-2">{error}</p>
                        )}
                        <button
                            onClick={handleFinish}
                            className="btn-primary flex items-center"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Creating...
                                </>
                            ) : (
                                'Go to Dashboard'
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
