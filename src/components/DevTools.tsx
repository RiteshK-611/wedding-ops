import { useStore } from '../store';
import { generateTestData } from '../utils/testData';
import { Database, Trash2 } from 'lucide-react';

export default function DevTools() {
    const store = useStore();
    const guests = useStore((state) => state.guests);

    const seedData = () => {
        const data = generateTestData();
        store.setCurrentWedding(data.wedding);
        store.setEvents(data.events);
        store.setGuests(data.guests);
        store.setVenues(data.venues);
        store.setHotels(data.hotels);
        alert(`Test data seeded!\n- ${data.guests.length} guests\n- ${data.events.length} events\n- ${data.hotels.length} hotels`);
    };

    const clearData = () => {
        if (confirm('Clear all data? This cannot be undone.')) {
            localStorage.removeItem('wedding-ops-storage');
            window.location.reload();
        }
    };

    return (
        <div className="fixed bottom-4 right-4 flex gap-2 z-50">
            <button
                onClick={seedData}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 text-sm font-medium"
                title="Seed 220+ test guests"
            >
                <Database className="w-4 h-4" />
                Seed Data ({guests.length})
            </button>
            <button
                onClick={clearData}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg shadow-lg hover:bg-red-700 text-sm font-medium"
                title="Clear all data"
            >
                <Trash2 className="w-4 h-4" />
                Clear
            </button>
        </div>
    );
}
