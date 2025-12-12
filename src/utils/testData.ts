// Test Data Seed Script for Wedding Ops
// This creates 200+ guests, 5 events, and realistic wedding data

export function generateTestData() {
    const weddingId = '1';
    const now = new Date().toISOString();

    // Wedding dates (2 months from now)
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() + 2);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);

    // Wedding
    const wedding = {
        id: weddingId,
        coupleName1: 'Alex',
        coupleName2: 'Jordan',
        weddingStartDate: startDate.toISOString().split('T')[0],
        weddingEndDate: endDate.toISOString().split('T')[0],
        primaryTimezone: 'America/New_York',
        estimatedGuestCount: 250,
        primaryContactEmail: 'alex.jordan@wedding.com',
        createdAt: now,
        updatedAt: now,
    };

    // 5 Events
    const events: Array<{
        id: string;
        weddingId: string;
        name: string;
        eventType: 'ceremony' | 'reception' | 'party' | 'casual' | 'other';
        eventDate: string;
        startTime: string;
        endTime: string;
        venueId: string;
        capacityEstimate: number;
        dressCode: string;
        createdAt: string;
        updatedAt: string;
    }> = [
            {
                id: '1',
                weddingId,
                name: 'Welcome Dinner',
                eventType: 'party',
                eventDate: startDate.toISOString().split('T')[0],
                startTime: '19:00',
                endTime: '22:00',
                venueId: '1',
                capacityEstimate: 150,
                dressCode: 'Smart Casual',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '2',
                weddingId,
                name: 'Sangeet Night',
                eventType: 'party',
                eventDate: startDate.toISOString().split('T')[0],
                startTime: '20:00',
                endTime: '01:00',
                venueId: '1',
                capacityEstimate: 200,
                dressCode: 'Indian Attire',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '3',
                weddingId,
                name: 'Wedding Ceremony',
                eventType: 'ceremony',
                eventDate: new Date(startDate.getTime() + 86400000).toISOString().split('T')[0],
                startTime: '16:00',
                endTime: '18:00',
                venueId: '2',
                capacityEstimate: 250,
                dressCode: 'Formal',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '4',
                weddingId,
                name: 'Reception',
                eventType: 'reception',
                eventDate: new Date(startDate.getTime() + 86400000).toISOString().split('T')[0],
                startTime: '19:00',
                endTime: '01:00',
                venueId: '2',
                capacityEstimate: 250,
                dressCode: 'Black Tie',
                createdAt: now,
                updatedAt: now,
            },
            {
                id: '5',
                weddingId,
                name: 'Farewell Brunch',
                eventType: 'casual',
                eventDate: new Date(startDate.getTime() + 172800000).toISOString().split('T')[0],
                startTime: '10:00',
                endTime: '13:00',
                venueId: '3',
                capacityEstimate: 100,
                dressCode: 'Casual',
                createdAt: now,
                updatedAt: now,
            },
        ];

    // Guest data arrays for realistic generation
    const firstNames = [
        'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
        'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
        'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
        'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
        'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
        'Priya', 'Raj', 'Ananya', 'Vikram', 'Neha', 'Arjun', 'Pooja', 'Amit',
        'Ravi', 'Deepa', 'Suresh', 'Kavita', 'Arun', 'Meera', 'Sanjay', 'Anjali',
        'Wei', 'Mei', 'Chen', 'Li', 'Yuki', 'Hiro', 'Sakura', 'Kenji',
    ];

    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
        'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
        'Patel', 'Shah', 'Kumar', 'Singh', 'Sharma', 'Gupta', 'Kapoor', 'Joshi',
        'Reddy', 'Nair', 'Menon', 'Iyer', 'Rao', 'Desai', 'Mehta', 'Chopra',
        'Wang', 'Zhang', 'Liu', 'Chen', 'Tanaka', 'Yamamoto', 'Suzuki', 'Watanabe',
    ];

    const relationships = [
        "Bride's Family", "Groom's Family", "Bride's Friend", "Groom's Friend",
        "Bride's Colleague", "Groom's Colleague", "Family Friend", "Neighbor",
        "College Friend", "Childhood Friend", "Business Partner", "Relative",
    ];

    const tags = [
        'VIP', "Bride's Side", "Groom's Side", 'Family', 'Friends', 'Colleagues',
        'Out of Town', 'Local', 'Plus One Allowed', 'Special Diet',
    ];

    const dietaryOptions = [
        [], [], [], [], [], // Most people have no dietary restrictions
        ['Vegetarian'],
        ['Vegan'],
        ['Gluten-Free'],
        ['Halal'],
        ['Kosher'],
        ['Nut Allergy'],
        ['Dairy-Free'],
        ['Vegetarian', 'Gluten-Free'],
    ];

    const countries = [
        'USA', 'USA', 'USA', 'USA', 'USA', // Weight towards USA
        'India', 'India', 'India',
        'UK', 'Canada', 'Australia', 'Germany', 'France', 'Japan', 'China',
    ];

    const rsvpStatuses: Array<'pending' | 'yes' | 'no' | 'maybe'> = ['pending', 'yes', 'yes', 'yes', 'no', 'maybe'];

    // Generate 220 guests
    const guests = [];
    const householdCount = 80; // About 80 households

    for (let i = 0; i < 220; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const relationship = relationships[Math.floor(Math.random() * relationships.length)];
        const country = countries[Math.floor(Math.random() * countries.length)];
        const dietary = dietaryOptions[Math.floor(Math.random() * dietaryOptions.length)];
        const rsvpStatus = rsvpStatuses[Math.floor(Math.random() * rsvpStatuses.length)];
        const isVip = Math.random() < 0.1; // 10% are VIPs
        const allowPlusOne = Math.random() < 0.3; // 30% can bring plus one

        // Assign to household (roughly 2-3 per household)
        const householdId = Math.floor(i / 2.75).toString();

        // Random arrival/departure dates around wedding
        const arrivalOffset = Math.floor(Math.random() * 3) - 1; // -1 to +1 days
        const arrivalDate = new Date(startDate.getTime() + arrivalOffset * 86400000);
        const departureDate = new Date(arrivalDate.getTime() + (2 + Math.floor(Math.random() * 2)) * 86400000);

        const guestTags = [];
        if (isVip) guestTags.push('VIP');
        if (relationship.includes('Bride')) guestTags.push("Bride's Side");
        if (relationship.includes('Groom')) guestTags.push("Groom's Side");
        if (relationship.includes('Family')) guestTags.push('Family');
        if (relationship.includes('Friend')) guestTags.push('Friends');
        if (country !== 'USA') guestTags.push('Out of Town');

        guests.push({
            id: (i + 1).toString(),
            weddingId,
            firstName,
            lastName,
            email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
            phone: `+1-555-${String(1000 + i).padStart(4, '0')}`,
            country,
            relationship,
            tags: guestTags,
            householdId,
            isPlusOne: false,
            allowPlusOne,
            globalRsvpStatus: rsvpStatus,
            dietaryRestrictions: dietary,
            isVip,
            avoidSeatingWith: [],
            arrivalDate: arrivalDate.toISOString().split('T')[0],
            departureDate: departureDate.toISOString().split('T')[0],
            notes: isVip ? 'VIP guest - ensure premium seating and accommodations' : '',
            createdAt: now,
            updatedAt: now,
        });
    }

    // Venues
    const venues = [
        {
            id: '1',
            weddingId,
            name: 'Grand Ballroom Hotel',
            address: '123 Main Street, New York, NY 10001',
            contactPerson: 'Sarah Manager',
            contactPhone: '+1-555-0100',
            spaces: [
                { id: '1a', name: 'Main Ballroom', capacity: 300, isIndoor: true },
                { id: '1b', name: 'Garden Terrace', capacity: 150, isIndoor: false },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            id: '2',
            weddingId,
            name: 'Crystal Gardens',
            address: '456 Park Avenue, New York, NY 10002',
            contactPerson: 'Mike Coordinator',
            contactPhone: '+1-555-0200',
            spaces: [
                { id: '2a', name: 'Ceremony Lawn', capacity: 300, isIndoor: false },
                { id: '2b', name: 'Reception Hall', capacity: 400, isIndoor: true },
            ],
            createdAt: now,
            updatedAt: now,
        },
        {
            id: '3',
            weddingId,
            name: 'Seaside Restaurant',
            address: '789 Beach Road, Long Island, NY 11001',
            contactPerson: 'Lisa Host',
            contactPhone: '+1-555-0300',
            spaces: [
                { id: '3a', name: 'Private Dining Room', capacity: 120, isIndoor: true },
            ],
            createdAt: now,
            updatedAt: now,
        },
    ];

    // Hotels
    const hotels = [
        {
            id: '1',
            weddingId,
            name: 'Grand Plaza Hotel',
            address: '100 Fifth Avenue, New York, NY 10001',
            contactPerson: 'John Concierge',
            contactPhone: '+1-555-1000',
            contactEmail: 'groups@grandplaza.com',
            roomBlockStartDate: startDate.toISOString().split('T')[0],
            roomBlockEndDate: endDate.toISOString().split('T')[0],
            notes: 'Main wedding hotel - 10% discount for guests',
            createdAt: now,
            updatedAt: now,
        },
        {
            id: '2',
            weddingId,
            name: 'Boutique Inn',
            address: '200 Madison Avenue, New York, NY 10002',
            contactPerson: 'Emma Manager',
            contactPhone: '+1-555-2000',
            contactEmail: 'reservations@boutiqueinn.com',
            notes: 'Overflow hotel - walking distance',
            createdAt: now,
            updatedAt: now,
        },
    ];

    return { wedding, events, guests, venues, hotels };
}

// Function to load test data into the store
export function seedTestData(store: any) {
    const data = generateTestData();

    store.setCurrentWedding(data.wedding);
    store.setEvents(data.events);
    store.setGuests(data.guests);
    store.setVenues(data.venues);
    store.setHotels(data.hotels);

    console.log('Test data seeded successfully!');
    console.log(`- Wedding: ${data.wedding.coupleName1} & ${data.wedding.coupleName2}`);
    console.log(`- Events: ${data.events.length}`);
    console.log(`- Guests: ${data.guests.length}`);
    console.log(`- Venues: ${data.venues.length}`);
    console.log(`- Hotels: ${data.hotels.length}`);

    return data;
}
