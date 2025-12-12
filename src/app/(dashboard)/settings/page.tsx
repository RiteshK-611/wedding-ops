'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import type { Venue } from '@/types';
import {
    Heart, MapPin, Users, Link2,
    Plus, Edit, Trash2, X, Save, LogOut
} from 'lucide-react';

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'wedding' | 'venues' | 'team' | 'integrations'>('wedding');

    const tabs = [
        { id: 'wedding', label: 'Wedding Details', icon: Heart },
        { id: 'venues', label: 'Venues', icon: MapPin },
        { id: 'team', label: 'Team & Permissions', icon: Users },
        { id: 'integrations', label: 'Integrations', icon: Link2 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
                    <p className="text-slate-600 mt-1">Manage your wedding details and preferences</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar */}
                <div className="lg:w-64 flex-shrink-0">
                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5 mr-3" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="flex-1">
                    {activeTab === 'wedding' && <WeddingDetailsTab />}
                    {activeTab === 'venues' && <VenuesTab />}
                    {activeTab === 'team' && <TeamTab />}
                    {activeTab === 'integrations' && <IntegrationsTab />}
                </div>
            </div>
        </div>
    );
}

// Wedding Details Tab
function WeddingDetailsTab() {
    const currentWedding = useStore((state) => state.currentWedding);
    const setCurrentWedding = useStore((state) => state.setCurrentWedding);
    const [saved, setSaved] = useState(false);

    const [formData, setFormData] = useState({
        partner1Name: currentWedding?.partner1Name || '',
        partner2Name: currentWedding?.partner2Name || '',
        weddingDate: currentWedding?.weddingDate || '',
        eventStartDate: currentWedding?.eventStartDate || '',
        eventEndDate: currentWedding?.eventEndDate || '',
        estimatedGuestCount: currentWedding?.estimatedGuestCount || 100,
        primaryContactEmail: currentWedding?.primaryContactEmail || '',
        coverPhotoUrl: currentWedding?.coverPhotoUrl || '',
    });

    const handleSave = () => {
        if (currentWedding) {
            setCurrentWedding({
                ...currentWedding,
                ...formData,
                updatedAt: new Date().toISOString(),
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
    };

    return (
        <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Wedding Details</h2>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label">Partner 1 Name</label>
                        <input
                            type="text"
                            value={formData.partner1Name}
                            onChange={(e) => setFormData({ ...formData, partner1Name: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Partner 2 Name</label>
                        <input
                            type="text"
                            value={formData.partner2Name}
                            onChange={(e) => setFormData({ ...formData, partner2Name: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="label">Wedding Date</label>
                        <input
                            type="date"
                            value={formData.weddingDate}
                            onChange={(e) => setFormData({ ...formData, weddingDate: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Event Start Date</label>
                        <input
                            type="date"
                            value={formData.eventStartDate}
                            onChange={(e) => setFormData({ ...formData, eventStartDate: e.target.value })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Event End Date</label>
                        <input
                            type="date"
                            value={formData.eventEndDate}
                            onChange={(e) => setFormData({ ...formData, eventEndDate: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label">Estimated Guest Count</label>
                        <input
                            type="number"
                            value={formData.estimatedGuestCount}
                            onChange={(e) => setFormData({ ...formData, estimatedGuestCount: parseInt(e.target.value) })}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Primary Contact Email</label>
                        <input
                            type="email"
                            value={formData.primaryContactEmail}
                            onChange={(e) => setFormData({ ...formData, primaryContactEmail: e.target.value })}
                            className="input"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4 border-t">
                    {saved && (
                        <span className="text-green-600 text-sm flex items-center">
                            <Save className="w-4 h-4 mr-1" /> Saved successfully
                        </span>
                    )}
                    <button onClick={handleSave} className="btn-primary">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

// Venues Tab
function VenuesTab() {
    const venues = useStore((state) => state.venues);
    const addVenue = useStore((state) => state.addVenue);
    const updateVenue = useStore((state) => state.updateVenue);
    const deleteVenue = useStore((state) => state.deleteVenue);
    const currentWedding = useStore((state) => state.currentWedding);

    const [showModal, setShowModal] = useState(false);
    const [editingVenue, setEditingVenue] = useState<Venue | null>(null);

    const handleAdd = (data: Partial<Venue>) => {
        const newVenue: Venue = {
            id: Date.now().toString(),
            weddingId: currentWedding?.id || '1',
            name: data.name || '',
            address: data.address || '',
            city: data.city || '',
            country: data.country || '',
            contactName: data.contactName,
            contactPhone: data.contactPhone,
            contactEmail: data.contactEmail,
            notes: data.notes,
            spaces: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        addVenue(newVenue);
        setShowModal(false);
    };

    const handleUpdate = (data: Partial<Venue>) => {
        if (editingVenue) {
            updateVenue(editingVenue.id, data);
            setEditingVenue(null);
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Are you sure you want to delete this venue?')) {
            deleteVenue(id);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Venues</h2>
                <button onClick={() => setShowModal(true)} className="btn-primary flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Venue
                </button>
            </div>

            {venues.length === 0 ? (
                <div className="card text-center py-12">
                    <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No venues yet</h3>
                    <p className="text-slate-500 mb-4">Add your wedding venues to keep track of locations</p>
                    <button onClick={() => setShowModal(true)} className="btn-primary">
                        Add Venue
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {venues.map((venue) => (
                        <div key={venue.id} className="card">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-primary-600" />
                                </div>
                                <div className="flex items-center space-x-1">
                                    <button
                                        onClick={() => setEditingVenue(venue)}
                                        className="p-1 text-slate-400 hover:text-primary-600"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(venue.id)}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-semibold text-slate-900">{venue.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{venue.address}</p>
                            <p className="text-sm text-slate-500">{venue.city}, {venue.country}</p>
                            {venue.contactName && (
                                <p className="text-xs text-slate-400 mt-2">Contact: {venue.contactName}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {(showModal || editingVenue) && (
                <VenueFormModal
                    venue={editingVenue}
                    onSave={editingVenue ? handleUpdate : handleAdd}
                    onClose={() => {
                        setShowModal(false);
                        setEditingVenue(null);
                    }}
                />
            )}
        </div>
    );
}

// Venue Form Modal
function VenueFormModal({
    venue,
    onSave,
    onClose,
}: {
    venue: Venue | null;
    onSave: (data: Partial<Venue>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState({
        name: venue?.name || '',
        address: venue?.address || '',
        city: venue?.city || '',
        country: venue?.country || '',
        contactName: venue?.contactName || '',
        contactPhone: venue?.contactPhone || '',
        contactEmail: venue?.contactEmail || '',
        notes: venue?.notes || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {venue ? 'Edit Venue' : 'Add Venue'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Venue Name *</label>
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
                            <label className="label">City</label>
                            <input
                                type="text"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Country</label>
                            <input
                                type="text"
                                value={formData.country}
                                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    <hr className="my-4" />

                    <div>
                        <label className="label">Contact Name</label>
                        <input
                            type="text"
                            value={formData.contactName}
                            onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                            className="input"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Contact Phone</label>
                            <input
                                type="tel"
                                value={formData.contactPhone}
                                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Contact Email</label>
                            <input
                                type="email"
                                value={formData.contactEmail}
                                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="input min-h-[80px]"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            {venue ? 'Update' : 'Add'} Venue
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Team Tab - Invite team members and manage permissions
function TeamTab() {
    const [teamMembers, setTeamMembers] = useState<Array<{
        id: string;
        email: string;
        name: string;
        role: 'admin' | 'planner' | 'couple' | 'vendor' | 'hotel';
        status: 'active' | 'pending';
        invitedAt: string;
    }>>([
        // Example team member
        { id: '1', email: 'planner@example.com', name: 'You', role: 'admin', status: 'active', invitedAt: new Date().toISOString() }
    ]);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'planner' | 'couple' | 'vendor' | 'hotel'>('planner');
    const [inviteName, setInviteName] = useState('');

    const roleLabels = {
        admin: { label: 'Admin', color: 'bg-purple-100 text-purple-700', description: 'Full access to everything' },
        planner: { label: 'Planner', color: 'bg-blue-100 text-blue-700', description: 'Manage guests, seating, accommodations' },
        couple: { label: 'Couple', color: 'bg-pink-100 text-pink-700', description: 'View everything, limited editing' },
        vendor: { label: 'Vendor', color: 'bg-green-100 text-green-700', description: 'Access to assigned areas only' },
        hotel: { label: 'Hotel Liaison', color: 'bg-amber-100 text-amber-700', description: 'Room assignments only' },
    };

    const handleInvite = () => {
        if (!inviteEmail) return;

        const newMember = {
            id: Date.now().toString(),
            email: inviteEmail,
            name: inviteName || inviteEmail.split('@')[0],
            role: inviteRole,
            status: 'pending' as const,
            invitedAt: new Date().toISOString(),
        };

        setTeamMembers([...teamMembers, newMember]);
        setInviteEmail('');
        setInviteName('');
        setShowInviteModal(false);

        // TODO: Send actual invite email via Supabase/email service
        alert(`Invitation sent to ${inviteEmail}! (Note: Email sending requires backend integration)`);
    };

    const handleRemove = (id: string) => {
        if (window.confirm('Remove this team member?')) {
            setTeamMembers(teamMembers.filter(m => m.id !== id));
        }
    };

    const handleChangeRole = (id: string, newRole: typeof inviteRole) => {
        setTeamMembers(teamMembers.map(m =>
            m.id === id ? { ...m, role: newRole } : m
        ));
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Team & Permissions</h2>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="btn-primary flex items-center"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Invite Member
                </button>
            </div>

            {/* Role Legend */}
            <div className="card p-4">
                <h3 className="text-sm font-medium text-slate-700 mb-3">Role Permissions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                    {Object.entries(roleLabels).map(([key, value]) => (
                        <div key={key} className="text-center">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${value.color}`}>
                                {value.label}
                            </span>
                            <p className="text-xs text-slate-500 mt-1">{value.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Team Members List */}
            <div className="card">
                <div className="divide-y divide-slate-200">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                                    {getInitials(member.name)}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900 flex items-center gap-2">
                                        {member.name}
                                        {member.status === 'pending' && (
                                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-500">{member.email}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select
                                    value={member.role}
                                    onChange={(e) => handleChangeRole(member.id, e.target.value as any)}
                                    className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    disabled={member.id === '1'} // Can't change own role
                                >
                                    <option value="admin">Admin</option>
                                    <option value="planner">Planner</option>
                                    <option value="couple">Couple</option>
                                    <option value="vendor">Vendor</option>
                                    <option value="hotel">Hotel Liaison</option>
                                </select>
                                {member.id !== '1' && (
                                    <button
                                        onClick={() => handleRemove(member.id)}
                                        className="p-1 text-slate-400 hover:text-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Invite Team Member</h2>
                            <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="label">Email Address *</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="input"
                                    placeholder="colleague@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="label">Name (optional)</label>
                                <input
                                    type="text"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    className="input"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="label">Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                                    className="input"
                                >
                                    <option value="planner">Planner (manage everything)</option>
                                    <option value="couple">Couple (view + limited edit)</option>
                                    <option value="vendor">Vendor (assigned areas only)</option>
                                    <option value="hotel">Hotel Liaison (rooms only)</option>
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    {roleLabels[inviteRole].description}
                                </p>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleInvite}
                                    disabled={!inviteEmail}
                                    className="btn-primary"
                                >
                                    Send Invitation
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Integrations Tab (Placeholder)
function IntegrationsTab() {
    const integrations = [
        { name: 'Email Service', description: 'SendGrid, Mailchimp', connected: false },
        { name: 'Calendar Sync', description: 'Google Calendar, iCal', connected: false },
        { name: 'SMS Provider', description: 'Twilio, Vonage', connected: false },
        { name: 'Payment Gateway', description: 'Stripe, PayPal', connected: false },
    ];

    return (
        <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Integrations</h2>
            <div className="space-y-4">
                {integrations.map((integration, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                        <div>
                            <h4 className="font-medium text-slate-900">{integration.name}</h4>
                            <p className="text-sm text-slate-500">{integration.description}</p>
                        </div>
                        <button className="btn-secondary text-sm" disabled>
                            Connect
                        </button>
                    </div>
                ))}
            </div>
            <p className="text-sm text-slate-500 mt-4 text-center">
                Integrations will be available in a future update
            </p>
        </div>
    );
}
