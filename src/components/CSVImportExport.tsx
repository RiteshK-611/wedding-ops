import React, { useState, useRef } from 'react';
import type { Guest } from '../types';
import { Upload, Download, X, Check, AlertTriangle, FileText } from 'lucide-react';

interface CSVImportExportProps {
    guests: Guest[];
    onImport: (guests: Partial<Guest>[]) => void;
    onClose: () => void;
}

export default function CSVImportExport({ guests, onImport, onClose }: CSVImportExportProps) {
    const [mode, setMode] = useState<'import' | 'export'>('import');
    const [importData, setImportData] = useState<Partial<Guest>[]>([]);
    const [parseErrors, setParseErrors] = useState<string[]>([]);
    const [imported, setImported] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Export guests to CSV
    const handleExport = () => {
        const headers = [
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Relationship',
            'RSVP Status',
            'Country',
            'VIP',
            'Plus One Allowed',
            'Plus One Name',
            'Dietary Restrictions',
            'Arrival Date',
            'Departure Date',
            'Notes'
        ];

        const rows = guests.map(g => [
            g.firstName,
            g.lastName,
            g.email || '',
            g.phone || '',
            g.relationship || '',
            g.globalRsvpStatus,
            g.country || '',
            g.isVip ? 'Yes' : 'No',
            g.allowPlusOne ? 'Yes' : 'No',
            g.plusOneName || '',
            (g.dietaryRestrictions || []).join('; '),
            g.arrivalDate || '',
            g.departureDate || '',
            g.notes || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `wedding-guests-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Parse CSV file
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            parseCSV(text);
        };
        reader.readAsText(file);
    };

    const parseCSV = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) {
            setParseErrors(['CSV file must have a header row and at least one data row']);
            return;
        }

        const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
        const errors: string[] = [];
        const parsedGuests: Partial<Guest>[] = [];

        // Map headers to guest fields
        const headerMap: Record<string, keyof Guest> = {
            'first name': 'firstName',
            'firstname': 'firstName',
            'last name': 'lastName',
            'lastname': 'lastName',
            'email': 'email',
            'phone': 'phone',
            'relationship': 'relationship',
            'rsvp status': 'globalRsvpStatus',
            'rsvp': 'globalRsvpStatus',
            'country': 'country',
            'vip': 'isVip',
            'plus one allowed': 'allowPlusOne',
            'plusone': 'allowPlusOne',
            'plus one name': 'plusOneName',
            'dietary restrictions': 'dietaryRestrictions',
            'dietary': 'dietaryRestrictions',
            'arrival date': 'arrivalDate',
            'arrival': 'arrivalDate',
            'departure date': 'departureDate',
            'departure': 'departureDate',
            'notes': 'notes',
        };

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            if (values.length === 0) continue;

            const guest: Partial<Guest> = {};

            headers.forEach((header, index) => {
                const field = headerMap[header];
                if (field && values[index] !== undefined) {
                    let value: any = values[index].trim();

                    // Handle boolean fields
                    if (field === 'isVip' || field === 'allowPlusOne') {
                        value = value.toLowerCase() === 'yes' || value.toLowerCase() === 'true' || value === '1';
                    }

                    // Handle RSVP status
                    if (field === 'globalRsvpStatus') {
                        const lower = value.toLowerCase();
                        if (lower === 'yes' || lower === 'confirmed' || lower === 'attending') {
                            value = 'yes';
                        } else if (lower === 'no' || lower === 'declined') {
                            value = 'no';
                        } else {
                            value = 'pending';
                        }
                    }

                    // Handle dietary restrictions (semicolon-separated)
                    if (field === 'dietaryRestrictions') {
                        value = value ? value.split(';').map((s: string) => s.trim()).filter(Boolean) : [];
                    }

                    (guest as any)[field] = value;
                }
            });

            // Validate required fields
            if (!guest.firstName) {
                errors.push(`Row ${i}: Missing first name`);
                continue;
            }
            if (!guest.lastName) {
                errors.push(`Row ${i}: Missing last name`);
                continue;
            }

            parsedGuests.push(guest);
        }

        setImportData(parsedGuests);
        setParseErrors(errors);
    };

    // Parse a single CSV line, handling quoted values
    const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);

        return result;
    };

    const handleImport = () => {
        onImport(importData);
        setImported(true);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">
                        {mode === 'import' ? 'Import Guests' : 'Export Guests'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="border-b border-slate-200 px-6">
                    <div className="flex space-x-4">
                        <button
                            onClick={() => setMode('import')}
                            className={`py-3 border-b-2 font-medium text-sm ${mode === 'import'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Upload className="w-4 h-4 inline-block mr-2" />
                            Import CSV
                        </button>
                        <button
                            onClick={() => setMode('export')}
                            className={`py-3 border-b-2 font-medium text-sm ${mode === 'export'
                                    ? 'border-primary-500 text-primary-600'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                                }`}
                        >
                            <Download className="w-4 h-4 inline-block mr-2" />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {mode === 'import' ? (
                        <div className="space-y-6">
                            {imported ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                                        Successfully imported {importData.length} guests!
                                    </h3>
                                    <button onClick={onClose} className="btn-primary mt-4">
                                        Done
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Upload Area */}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 transition-colors"
                                    >
                                        <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                                        <p className="text-slate-700 font-medium">Click to upload CSV file</p>
                                        <p className="text-sm text-slate-500 mt-1">or drag and drop</p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".csv"
                                            onChange={handleFileUpload}
                                            className="hidden"
                                        />
                                    </div>

                                    {/* Template Download */}
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <h4 className="font-medium text-slate-900 mb-2">CSV Format</h4>
                                        <p className="text-sm text-slate-600 mb-3">
                                            Your CSV should include these columns:
                                        </p>
                                        <code className="text-xs bg-slate-200 px-2 py-1 rounded block overflow-x-auto">
                                            First Name, Last Name, Email, Phone, Relationship, RSVP Status, Country, VIP, Plus One Allowed, Dietary Restrictions, Arrival Date, Departure Date, Notes
                                        </code>
                                    </div>

                                    {/* Parse Errors */}
                                    {parseErrors.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                            <div className="flex items-center mb-2">
                                                <AlertTriangle className="w-5 h-5 text-amber-600 mr-2" />
                                                <h4 className="font-medium text-amber-800">Warnings</h4>
                                            </div>
                                            <ul className="text-sm text-amber-700 space-y-1">
                                                {parseErrors.slice(0, 5).map((error, i) => (
                                                    <li key={i}>• {error}</li>
                                                ))}
                                                {parseErrors.length > 5 && (
                                                    <li>• ...and {parseErrors.length - 5} more</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}

                                    {/* Preview */}
                                    {importData.length > 0 && (
                                        <div>
                                            <h4 className="font-medium text-slate-900 mb-3">
                                                Preview ({importData.length} guests)
                                            </h4>
                                            <div className="border border-slate-200 rounded-lg overflow-hidden">
                                                <div className="max-h-64 overflow-y-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-slate-600">Name</th>
                                                                <th className="px-4 py-2 text-left text-slate-600">Email</th>
                                                                <th className="px-4 py-2 text-left text-slate-600">RSVP</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {importData.slice(0, 10).map((guest, i) => (
                                                                <tr key={i}>
                                                                    <td className="px-4 py-2">{guest.firstName} {guest.lastName}</td>
                                                                    <td className="px-4 py-2 text-slate-500">{guest.email || '-'}</td>
                                                                    <td className="px-4 py-2">
                                                                        <span className={`px-2 py-0.5 text-xs rounded ${guest.globalRsvpStatus === 'yes' ? 'bg-green-100 text-green-700' :
                                                                                guest.globalRsvpStatus === 'no' ? 'bg-red-100 text-red-700' :
                                                                                    'bg-amber-100 text-amber-700'
                                                                            }`}>
                                                                            {guest.globalRsvpStatus || 'pending'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    {importData.length > 10 && (
                                                        <p className="px-4 py-2 text-sm text-slate-500 bg-slate-50">
                                                            ...and {importData.length - 10} more
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center py-8">
                                <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-slate-900 mb-2">
                                    Export {guests.length} Guests to CSV
                                </h3>
                                <p className="text-slate-500 mb-6">
                                    Download all guest data as a CSV file for backup or external use.
                                </p>
                                <button onClick={handleExport} className="btn-primary">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download CSV
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {mode === 'import' && importData.length > 0 && !imported && (
                    <div className="border-t border-slate-200 px-6 py-4 flex justify-end space-x-3">
                        <button onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button onClick={handleImport} className="btn-primary">
                            Import {importData.length} Guests
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
