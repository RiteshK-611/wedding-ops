'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/store';
import { useSupabaseActions } from '@/hooks/useSupabaseSync';
import { useAuth } from '@/contexts/AuthContext';
import {
    Plus, Hotel, Trash2, X, BedDouble, MapPin, Users, UserPlus,
    User, Check, AlertTriangle, Search, Filter
} from 'lucide-react';
import type { Guest, Room, Hotel as HotelType } from '@/types';

export default function AccommodationsPage() {
    const { profile } = useAuth();
    const hotels = useStore((state) => state.hotels);
    const rooms = useStore((state) => state.rooms);
    const guests = useStore((state) => state.guests);
    const currentWedding = useStore((state) => state.currentWedding);
    const { addHotel, addRoom, updateRoom } = useSupabaseActions();
    const deleteHotel = useStore((state) => state.deleteHotel);
    const deleteRoom = useStore((state) => state.deleteRoom);
    const updateRoomStore = useStore((state) => state.updateRoom);

    const [showAddHotelModal, setShowAddHotelModal] = useState(false);
    const [showAddRoomModal, setShowAddRoomModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [guestSearchTerm, setGuestSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'available' | 'occupied'>('all');

    const [newHotel, setNewHotel] = useState({
        name: '',
        address: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
    });

    const [newRoom, setNewRoom] = useState({
        roomNumber: '',
        roomType: 'standard' as 'standard' | 'suite' | 'deluxe',
        maxOccupancy: 2,
    });

    // Calculate room statistics
    const roomStats = useMemo(() => {
        const totalRooms = rooms.length;
        const occupiedRooms = rooms.filter(r => (r.assignedGuestIds?.length || 0) > 0).length;
        const availableRooms = totalRooms - occupiedRooms;
        const totalCapacity = rooms.reduce((sum, r) => sum + (r.maxOccupancy || r.capacity || 2), 0);
        const assignedGuests = rooms.reduce((sum, r) => sum + (r.assignedGuestIds?.length || 0), 0);

        return { totalRooms, occupiedRooms, availableRooms, totalCapacity, assignedGuests };
    }, [rooms]);

    // Get unassigned guests (RSVP'd yes but no room)
    const unassignedGuests = useMemo(() => {
        const assignedGuestIdSet = new Set(rooms.flatMap(r => r.assignedGuestIds || []));
        return guests.filter(g =>
            g.globalRsvpStatus === 'yes' && !assignedGuestIdSet.has(g.id)
        );
    }, [guests, rooms]);

    // Filter guests for assignment modal
    const filteredGuests = useMemo(() => {
        const assignedGuestIdSet = new Set(rooms.flatMap(r => r.assignedGuestIds || []));
        return guests
            .filter(g => g.globalRsvpStatus === 'yes' || g.globalRsvpStatus === 'pending')
            .filter(g => !assignedGuestIdSet.has(g.id))
            .filter(g => {
                if (!guestSearchTerm) return true;
                const fullName = `${g.firstName} ${g.lastName}`.toLowerCase();
                return fullName.includes(guestSearchTerm.toLowerCase());
            });
    }, [guests, rooms, guestSearchTerm]);

    // Filter rooms by view mode
    const getFilteredRooms = (hotelRooms: Room[]) => {
        switch (viewMode) {
            case 'available':
                return hotelRooms.filter(r => (r.assignedGuestIds?.length || 0) === 0);
            case 'occupied':
                return hotelRooms.filter(r => (r.assignedGuestIds?.length || 0) > 0);
            default:
                return hotelRooms;
        }
    };

    const handleAddHotel = async () => {
        if (!newHotel.name) return;
        const weddingId = currentWedding?.id || profile?.weddingId;
        if (!weddingId) {
            alert('Please complete onboarding first');
            return;
        }

        await addHotel({
            weddingId,
            name: newHotel.name,
            address: newHotel.address || '',
            contactPerson: newHotel.contactPerson || undefined,
            contactPhone: newHotel.contactPhone || undefined,
            contactEmail: newHotel.contactEmail || undefined,
        });

        setNewHotel({ name: '', address: '', contactPerson: '', contactPhone: '', contactEmail: '' });
        setShowAddHotelModal(false);
    };

    const handleAddRoom = async () => {
        if (!newRoom.roomNumber || !selectedHotelId) return;

        await addRoom({
            hotelId: selectedHotelId,
            roomNumber: newRoom.roomNumber,
            roomType: newRoom.roomType,
            maxOccupancy: newRoom.maxOccupancy,
            capacity: newRoom.maxOccupancy,
            assignedGuestIds: [],
        });

        setNewRoom({ roomNumber: '', roomType: 'standard', maxOccupancy: 2 });
        setShowAddRoomModal(false);
    };

    const openAssignModal = (room: Room) => {
        setSelectedRoom(room);
        setGuestSearchTerm('');
        setShowAssignModal(true);
    };

    const handleAssignGuest = async (guestId: string) => {
        if (!selectedRoom) return;

        const currentAssigned = selectedRoom.assignedGuestIds || [];
        const maxCapacity = selectedRoom.maxOccupancy || selectedRoom.capacity || 2;

        // Check capacity
        if (currentAssigned.length >= maxCapacity) {
            alert(`Room ${selectedRoom.roomNumber} is at full capacity (${maxCapacity} guests)`);
            return;
        }

        const newAssignedIds = [...currentAssigned, guestId];

        // Update in store
        updateRoomStore(selectedRoom.id, { assignedGuestIds: newAssignedIds });

        // Update in database
        if (updateRoom) {
            await updateRoom(selectedRoom.id, { assignedGuestIds: newAssignedIds });
        }

        // Update local selectedRoom state
        setSelectedRoom({ ...selectedRoom, assignedGuestIds: newAssignedIds });
    };

    const handleRemoveGuest = async (roomId: string, guestId: string) => {
        const room = rooms.find(r => r.id === roomId);
        if (!room) return;

        const newAssignedIds = (room.assignedGuestIds || []).filter(id => id !== guestId);

        // Update in store
        updateRoomStore(roomId, { assignedGuestIds: newAssignedIds });

        // Update in database
        if (updateRoom) {
            await updateRoom(roomId, { assignedGuestIds: newAssignedIds });
        }

        // Update selectedRoom if open
        if (selectedRoom?.id === roomId) {
            setSelectedRoom({ ...selectedRoom, assignedGuestIds: newAssignedIds });
        }
    };

    const getGuestById = (guestId: string) => guests.find(g => g.id === guestId);

    const getRoomOccupancyStatus = (room: Room) => {
        const assigned = room.assignedGuestIds?.length || 0;
        const capacity = room.maxOccupancy || room.capacity || 2;
        if (assigned === 0) return 'empty';
        if (assigned >= capacity) return 'full';
        return 'partial';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'empty': return 'bg-green-100 text-green-700 border-green-200';
            case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
            case 'full': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Export rooming list CSV
    const exportRoomListCSV = () => {
        const headers = ['Hotel', 'Room Number', 'Room Type', 'Capacity', 'Guests Assigned', 'Guest Names', 'Status'];
        const rows = rooms.map(room => {
            const hotel = hotels.find(h => h.id === room.hotelId);
            const assignedGuests = (room.assignedGuestIds || [])
                .map(id => guests.find(g => g.id === id))
                .filter(Boolean);
            const guestNames = assignedGuests.map(g => `${g!.firstName} ${g!.lastName}`).join('; ');
            const status = getRoomOccupancyStatus(room);

            return [
                hotel?.name || '',
                room.roomNumber,
                room.roomType,
                room.maxOccupancy || room.capacity || 2,
                assignedGuests.length,
                guestNames,
                status
            ];
        });

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `rooming_list_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Accommodations</h1>
                    <p className="text-slate-600 mt-1">
                        {hotels.length} hotels · {rooms.length} rooms
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportRoomListCSV}
                        className="btn-secondary flex items-center gap-2"
                    >
                        <BedDouble className="w-4 h-4" />
                        Export Rooming List
                    </button>
                    <button
                        onClick={() => setShowAddHotelModal(true)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Hotel
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <BedDouble className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">{roomStats.totalRooms}</p>
                            <p className="text-sm text-slate-500">Total Rooms</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Check className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">{roomStats.availableRooms}</p>
                            <p className="text-sm text-slate-500">Available</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">{roomStats.occupiedRooms}</p>
                            <p className="text-sm text-slate-500">Occupied</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900">
                                {roomStats.assignedGuests}/{roomStats.totalCapacity}
                            </p>
                            <p className="text-sm text-slate-500">Guests Assigned</p>
                        </div>
                    </div>
                </div>
                <div className="card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-amber-600">{unassignedGuests.length}</p>
                            <p className="text-sm text-slate-500">Unassigned</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* View Filter */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">View:</span>
                <div className="flex gap-1">
                    {['all', 'available', 'occupied'].map((mode) => (
                        <button
                            key={mode}
                            onClick={() => setViewMode(mode as typeof viewMode)}
                            className={`px-3 py-1 text-sm rounded-full transition-colors ${viewMode === mode
                                ? 'bg-primary-600 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hotels Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {hotels.map((hotel) => {
                    const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);
                    const filteredRooms = getFilteredRooms(hotelRooms);
                    const hotelOccupied = hotelRooms.filter(r => (r.assignedGuestIds?.length || 0) > 0).length;

                    return (
                        <div key={hotel.id} className="card">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                                        <Hotel className="w-5 h-5 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{hotel.name}</h3>
                                        {hotel.address && (
                                            <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                                                <MapPin className="w-3 h-3" />
                                                {hotel.address}
                                            </p>
                                        )}
                                        <p className="text-xs text-slate-500 mt-1">
                                            {hotelOccupied}/{hotelRooms.length} rooms occupied
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteHotel(hotel.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm font-medium text-slate-700">
                                        Rooms ({filteredRooms.length})
                                    </span>
                                    <button
                                        onClick={() => {
                                            setSelectedHotelId(hotel.id);
                                            setShowAddRoomModal(true);
                                        }}
                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                    >
                                        + Add Room
                                    </button>
                                </div>

                                {filteredRooms.length > 0 ? (
                                    <div className="space-y-2 max-h-80 overflow-y-auto">
                                        {filteredRooms.map((room) => {
                                            const status = getRoomOccupancyStatus(room);
                                            const assignedGuests = (room.assignedGuestIds || [])
                                                .map(getGuestById)
                                                .filter(Boolean) as Guest[];
                                            const capacity = room.maxOccupancy || room.capacity || 2;

                                            return (
                                                <div
                                                    key={room.id}
                                                    className={`p-3 rounded-lg border ${getStatusColor(status)}`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <BedDouble className="w-4 h-4" />
                                                            <span className="font-medium">
                                                                Room {room.roomNumber}
                                                            </span>
                                                            <span className="text-xs opacity-75">
                                                                ({room.roomType})
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-medium">
                                                                {assignedGuests.length}/{capacity}
                                                            </span>
                                                            {assignedGuests.length < capacity && (
                                                                <button
                                                                    onClick={() => openAssignModal(room)}
                                                                    className="p-1 bg-white/50 hover:bg-white rounded transition-colors"
                                                                    title="Assign guest"
                                                                >
                                                                    <UserPlus className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => deleteRoom(room.id)}
                                                                className="p-1 hover:bg-white/50 rounded transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {assignedGuests.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-2">
                                                            {assignedGuests.map((guest) => (
                                                                <span
                                                                    key={guest.id}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/70 rounded text-xs"
                                                                >
                                                                    {guest.firstName} {guest.lastName}
                                                                    <button
                                                                        onClick={() => handleRemoveGuest(room.id, guest.id)}
                                                                        className="hover:text-red-600"
                                                                    >
                                                                        <X className="w-3 h-3" />
                                                                    </button>
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-500 text-center py-4">
                                        {viewMode !== 'all' ? `No ${viewMode} rooms` : 'No rooms added yet'}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}

                {hotels.length === 0 && (
                    <div className="col-span-2 card text-center py-12">
                        <Hotel className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                        <p className="text-slate-500">No hotels yet. Add your first hotel!</p>
                    </div>
                )}
            </div>

            {/* Unassigned Guests Sidebar */}
            {unassignedGuests.length > 0 && (
                <div className="card">
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Guests Needing Rooms ({unassignedGuests.length})
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                        {unassignedGuests.slice(0, 12).map((guest) => (
                            <div
                                key={guest.id}
                                className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-sm"
                            >
                                <p className="font-medium text-slate-900 truncate">
                                    {guest.firstName} {guest.lastName}
                                </p>
                                <p className="text-xs text-slate-500 truncate">
                                    {guest.relationship || 'Guest'}
                                </p>
                            </div>
                        ))}
                        {unassignedGuests.length > 12 && (
                            <div className="p-2 bg-slate-100 rounded-lg text-sm flex items-center justify-center">
                                <span className="text-slate-600">
                                    +{unassignedGuests.length - 12} more
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Add Hotel Modal */}
            {showAddHotelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Add Hotel</h2>
                            <button onClick={() => setShowAddHotelModal(false)}>
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Hotel Name *</label>
                                <input
                                    type="text"
                                    value={newHotel.name}
                                    onChange={(e) => setNewHotel({ ...newHotel, name: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Address</label>
                                <input
                                    type="text"
                                    value={newHotel.address}
                                    onChange={(e) => setNewHotel({ ...newHotel, address: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div>
                                <label className="label">Contact Person</label>
                                <input
                                    type="text"
                                    value={newHotel.contactPerson}
                                    onChange={(e) => setNewHotel({ ...newHotel, contactPerson: e.target.value })}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddHotelModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleAddHotel} className="btn-primary">
                                Add Hotel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Room Modal */}
            {showAddRoomModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold">Add Room</h2>
                            <button onClick={() => setShowAddRoomModal(false)}>
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Room Number *</label>
                                <input
                                    type="text"
                                    value={newRoom.roomNumber}
                                    onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                    className="input"
                                    placeholder="e.g., 101"
                                />
                            </div>
                            <div>
                                <label className="label">Room Type</label>
                                <select
                                    value={newRoom.roomType}
                                    onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value as typeof newRoom.roomType })}
                                    className="input"
                                >
                                    <option value="standard">Standard</option>
                                    <option value="deluxe">Deluxe</option>
                                    <option value="suite">Suite</option>
                                </select>
                            </div>
                            <div>
                                <label className="label">Max Occupancy</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={newRoom.maxOccupancy}
                                    onChange={(e) => setNewRoom({ ...newRoom, maxOccupancy: parseInt(e.target.value) || 2 })}
                                    className="input"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setShowAddRoomModal(false)} className="btn-secondary">
                                Cancel
                            </button>
                            <button onClick={handleAddRoom} className="btn-primary">
                                Add Room
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Guest Modal */}
            {showAssignModal && selectedRoom && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 p-6 max-h-[80vh] overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold">Assign Guest to Room</h2>
                                <p className="text-sm text-slate-500">
                                    Room {selectedRoom.roomNumber} ·
                                    {(selectedRoom.assignedGuestIds?.length || 0)}/
                                    {selectedRoom.maxOccupancy || selectedRoom.capacity || 2} guests
                                </p>
                            </div>
                            <button onClick={() => setShowAssignModal(false)}>
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        {/* Currently Assigned */}
                        {(selectedRoom.assignedGuestIds?.length || 0) > 0 && (
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                                <p className="text-sm font-medium text-slate-700 mb-2">Currently Assigned:</p>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedRoom.assignedGuestIds || []).map((guestId) => {
                                        const guest = getGuestById(guestId);
                                        return guest ? (
                                            <span
                                                key={guestId}
                                                className="inline-flex items-center gap-1 px-2 py-1 bg-white border rounded text-sm"
                                            >
                                                {guest.firstName} {guest.lastName}
                                                <button
                                                    onClick={() => handleRemoveGuest(selectedRoom.id, guestId)}
                                                    className="text-slate-400 hover:text-red-600"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search guests..."
                                value={guestSearchTerm}
                                onChange={(e) => setGuestSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>

                        {/* Guest List */}
                        <div className="flex-1 overflow-y-auto">
                            {filteredGuests.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredGuests.map((guest) => (
                                        <div
                                            key={guest.id}
                                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100"
                                        >
                                            <div>
                                                <p className="font-medium text-slate-900">
                                                    {guest.firstName} {guest.lastName}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {guest.relationship || 'Guest'} · RSVP: {guest.globalRsvpStatus}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleAssignGuest(guest.id)}
                                                className="btn-primary text-sm py-1 px-3"
                                                disabled={(selectedRoom.assignedGuestIds?.length || 0) >= (selectedRoom.maxOccupancy || selectedRoom.capacity || 2)}
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-slate-500 py-8">
                                    No unassigned guests found
                                </p>
                            )}
                        </div>

                        <div className="flex justify-end mt-4 pt-4 border-t">
                            <button onClick={() => setShowAssignModal(false)} className="btn-secondary">
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
