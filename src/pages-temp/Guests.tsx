import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { useSupabaseActions } from '../hooks/useSupabaseSync';
import type { Guest } from '../types';
import { Plus, Search, Edit, Trash2, X, Upload, Eye, Link2, Check } from 'lucide-react';
import GuestDetailDrawer from '../components/GuestDetailDrawer';
import CSVImportExport from '../components/CSVImportExport';

export default function Guests() {
    const guests = useStore((state) => state.guests);
    const currentWedding = useStore((state) => state.currentWedding);

    // Use Supabase-synced actions instead of direct store calls
    const { addGuest, updateGuest, deleteGuest } = useSupabaseActions();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
    const [viewingGuest, setViewingGuest] = useState<Guest | null>(null);
    const [showCSVModal, setShowCSVModal] = useState(false);
    const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set());
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Generate RSVP link for a guest (using guest ID as fallback token)
    const getRsvpLink = (guest: Guest) => {
        const token = (guest as any).rsvpToken || guest.id;
        return `${window.location.origin}/rsvp/${token}`;
    };

    // Copy RSVP link to clipboard
    const copyRsvpLink = async (guest: Guest) => {
        const link = getRsvpLink(guest);
        try {
            await navigator.clipboard.writeText(link);
            setCopiedId(guest.id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Filter guests
    const filteredGuests = useMemo(() => {
        return guests.filter((g) => {
            const matchesSearch =
                g.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                g.relationship.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesFilter =
                filterStatus === 'all' ||
                (filterStatus === 'confirmed' && g.globalRsvpStatus === 'yes') ||
                (filterStatus === 'pending' && g.globalRsvpStatus === 'pending') ||
                (filterStatus === 'declined' && g.globalRsvpStatus === 'no') ||
                (filterStatus === 'vip' && g.isVip);

            return matchesSearch && matchesFilter;
        });
    }, [guests, searchTerm, filterStatus]);

    const handleAddGuest = async (formData: Partial<Guest>) => {
        const guestData = {
            weddingId: currentWedding?.id || '1',
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            email: formData.email,
            phone: formData.phone,
            relationship: formData.relationship || '',
            country: formData.country,
            tags: formData.tags || [],
            isPlusOne: false,
            allowPlusOne: formData.allowPlusOne || false,
            globalRsvpStatus: 'pending' as const,
            dietaryRestrictions: formData.dietaryRestrictions || [],
            isVip: formData.isVip || false,
            avoidSeatingWith: [],
        };

        await addGuest(guestData);
        setShowAddModal(false);
    };

    const handleUpdateGuest = async (formData: Partial<Guest>) => {
        if (editingGuest) {
            await updateGuest(editingGuest.id, formData);
            setEditingGuest(null);
        }
    };

    const handleDeleteGuest = async (id: string) => {
        if (window.confirm('Are you sure you want to delete this guest?')) {
            await deleteGuest(id);
        }
    };

    const toggleSelectGuest = (id: string) => {
        const newSelected = new Set(selectedGuests);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedGuests(newSelected);
    };

    const selectAll = () => {
        if (selectedGuests.size === filteredGuests.length) {
            setSelectedGuests(new Set());
        } else {
            setSelectedGuests(new Set(filteredGuests.map((g) => g.id)));
        }
    };

    const handleCSVImport = (importedGuests: Partial<Guest>[]) => {
        importedGuests.forEach((guestData) => {
            const newGuest: Guest = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                weddingId: currentWedding?.id || '1',
                firstName: guestData.firstName || '',
                lastName: guestData.lastName || '',
                email: guestData.email,
                phone: guestData.phone,
                relationship: guestData.relationship || 'Guest',
                country: guestData.country,
                tags: guestData.tags || [],
                isPlusOne: false,
                allowPlusOne: guestData.allowPlusOne || false,
                globalRsvpStatus: guestData.globalRsvpStatus || 'pending',
                dietaryRestrictions: guestData.dietaryRestrictions || [],
                isVip: guestData.isVip || false,
                arrivalDate: guestData.arrivalDate,
                departureDate: guestData.departureDate,
                notes: guestData.notes,
                avoidSeatingWith: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            addGuest(newGuest);
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Guests</h1>
                    <p className="text-slate-600 mt-1">{guests.length} total guests</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => setShowCSVModal(true)}
                        className="btn-secondary flex items-center"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Import/Export
                    </button>
                    <button onClick={() => setShowAddModal(true)} className="btn-primary flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Guest
                    </button>
                </div>
            </div>


            {/* Filters and Search */}
            <div className="card">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search guests by name, email, or relationship..."
                            className="input pl-10"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="md:w-48">
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input">
                            <option value="all">All Guests</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="pending">Pending RSVP</option>
                            <option value="declined">Declined</option>
                            <option value="vip">VIP Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Batch Actions */}
            {selectedGuests.size > 0 && (
                <div className="bg-primary-600 text-white px-6 py-3 rounded-lg flex items-center justify-between">
                    <span className="font-medium">{selectedGuests.size} guests selected</span>
                    <div className="flex items-center space-x-4">
                        <button className="text-white hover:text-primary-100 font-medium">Bulk Update</button>
                        <button className="text-white hover:text-primary-100 font-medium">Export</button>
                        <button onClick={() => setSelectedGuests(new Set())} className="text-white hover:text-primary-100">
                            Clear
                        </button>
                    </div>
                </div>
            )}

            {/* Guests Table */}
            <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedGuests.size === filteredGuests.length && filteredGuests.length > 0}
                                        onChange={selectAll}
                                        className="rounded border-slate-300"
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Relationship
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    RSVP Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Tags
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredGuests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <p className="text-slate-500">No guests found</p>
                                        {guests.length === 0 && (
                                            <button onClick={() => setShowAddModal(true)} className="btn-primary mt-4">
                                                Add Your First Guest
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ) : (
                                filteredGuests.map((guest) => (
                                    <tr key={guest.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedGuests.has(guest.id)}
                                                onChange={() => toggleSelectGuest(guest.id)}
                                                className="rounded border-slate-300"
                                            />
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="font-medium text-slate-900">
                                                        {guest.firstName} {guest.lastName}
                                                        {guest.isVip && (
                                                            <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                                VIP
                                                            </span>
                                                        )}
                                                    </div>
                                                    {guest.phone && <div className="text-sm text-slate-500">{guest.phone}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">{guest.email || '—'}</td>
                                        <td className="px-6 py-4 text-sm text-slate-900">{guest.relationship}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${guest.globalRsvpStatus === 'yes'
                                                    ? 'bg-green-100 text-green-700'
                                                    : guest.globalRsvpStatus === 'no'
                                                        ? 'bg-red-100 text-red-700'
                                                        : guest.globalRsvpStatus === 'maybe'
                                                            ? 'bg-yellow-100 text-yellow-700'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                            >
                                                {guest.globalRsvpStatus === 'yes'
                                                    ? 'Confirmed'
                                                    : guest.globalRsvpStatus === 'no'
                                                        ? 'Declined'
                                                        : guest.globalRsvpStatus === 'maybe'
                                                            ? 'Maybe'
                                                            : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {guest.tags.slice(0, 2).map((tag) => (
                                                    <span key={tag} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                                {guest.tags.length > 2 && (
                                                    <span className="text-xs text-slate-500">+{guest.tags.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end space-x-2">
                                                <button
                                                    onClick={() => setViewingGuest(guest)}
                                                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => copyRsvpLink(guest)}
                                                    className={`p-1 transition-colors ${copiedId === guest.id
                                                        ? 'text-green-600'
                                                        : 'text-slate-400 hover:text-primary-600'
                                                        }`}
                                                    title={copiedId === guest.id ? 'Copied!' : 'Copy RSVP Link'}
                                                >
                                                    {copiedId === guest.id ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        <Link2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => setEditingGuest(guest)}
                                                    className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteGuest(guest.id)}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {(showAddModal || editingGuest) && (
                <GuestFormModal
                    guest={editingGuest}
                    onSave={editingGuest ? handleUpdateGuest : handleAddGuest}
                    onClose={() => {
                        setShowAddModal(false);
                        setEditingGuest(null);
                    }}
                />
            )}

            {/* Guest Detail Drawer */}
            {viewingGuest && (
                <GuestDetailDrawer
                    guest={viewingGuest}
                    onClose={() => setViewingGuest(null)}
                    onEdit={() => {
                        setEditingGuest(viewingGuest);
                        setViewingGuest(null);
                    }}
                    onDelete={() => {
                        handleDeleteGuest(viewingGuest.id);
                        setViewingGuest(null);
                    }}
                />
            )}

            {/* CSV Import/Export Modal */}
            {showCSVModal && (
                <CSVImportExport
                    guests={guests}
                    onImport={handleCSVImport}
                    onClose={() => setShowCSVModal(false)}
                />
            )}
        </div>
    );
}

// Guest Form Modal Component
function GuestFormModal({
    guest,
    onSave,
    onClose,
}: {
    guest: Guest | null;
    onSave: (data: Partial<Guest>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Guest>>(
        guest || {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            relationship: '',
            country: '',
            tags: [],
            allowPlusOne: false,
            isVip: false,
            dietaryRestrictions: [],
        }
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    const handleChange = (field: keyof Guest, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">{guest ? 'Edit Guest' : 'Add Guest'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">First Name *</label>
                            <input
                                type="text"
                                value={formData.firstName}
                                onChange={(e) => handleChange('firstName', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Last Name *</label>
                            <input
                                type="text"
                                value={formData.lastName}
                                onChange={(e) => handleChange('lastName', e.target.value)}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Email</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Phone</label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleChange('phone', e.target.value)}
                                className="input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Relationship *</label>
                        <input
                            type="text"
                            value={formData.relationship}
                            onChange={(e) => handleChange('relationship', e.target.value)}
                            className="input"
                            placeholder="e.g., Bride's Sister, Groom's Friend"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Country</label>
                        <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => handleChange('country', e.target.value)}
                            className="input"
                        />
                    </div>

                    <div className="flex items-center space-x-6">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.allowPlusOne}
                                onChange={(e) => handleChange('allowPlusOne', e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">Allow Plus One</span>
                        </label>
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={formData.isVip}
                                onChange={(e) => handleChange('isVip', e.target.checked)}
                                className="rounded border-slate-300"
                            />
                            <span className="text-sm text-slate-700">VIP Guest</span>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {guest ? 'Update Guest' : 'Add Guest'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
