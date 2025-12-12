import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useSupabaseActions } from '../hooks/useSupabaseSync';
import type { Guest, Table } from '../types';
import {
    Plus, Trash2, X, ArrowLeft, Grid, List,
    AlertTriangle, Check, Search,
    Move
} from 'lucide-react';

export default function SeatingPlanner() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const events = useStore((state) => state.events);
    const guests = useStore((state) => state.guests);
    const tables = useStore((state) => state.tables);
    const tableAssignments = useStore((state) => state.tableAssignments);
    const deleteTable = useStore((state) => state.deleteTable);
    const addTableAssignment = useStore((state) => state.addTableAssignment);
    const removeTableAssignment = useStore((state) => state.removeTableAssignment);

    // Use Supabase-synced actions
    const { addTable } = useSupabaseActions();

    const event = events.find(e => e.id === eventId);

    const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');
    const [showAddTable, setShowAddTable] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterUnseated, setFilterUnseated] = useState(false);
    const [selectedGuests, setSelectedGuests] = useState<string[]>([]);
    const [draggedGuest, setDraggedGuest] = useState<Guest | null>(null);

    // Get tables for this event
    const eventTables = useMemo(() =>
        tables.filter(t => t.eventId === eventId),
        [tables, eventId]
    );

    // Get assignments for this event's tables
    const eventAssignments = useMemo(() =>
        tableAssignments.filter(a =>
            eventTables.some(t => t.id === a.tableId)
        ),
        [tableAssignments, eventTables]
    );

    // Get confirmed guests (attending this event)
    const confirmedGuests = useMemo(() =>
        guests.filter(g => g.globalRsvpStatus === 'yes'),
        [guests]
    );

    // Calculate seated/unseated guests
    const seatedGuestIds = useMemo(() =>
        new Set(eventAssignments.map(a => a.guestId)),
        [eventAssignments]
    );

    const unseatedGuests = useMemo(() =>
        confirmedGuests.filter(g => !seatedGuestIds.has(g.id)),
        [confirmedGuests, seatedGuestIds]
    );

    const seatedGuests = useMemo(() =>
        confirmedGuests.filter(g => seatedGuestIds.has(g.id)),
        [confirmedGuests, seatedGuestIds]
    );

    // Filter guests based on search and filter
    const filteredGuests = useMemo(() => {
        let list = filterUnseated ? unseatedGuests : confirmedGuests;
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(g =>
                `${g.firstName} ${g.lastName}`.toLowerCase().includes(term) ||
                g.relationship?.toLowerCase().includes(term)
            );
        }
        return list;
    }, [confirmedGuests, unseatedGuests, filterUnseated, searchTerm]);

    // Get guests assigned to a specific table
    const getTableGuests = useCallback((tableId: string) => {
        const assignedIds = eventAssignments
            .filter(a => a.tableId === tableId)
            .map(a => a.guestId);
        return confirmedGuests.filter(g => assignedIds.includes(g.id));
    }, [eventAssignments, confirmedGuests]);

    // Handle drag start
    const handleDragStart = (guest: Guest) => {
        setDraggedGuest(guest);
    };

    // Handle drop on table
    const handleDropOnTable = (tableId: string) => {
        if (draggedGuest) {
            // Remove from any existing table first
            const existingAssignment = eventAssignments.find(a => a.guestId === draggedGuest.id);
            if (existingAssignment) {
                removeTableAssignment(existingAssignment.id);
            }

            // Add to new table
            addTableAssignment({
                id: Date.now().toString(),
                guestId: draggedGuest.id,
                tableId,
                assignedAt: new Date().toISOString(),
                assignedByUserId: '1',
            });

            setDraggedGuest(null);
        }

        // Handle selected guests bulk assign
        if (selectedGuests.length > 0) {
            selectedGuests.forEach(guestId => {
                const existingAssignment = eventAssignments.find(a => a.guestId === guestId);
                if (existingAssignment) {
                    removeTableAssignment(existingAssignment.id);
                }
                addTableAssignment({
                    id: Date.now().toString() + guestId,
                    guestId,
                    tableId,
                    assignedAt: new Date().toISOString(),
                    assignedByUserId: '1',
                });
            });
            setSelectedGuests([]);
        }
    };

    // Handle remove from table
    const handleRemoveFromTable = (guestId: string) => {
        const assignment = eventAssignments.find(a => a.guestId === guestId);
        if (assignment) {
            removeTableAssignment(assignment.id);
        }
    };

    // Add new table
    const handleAddTable = async (tableData: Partial<Table>) => {
        await addTable({
            eventId: eventId!,
            name: tableData.name || `Table ${eventTables.length + 1}`,
            tableNumber: eventTables.length + 1,
            capacity: tableData.capacity || 8,
            tableType: tableData.tableType || 'round',
            positionX: 100 + (eventTables.length % 4) * 200,
            positionY: 100 + Math.floor(eventTables.length / 4) * 200,
            width: tableData.tableType === 'rectangular' ? 160 : 120,
            height: tableData.tableType === 'rectangular' ? 80 : 120,
            rotation: 0,
            attributes: [],
        });
        setShowAddTable(false);
    };

    // Handle delete table
    const handleDeleteTable = (tableId: string) => {
        if (window.confirm('Delete this table and unseat all guests?')) {
            // Remove all assignments for this table
            eventAssignments
                .filter(a => a.tableId === tableId)
                .forEach(a => removeTableAssignment(a.id));
            deleteTable(tableId);
        }
    };

    // Toggle guest selection
    const toggleGuestSelection = (guestId: string) => {
        setSelectedGuests(prev =>
            prev.includes(guestId)
                ? prev.filter(id => id !== guestId)
                : [...prev, guestId]
        );
    };

    if (!event) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-slate-900">Event not found</h2>
                <button onClick={() => navigate('/events')} className="btn-primary mt-4">
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/events')}
                        className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Seating Plan</h1>
                        <p className="text-slate-500">{event.name}</p>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Stats */}
                    <div className="flex items-center space-x-6 text-sm">
                        <div className="flex items-center">
                            <span className="text-slate-500">Total:</span>
                            <span className="ml-1 font-semibold">{confirmedGuests.length}</span>
                        </div>
                        <div className="flex items-center text-green-600">
                            <Check className="w-4 h-4 mr-1" />
                            <span>Seated: {seatedGuests.length}</span>
                        </div>
                        <div className="flex items-center text-amber-600">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            <span>Unseated: {unseatedGuests.length}</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('visual')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'visual'
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <Grid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === 'list'
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowAddTable(true)}
                        className="btn-primary flex items-center"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Table
                    </button>
                </div>
            </div>

            {/* Main Content - Split View */}
            <div className="flex-1 flex overflow-hidden mt-4">
                {/* Left Panel - Guest List */}
                <div className="w-80 border-r border-slate-200 flex flex-col">
                    {/* Search and Filter */}
                    <div className="p-4 space-y-3 border-b border-slate-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search guests..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="input pl-10"
                            />
                        </div>
                        <label className="flex items-center space-x-2 text-sm">
                            <input
                                type="checkbox"
                                checked={filterUnseated}
                                onChange={(e) => setFilterUnseated(e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <span className="text-slate-600">Show unseated only</span>
                        </label>
                    </div>

                    {/* Guest List */}
                    <div className="flex-1 overflow-y-auto p-2">
                        {filteredGuests.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                No guests found
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredGuests.map((guest) => {
                                    const isSeated = seatedGuestIds.has(guest.id);
                                    const isSelected = selectedGuests.includes(guest.id);

                                    return (
                                        <div
                                            key={guest.id}
                                            draggable
                                            onDragStart={() => handleDragStart(guest)}
                                            onDragEnd={() => setDraggedGuest(null)}
                                            onClick={() => toggleGuestSelection(guest.id)}
                                            className={`
                        p-3 rounded-lg border cursor-move transition-all
                        ${isSeated
                                                    ? 'bg-green-50 border-green-200'
                                                    : 'bg-white border-slate-200 hover:border-primary-300'
                                                }
                        ${isSelected ? 'ring-2 ring-primary-500' : ''}
                        ${draggedGuest?.id === guest.id ? 'opacity-50' : ''}
                      `}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <Move className="w-4 h-4 text-slate-400" />
                                                    <div>
                                                        <div className="font-medium text-slate-900">
                                                            {guest.firstName} {guest.lastName}
                                                        </div>
                                                        <div className="text-xs text-slate-500">
                                                            {guest.relationship}
                                                        </div>
                                                    </div>
                                                </div>
                                                {isSeated && (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                )}
                                            </div>
                                            {guest.isVip && (
                                                <span className="inline-flex mt-1 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                                    VIP
                                                </span>
                                            )}
                                            {guest.dietaryRestrictions?.length > 0 && (
                                                <span className="inline-flex mt-1 ml-1 px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                                                    Diet
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Bulk Actions */}
                    {selectedGuests.length > 0 && (
                        <div className="p-4 border-t border-slate-200 bg-slate-50">
                            <div className="text-sm text-slate-600 mb-2">
                                {selectedGuests.length} guest(s) selected
                            </div>
                            <button
                                onClick={() => setSelectedGuests([])}
                                className="text-sm text-primary-600 hover:text-primary-700"
                            >
                                Clear selection
                            </button>
                        </div>
                    )}
                </div>

                {/* Right Panel - Floor Plan / Table View */}
                <div className="flex-1 overflow-hidden">
                    {viewMode === 'visual' ? (
                        <VisualFloorPlan
                            tables={eventTables}
                            getTableGuests={getTableGuests}
                            onDropOnTable={handleDropOnTable}
                            onRemoveFromTable={handleRemoveFromTable}
                            onDeleteTable={handleDeleteTable}
                            draggedGuest={draggedGuest}
                            selectedGuestsCount={selectedGuests.length}
                        />
                    ) : (
                        <TableListView
                            tables={eventTables}
                            getTableGuests={getTableGuests}
                            onDropOnTable={handleDropOnTable}
                            onRemoveFromTable={handleRemoveFromTable}
                            onDeleteTable={handleDeleteTable}
                        />
                    )}
                </div>
            </div>

            {/* Add Table Modal */}
            {showAddTable && (
                <AddTableModal
                    onAdd={handleAddTable}
                    onClose={() => setShowAddTable(false)}
                    tableCount={eventTables.length}
                />
            )}
        </div>
    );
}

// Visual Floor Plan Component
function VisualFloorPlan({
    tables,
    getTableGuests,
    onDropOnTable,
    onRemoveFromTable,
    onDeleteTable,
    draggedGuest,
    selectedGuestsCount,
}: {
    tables: Table[];
    getTableGuests: (tableId: string) => Guest[];
    onDropOnTable: (tableId: string) => void;
    onRemoveFromTable: (guestId: string) => void;
    onDeleteTable: (tableId: string) => void;
    draggedGuest: Guest | null;
    selectedGuestsCount: number;
}) {
    const [expandedTable, setExpandedTable] = useState<string | null>(null);

    if (tables.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Grid className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tables yet</h3>
                    <p className="text-slate-500">Add tables to start seating your guests</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto p-8 bg-slate-100">
            <div className="relative min-w-[800px] min-h-[600px] bg-white rounded-lg shadow-inner border-2 border-dashed border-slate-300">
                {tables.map((table) => {
                    const tableGuests = getTableGuests(table.id);
                    const isFull = tableGuests.length >= table.capacity;
                    const isOver = tableGuests.length > table.capacity;
                    const isExpanded = expandedTable === table.id;

                    return (
                        <div
                            key={table.id}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDropOnTable(table.id)}
                            onClick={() => setExpandedTable(isExpanded ? null : table.id)}
                            style={{
                                position: 'absolute',
                                left: table.positionX || 100,
                                top: table.positionY || 100,
                                width: table.width || 120,
                                height: table.height || 120,
                                transform: `rotate(${table.rotation || 0}deg)`,
                            }}
                            className={`
                cursor-pointer transition-all duration-200
                ${table.tableType === 'round' ? 'rounded-full' : 'rounded-lg'}
                ${isOver
                                    ? 'bg-red-100 border-2 border-red-400'
                                    : isFull
                                        ? 'bg-green-100 border-2 border-green-400'
                                        : 'bg-primary-50 border-2 border-primary-300'
                                }
                ${(draggedGuest || selectedGuestsCount > 0) && !isFull
                                    ? 'ring-4 ring-primary-200 animate-pulse'
                                    : ''
                                }
                hover:shadow-lg
              `}
                        >
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="font-bold text-slate-900 text-lg">
                                    {table.name}
                                </div>
                                <div className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-slate-600'}`}>
                                    {tableGuests.length}/{table.capacity}
                                </div>
                                {isOver && (
                                    <AlertTriangle className="w-4 h-4 text-red-500 mt-1" />
                                )}
                            </div>

                            {/* Delete button */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteTable(table.id);
                                }}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Expanded View - Guest List */}
                            {isExpanded && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-10"
                                >
                                    <div className="p-3 border-b border-slate-200">
                                        <h4 className="font-semibold text-slate-900">{table.name}</h4>
                                        <p className="text-xs text-slate-500">
                                            {tableGuests.length} of {table.capacity} seats
                                        </p>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {tableGuests.length === 0 ? (
                                            <p className="p-3 text-sm text-slate-500">No guests assigned</p>
                                        ) : (
                                            tableGuests.map((guest) => (
                                                <div
                                                    key={guest.id}
                                                    className="p-2 flex items-center justify-between hover:bg-slate-50"
                                                >
                                                    <span className="text-sm text-slate-700">
                                                        {guest.firstName} {guest.lastName}
                                                    </span>
                                                    <button
                                                        onClick={() => onRemoveFromTable(guest.id)}
                                                        className="text-slate-400 hover:text-red-500"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// Table List View Component
function TableListView({
    tables,
    getTableGuests,
    onDropOnTable,
    onRemoveFromTable,
    onDeleteTable,
}: {
    tables: Table[];
    getTableGuests: (tableId: string) => Guest[];
    onDropOnTable: (tableId: string) => void;
    onRemoveFromTable: (guestId: string) => void;
    onDeleteTable: (tableId: string) => void;
}) {
    const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());

    const toggleExpand = (tableId: string) => {
        setExpandedTables(prev => {
            const next = new Set(prev);
            if (next.has(tableId)) {
                next.delete(tableId);
            } else {
                next.add(tableId);
            }
            return next;
        });
    };

    if (tables.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <List className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No tables yet</h3>
                    <p className="text-slate-500">Add tables to start seating your guests</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto p-4 space-y-3">
            {tables.map((table) => {
                const tableGuests = getTableGuests(table.id);
                const isExpanded = expandedTables.has(table.id);
                const isOver = tableGuests.length > table.capacity;

                return (
                    <div
                        key={table.id}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => onDropOnTable(table.id)}
                        className={`
              bg-white rounded-lg border-2 transition-all
              ${isOver
                                ? 'border-red-300 bg-red-50'
                                : 'border-slate-200 hover:border-primary-300'
                            }
            `}
                    >
                        <div
                            onClick={() => toggleExpand(table.id)}
                            className="p-4 flex items-center justify-between cursor-pointer"
                        >
                            <div className="flex items-center space-x-4">
                                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center
                  ${table.tableType === 'round' ? 'rounded-full' : 'rounded-lg'}
                  ${isOver ? 'bg-red-200' : 'bg-primary-100'}
                `}>
                                    <span className="font-bold text-slate-700">{table.tableNumber}</span>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-slate-900">{table.name}</h3>
                                    <p className="text-sm text-slate-500">
                                        {table.tableType} · {table.capacity} seats
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className={`text-sm font-medium ${isOver ? 'text-red-600' : 'text-slate-600'
                                    }`}>
                                    {tableGuests.length}/{table.capacity}
                                </span>
                                {isOver && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteTable(table.id);
                                    }}
                                    className="p-1 text-slate-400 hover:text-red-500"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {isExpanded && (
                            <div className="border-t border-slate-200">
                                {tableGuests.length === 0 ? (
                                    <p className="p-4 text-sm text-slate-500">
                                        Drag guests here to assign them
                                    </p>
                                ) : (
                                    <div className="divide-y divide-slate-100">
                                        {tableGuests.map((guest) => (
                                            <div
                                                key={guest.id}
                                                className="px-4 py-2 flex items-center justify-between hover:bg-slate-50"
                                            >
                                                <div>
                                                    <span className="text-slate-900">
                                                        {guest.firstName} {guest.lastName}
                                                    </span>
                                                    {guest.isVip && (
                                                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded">
                                                            VIP
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={() => onRemoveFromTable(guest.id)}
                                                    className="text-slate-400 hover:text-red-500"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// Add Table Modal
function AddTableModal({
    onAdd,
    onClose,
    tableCount,
}: {
    onAdd: (data: Partial<Table>) => void;
    onClose: () => void;
    tableCount: number;
}) {
    const [formData, setFormData] = useState({
        name: `Table ${tableCount + 1}`,
        capacity: 8,
        tableType: 'round' as 'round' | 'rectangular' | 'high_top' | 'vip',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Add Table</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Table Name</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Capacity</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                className="input"
                                min="1"
                                max="20"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Table Type</label>
                            <select
                                value={formData.tableType}
                                onChange={(e) => setFormData({ ...formData, tableType: e.target.value as any })}
                                className="input"
                            >
                                <option value="round">Round</option>
                                <option value="rectangular">Rectangular</option>
                                <option value="high_top">High Top</option>
                                <option value="vip">VIP</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Add Table
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
