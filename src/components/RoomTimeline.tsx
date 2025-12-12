import { useState, useMemo } from 'react';
import { useStore } from '../store';
import type { Guest, Room } from '../types';
import { Calendar, ChevronLeft, ChevronRight, User, X } from 'lucide-react';

interface RoomTimelineProps {
    onClose?: () => void;
}

export default function RoomTimeline({ onClose }: RoomTimelineProps) {
    const hotels = useStore((state) => state.hotels);
    const rooms = useStore((state) => state.rooms);
    const guests = useStore((state) => state.guests);
    const currentWedding = useStore((state) => state.currentWedding);

    // Calculate date range based on wedding dates
    const dateRange = useMemo(() => {
        const startDate = currentWedding?.weddingStartDate || currentWedding?.eventStartDate
            ? new Date(currentWedding.weddingStartDate || currentWedding.eventStartDate!)
            : new Date();
        const endDate = currentWedding?.weddingEndDate || currentWedding?.eventEndDate
            ? new Date(currentWedding.weddingEndDate || currentWedding.eventEndDate!)
            : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);

        // Add 2 days buffer on each side
        startDate.setDate(startDate.getDate() - 2);
        endDate.setDate(endDate.getDate() + 2);

        const dates: Date[] = [];
        const current = new Date(startDate);
        while (current <= endDate) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        return dates;
    }, [currentWedding]);

    const [viewStartIndex, setViewStartIndex] = useState(0);
    const visibleDays = 7;
    const visibleDates = dateRange.slice(viewStartIndex, viewStartIndex + visibleDays);

    // Get guests assigned to each room
    const getRoomGuests = (room: Room) => {
        return guests.filter(g => g.assignedRoomId === room.id);
    };

    // Calculate guest stay bar position and width
    const getStayBar = (guest: Guest, dates: Date[]) => {
        if (!guest.checkInDate || !guest.checkOutDate) return null;

        const checkIn = new Date(guest.checkInDate);
        const checkOut = new Date(guest.checkOutDate);

        const firstDate = dates[0];
        const dayWidth = 100 / dates.length;

        const startOffset = Math.max(0, (checkIn.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000));
        const duration = (checkOut.getTime() - checkIn.getTime()) / (24 * 60 * 60 * 1000);

        if (startOffset >= dates.length || startOffset + duration < 0) return null;

        const left = Math.max(0, startOffset) * dayWidth;
        const width = Math.min(duration, dates.length - startOffset) * dayWidth;

        return { left: `${left}%`, width: `${width}%` };
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    const isWeddingDate = (date: Date) => {
        const weddingDateStr = currentWedding?.weddingDate || currentWedding?.weddingStartDate;
        if (!weddingDateStr) return false;
        const wedding = new Date(weddingDateStr);
        return date.toDateString() === wedding.toDateString();
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-primary-600 mr-2" />
                    <h2 className="text-lg font-semibold text-slate-900">Room Timeline</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setViewStartIndex(Math.max(0, viewStartIndex - 1))}
                        disabled={viewStartIndex === 0}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-slate-600">
                        {formatDate(visibleDates[0])} - {formatDate(visibleDates[visibleDates.length - 1])}
                    </span>
                    <button
                        onClick={() => setViewStartIndex(Math.min(dateRange.length - visibleDays, viewStartIndex + 1))}
                        disabled={viewStartIndex >= dateRange.length - visibleDays}
                        className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    {onClose && (
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Timeline Grid */}
            <div className="flex-1 overflow-auto">
                <div className="min-w-[800px]">
                    {/* Date Headers */}
                    <div className="flex border-b border-slate-200 bg-slate-50 sticky top-0 z-10">
                        <div className="w-48 flex-shrink-0 px-4 py-3 font-medium text-slate-700 border-r border-slate-200">
                            Room
                        </div>
                        <div className="flex-1 flex">
                            {visibleDates.map((date, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 px-2 py-3 text-center text-sm border-r border-slate-200 ${isWeddingDate(date) ? 'bg-primary-50 text-primary-700 font-semibold' : 'text-slate-600'
                                        }`}
                                >
                                    <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                                    <div className="text-xs">{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rooms by Hotel */}
                    {hotels.map((hotel) => {
                        const hotelRooms = rooms.filter(r => r.hotelId === hotel.id);
                        if (hotelRooms.length === 0) return null;

                        return (
                            <div key={hotel.id}>
                                {/* Hotel Header */}
                                <div className="flex bg-slate-100 border-b border-slate-200">
                                    <div className="w-48 flex-shrink-0 px-4 py-2 font-semibold text-slate-800 border-r border-slate-200">
                                        {hotel.name}
                                    </div>
                                    <div className="flex-1" />
                                </div>

                                {/* Room Rows */}
                                {hotelRooms.map((room) => {
                                    const roomGuests = getRoomGuests(room);

                                    return (
                                        <div key={room.id} className="flex border-b border-slate-100 hover:bg-slate-50">
                                            {/* Room Info */}
                                            <div className="w-48 flex-shrink-0 px-4 py-3 border-r border-slate-200">
                                                <div className="font-medium text-slate-900">Room {room.roomNumber}</div>
                                                <div className="text-xs text-slate-500">
                                                    {room.roomType} · {room.capacity} guests
                                                </div>
                                            </div>

                                            {/* Timeline */}
                                            <div className="flex-1 relative min-h-[60px]">
                                                {/* Grid Lines */}
                                                <div className="absolute inset-0 flex">
                                                    {visibleDates.map((date, i) => (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 border-r border-slate-100 ${isWeddingDate(date) ? 'bg-primary-50/50' : ''
                                                                }`}
                                                        />
                                                    ))}
                                                </div>

                                                {/* Guest Stay Bars */}
                                                {roomGuests.map((guest) => {
                                                    const bar = getStayBar(guest, visibleDates);
                                                    if (!bar) return null;

                                                    return (
                                                        <div
                                                            key={guest.id}
                                                            style={{ left: bar.left, width: bar.width }}
                                                            className="absolute top-2 h-10 bg-primary-500 rounded-lg shadow-sm flex items-center px-2 text-white text-sm font-medium cursor-pointer hover:bg-primary-600 transition-colors"
                                                            title={`${guest.firstName} ${guest.lastName}\n${guest.checkInDate} - ${guest.checkOutDate}`}
                                                        >
                                                            <User className="w-4 h-4 mr-1 flex-shrink-0" />
                                                            <span className="truncate">{guest.firstName} {guest.lastName[0]}.</span>
                                                        </div>
                                                    );
                                                })}

                                                {roomGuests.length === 0 && (
                                                    <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
                                                        No guests assigned
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}

                    {hotels.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                            <p>Add hotels and rooms to see the timeline</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center space-x-6 text-sm text-slate-600">
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-primary-500 rounded mr-2" />
                        <span>Guest Stay</span>
                    </div>
                    <div className="flex items-center">
                        <div className="w-4 h-4 bg-primary-50 rounded mr-2 border border-primary-200" />
                        <span>Wedding Date</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
