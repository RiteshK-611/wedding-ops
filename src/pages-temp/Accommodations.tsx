import { useState } from 'react';
import { useStore } from '../store';
import { useSupabaseActions } from '../hooks/useSupabaseSync';
import type { Hotel, Room } from '../types';
import { Hotel as HotelIcon, Plus, Edit, Trash2, X, Bed, Users, Phone, Mail, Calendar } from 'lucide-react';
import RoomTimeline from '../components/RoomTimeline';

export default function Accommodations() {
    const hotels = useStore((state) => state.hotels);
    const rooms = useStore((state) => state.rooms);
    const currentWedding = useStore((state) => state.currentWedding);
    const updateHotel = useStore((state) => state.updateHotel);
    const deleteHotel = useStore((state) => state.deleteHotel);
    const deleteRoom = useStore((state) => state.deleteRoom);

    // Use Supabase-synced actions
    const { addHotel, addRoom } = useSupabaseActions();

    const [showHotelModal, setShowHotelModal] = useState(false);
    const [editingHotel, setEditingHotel] = useState<Hotel | null>(null);
    const [showRoomModal, setShowRoomModal] = useState(false);
    const [selectedHotelId, setSelectedHotelId] = useState<string | null>(null);
    const [showTimeline, setShowTimeline] = useState(false);

    // Calculate room stats
    const getRoomStats = (hotelId: string) => {
        const hotelRooms = rooms.filter(r => r.hotelId === hotelId);
        const occupied = hotelRooms.filter(r => r.assignedGuestIds && r.assignedGuestIds.length > 0).length;
        return {
            total: hotelRooms.length,
            occupied,
            available: hotelRooms.length - occupied
        };
    };

    const handleAddHotel = async (formData: Partial<Hotel>) => {
        const hotelData = {
            weddingId: currentWedding?.id || '1',
            name: formData.name || '',
            address: formData.address || '',
            contactPerson: formData.contactPerson,
            contactPhone: formData.contactPhone,
            contactEmail: formData.contactEmail,
            roomBlockStartDate: formData.roomBlockStartDate,
            roomBlockEndDate: formData.roomBlockEndDate,
            notes: formData.notes,
        };
        await addHotel(hotelData);
        setShowHotelModal(false);
    };

    const handleUpdateHotel = (formData: Partial<Hotel>) => {
        if (editingHotel) {
            updateHotel(editingHotel.id, formData);
            setEditingHotel(null);
        }
    };

    const handleDeleteHotel = (id: string) => {
        if (window.confirm('Delete this hotel and all its rooms?')) {
            // Delete all rooms for this hotel
            rooms.filter(r => r.hotelId === id).forEach(r => deleteRoom(r.id));
            deleteHotel(id);
        }
    };

    const handleAddRoom = async (formData: Partial<Room>) => {
        if (!selectedHotelId) return;
        const roomData = {
            hotelId: selectedHotelId,
            roomNumber: formData.roomNumber || '',
            roomType: formData.roomType || 'standard',
            capacity: formData.maxOccupancy || 2,
            bedConfiguration: formData.bedConfiguration,
            maxOccupancy: formData.maxOccupancy || 2,
            pricePerNight: formData.pricePerNight,
            notes: formData.notes,
            assignedGuestIds: [],
        };
        await addRoom(roomData);
        setShowRoomModal(false);
        setSelectedHotelId(null);
    };

    const handleDeleteRoom = (id: string) => {
        if (window.confirm('Delete this room?')) {
            deleteRoom(id);
        }
    };

    // Show Timeline view if toggled
    if (showTimeline) {
        return (
            <div className="h-[calc(100vh-120px)]">
                <RoomTimeline onClose={() => setShowTimeline(false)} />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Accommodations</h1>
                    <p className="text-slate-600 mt-1">
                        {hotels.length} hotels · {rooms.length} rooms
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowTimeline(true)}
                        className="btn-secondary flex items-center"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Room Timeline
                    </button>
                    <button onClick={() => setShowHotelModal(true)} className="btn-primary flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Hotel
                    </button>
                </div>
            </div>

            {hotels.length === 0 ? (
                <div className="card text-center py-12">
                    <HotelIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No hotels yet</h3>
                    <p className="text-slate-500 mb-4">Add hotels to manage guest accommodations</p>
                    <button onClick={() => setShowHotelModal(true)} className="btn-primary">
                        Add Hotel
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {hotels.map((hotel) => {
                        const stats = getRoomStats(hotel.id);
                        const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);

                        return (
                            <div key={hotel.id} className="card">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                            <HotelIcon className="w-6 h-6 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-slate-900">{hotel.name}</h3>
                                            {hotel.address && (
                                                <p className="text-sm text-slate-500 mt-1">{hotel.address}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                                                {hotel.contactPhone && (
                                                    <span className="flex items-center">
                                                        <Phone className="w-4 h-4 mr-1" />
                                                        {hotel.contactPhone}
                                                    </span>
                                                )}
                                                {hotel.contactEmail && (
                                                    <span className="flex items-center">
                                                        <Mail className="w-4 h-4 mr-1" />
                                                        {hotel.contactEmail}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setEditingHotel(hotel)}
                                            className="p-2 text-slate-400 hover:text-primary-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteHotel(hotel.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Room Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                                        <div className="text-xs text-slate-500">Total Rooms</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                                        <div className="text-xs text-slate-500">Available</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-600">{stats.occupied}</div>
                                        <div className="text-xs text-slate-500">Occupied</div>
                                    </div>
                                </div>

                                {/* Rooms List */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-slate-700">Rooms</h4>
                                        <button
                                            onClick={() => {
                                                setSelectedHotelId(hotel.id);
                                                setShowRoomModal(true);
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            + Add Room
                                        </button>
                                    </div>

                                    {hotelRooms.length === 0 ? (
                                        <p className="text-sm text-slate-500 py-4 text-center">No rooms added yet</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {hotelRooms.map((room) => (
                                                <div
                                                    key={room.id}
                                                    className={`p-3 rounded-lg border ${room.assignedGuestIds && room.assignedGuestIds.length > 0
                                                        ? 'bg-amber-50 border-amber-200'
                                                        : 'bg-white border-slate-200'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Bed className="w-4 h-4 text-slate-400" />
                                                            <span className="font-medium">{room.roomNumber}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteRoom(room.id)}
                                                            className="text-slate-400 hover:text-red-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="mt-1 text-xs text-slate-500">
                                                        {room.roomType} · Max {room.maxOccupancy} guests
                                                    </div>
                                                    {room.assignedGuestIds && room.assignedGuestIds.length > 0 && (
                                                        <div className="mt-2 flex items-center text-xs text-amber-700">
                                                            <Users className="w-3 h-3 mr-1" />
                                                            {room.assignedGuestIds.length} guest(s) assigned
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {hotel.notes && (
                                    <p className="mt-4 text-sm text-slate-500 border-t pt-4">{hotel.notes}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Hotel Modal */}
            {(showHotelModal || editingHotel) && (
                <HotelFormModal
                    hotel={editingHotel}
                    onSave={editingHotel ? handleUpdateHotel : handleAddHotel}
                    onClose={() => {
                        setShowHotelModal(false);
                        setEditingHotel(null);
                    }}
                />
            )}

            {/* Room Modal */}
            {showRoomModal && (
                <RoomFormModal
                    onSave={handleAddRoom}
                    onClose={() => {
                        setShowRoomModal(false);
                        setSelectedHotelId(null);
                    }}
                />
            )}
        </div>
    );
}

// Hotel Form Modal
function HotelFormModal({
    hotel,
    onSave,
    onClose,
}: {
    hotel: Hotel | null;
    onSave: (data: Partial<Hotel>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Hotel>>(
        hotel || {
            name: '',
            address: '',
            contactPerson: '',
            contactPhone: '',
            contactEmail: '',
            notes: '',
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {hotel ? 'Edit Hotel' : 'Add Hotel'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Hotel Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Address</label>
                        <input
                            type="text"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Contact Person</label>
                            <input
                                type="text"
                                value={formData.contactPerson}
                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Email</label>
                        <input
                            type="email"
                            value={formData.contactEmail}
                            onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input min-h-[80px]"
                            placeholder="Special arrangements, discounts, etc."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            {hotel ? 'Update Hotel' : 'Add Hotel'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Room Form Modal
function RoomFormModal({
    onSave,
    onClose,
}: {
    onSave: (data: Partial<Room>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Room>>({
        roomNumber: '',
        roomType: 'standard',
        maxOccupancy: 2,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Add Room</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Room Number *</label>
                        <input
                            type="text"
                            value={formData.roomNumber}
                            onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                            className="input"
                            placeholder="e.g., 101, Suite A"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Room Type</label>
                            <select
                                value={formData.roomType}
                                onChange={(e) => setFormData({ ...formData, roomType: e.target.value as any })}
                                className="input"
                            >
                                <option value="standard">Standard</option>
                                <option value="deluxe">Deluxe</option>
                                <option value="suite">Suite</option>
                                <option value="family">Family</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Max Occupancy</label>
                            <input
                                type="number"
                                value={formData.maxOccupancy}
                                onChange={(e) => setFormData({ ...formData, maxOccupancy: parseInt(e.target.value) })}
                                className="input"
                                min="1"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Add Room</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
