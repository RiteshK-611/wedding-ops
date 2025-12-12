'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import { Mail, Send, Users, Calendar, Check, Clock, X } from 'lucide-react';

interface Message {
    id: string;
    subject: string;
    content: string;
    recipientType: 'all' | 'confirmed' | 'pending' | 'declined' | 'custom';
    recipientCount: number;
    sentAt: string;
    status: 'draft' | 'sent' | 'scheduled';
}

export default function MessagesPage() {
    const guests = useStore((state) => state.guests);

    const [showComposeModal, setShowComposeModal] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        // Sample messages for demo
    ]);

    const handleSendMessage = (messageData: Partial<Message>) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            subject: messageData.subject || '',
            content: messageData.content || '',
            recipientType: messageData.recipientType || 'all',
            recipientCount: getRecipientCount(messageData.recipientType || 'all'),
            sentAt: new Date().toISOString(),
            status: 'sent',
        };
        setMessages([newMessage, ...messages]);
        setShowComposeModal(false);
    };

    const getRecipientCount = (type: string) => {
        switch (type) {
            case 'all': return guests.length;
            case 'confirmed': return guests.filter(g => g.globalRsvpStatus === 'yes').length;
            case 'pending': return guests.filter(g => g.globalRsvpStatus === 'pending').length;
            case 'declined': return guests.filter(g => g.globalRsvpStatus === 'no').length;
            default: return 0;
        }
    };

    // Quick stats
    const confirmedCount = guests.filter(g => g.globalRsvpStatus === 'yes').length;
    const pendingCount = guests.filter(g => g.globalRsvpStatus === 'pending').length;
    const declinedCount = guests.filter(g => g.globalRsvpStatus === 'no').length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
                    <p className="text-slate-600 mt-1">Send invitations and updates to guests</p>
                </div>
                <button onClick={() => setShowComposeModal(true)} className="btn-primary flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Compose Message
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-slate-900">{guests.length}</div>
                            <div className="text-sm text-slate-500">Total Guests</div>
                        </div>
                        <Users className="w-8 h-8 text-slate-300" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-green-600">{confirmedCount}</div>
                            <div className="text-sm text-slate-500">Confirmed</div>
                        </div>
                        <Check className="w-8 h-8 text-green-200" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-amber-600">{pendingCount}</div>
                            <div className="text-sm text-slate-500">Pending RSVP</div>
                        </div>
                        <Clock className="w-8 h-8 text-amber-200" />
                    </div>
                </div>
                <div className="card">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-2xl font-bold text-red-600">{declinedCount}</div>
                            <div className="text-sm text-slate-500">Declined</div>
                        </div>
                        <X className="w-8 h-8 text-red-200" />
                    </div>
                </div>
            </div>

            {/* Message Templates */}
            <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    >
                        <Mail className="w-8 h-8 text-primary-600 mb-2" />
                        <h4 className="font-medium text-slate-900">Send RSVP Reminder</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            Remind {pendingCount} guests to respond
                        </p>
                    </button>

                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    >
                        <Calendar className="w-8 h-8 text-primary-600 mb-2" />
                        <h4 className="font-medium text-slate-900">Event Update</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            Send schedule updates to confirmed guests
                        </p>
                    </button>

                    <button
                        onClick={() => setShowComposeModal(true)}
                        className="p-4 border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
                    >
                        <Users className="w-8 h-8 text-primary-600 mb-2" />
                        <h4 className="font-medium text-slate-900">Thank You Message</h4>
                        <p className="text-sm text-slate-500 mt-1">
                            Thank guests for attending
                        </p>
                    </button>
                </div>
            </div>

            {/* Message History */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Message History</h3>
                    <span className="text-sm text-slate-500">{messages.length} messages sent</span>
                </div>

                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <Mail className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="font-medium text-slate-900 mb-2">No messages sent yet</h4>
                        <p className="text-sm text-slate-500 mb-4">
                            Compose your first message to guests
                        </p>
                        <button onClick={() => setShowComposeModal(true)} className="btn-primary">
                            Compose Message
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-medium text-slate-900">{message.subject}</h4>
                                        <p className="text-sm text-slate-500 mt-1 line-clamp-1">
                                            {message.content}
                                        </p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${message.status === 'sent'
                                            ? 'bg-green-100 text-green-700'
                                            : message.status === 'scheduled'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-slate-100 text-slate-700'
                                            }`}>
                                            {message.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center">
                                        <Users className="w-3 h-3 mr-1" />
                                        {message.recipientCount} recipients
                                    </span>
                                    <span>
                                        {new Date(message.sentAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {showComposeModal && (
                <ComposeMessageModal
                    guests={guests}
                    onSend={handleSendMessage}
                    onClose={() => setShowComposeModal(false)}
                />
            )}
        </div>
    );
}

// Compose Message Modal
function ComposeMessageModal({
    guests,
    onSend,
    onClose,
}: {
    guests: any[];
    onSend: (data: Partial<Message>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState({
        subject: '',
        content: '',
        recipientType: 'all' as 'all' | 'confirmed' | 'pending' | 'declined' | 'custom',
    });

    const getRecipientCount = () => {
        switch (formData.recipientType) {
            case 'all': return guests.length;
            case 'confirmed': return guests.filter(g => g.globalRsvpStatus === 'yes').length;
            case 'pending': return guests.filter(g => g.globalRsvpStatus === 'pending').length;
            case 'declined': return guests.filter(g => g.globalRsvpStatus === 'no').length;
            default: return 0;
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSend(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Compose Message</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Recipients</label>
                        <select
                            value={formData.recipientType}
                            onChange={(e) => setFormData({ ...formData, recipientType: e.target.value as any })}
                            className="input"
                        >
                            <option value="all">All Guests ({guests.length})</option>
                            <option value="confirmed">
                                Confirmed Only ({guests.filter(g => g.globalRsvpStatus === 'yes').length})
                            </option>
                            <option value="pending">
                                Pending RSVP ({guests.filter(g => g.globalRsvpStatus === 'pending').length})
                            </option>
                            <option value="declined">
                                Declined ({guests.filter(g => g.globalRsvpStatus === 'no').length})
                            </option>
                        </select>
                        <p className="text-sm text-slate-500 mt-1">
                            Message will be sent to {getRecipientCount()} guests
                        </p>
                    </div>

                    <div>
                        <label className="label">Subject *</label>
                        <input
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="input"
                            placeholder="e.g., Wedding Weekend Details"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Message *</label>
                        <textarea
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            className="input min-h-[200px]"
                            placeholder="Write your message here..."
                            required
                        />
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-slate-700 mb-2">Available Variables</h4>
                        <div className="flex flex-wrap gap-2">
                            {['{first_name}', '{last_name}', '{rsvp_link}', '{event_date}', '{venue}'].map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, content: formData.content + ' ' + v })}
                                    className="px-2 py-1 text-xs bg-white border border-slate-200 rounded hover:bg-slate-100"
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary flex items-center">
                            <Send className="w-4 h-4 mr-2" />
                            Send Message
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
