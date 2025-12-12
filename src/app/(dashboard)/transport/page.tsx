'use client';

import { useState } from 'react';
import { useStore } from '@/store';
import type { Route, Vehicle } from '@/types';
import { Bus, Plus, Edit, Trash2, X, Clock, MapPin, Users } from 'lucide-react';

export default function TransportPage() {
    const routes = useStore((state) => state.routes);
    const vehicles = useStore((state) => state.vehicles);
    const addRoute = useStore((state) => state.addRoute);
    const updateRoute = useStore((state) => state.updateRoute);
    const deleteRoute = useStore((state) => state.deleteRoute);
    const addVehicle = useStore((state) => state.addVehicle);
    const deleteVehicle = useStore((state) => state.deleteVehicle);
    const currentWedding = useStore((state) => state.currentWedding);
    const events = useStore((state) => state.events);

    const [showRouteModal, setShowRouteModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState<Route | null>(null);
    const [showVehicleModal, setShowVehicleModal] = useState(false);
    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

    const handleAddRoute = (formData: Partial<Route>) => {
        const newRoute: Route = {
            id: Date.now().toString(),
            weddingId: currentWedding?.id || '1',
            name: formData.name || '',
            routeType: formData.routeType || 'shuttle',
            pickupLocation: formData.pickupLocation || '',
            dropoffLocation: formData.dropoffLocation || '',
            departureTime: formData.departureTime || '',
            eventId: formData.eventId,
            notes: formData.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        addRoute(newRoute);
        setShowRouteModal(false);
    };

    const handleUpdateRoute = (formData: Partial<Route>) => {
        if (editingRoute) {
            updateRoute(editingRoute.id, formData);
            setEditingRoute(null);
        }
    };

    const handleDeleteRoute = (id: string) => {
        if (window.confirm('Delete this route and all its vehicles?')) {
            vehicles.filter(v => v.routeId === id).forEach(v => deleteVehicle(v.id));
            deleteRoute(id);
        }
    };

    const handleAddVehicle = (formData: Partial<Vehicle>) => {
        if (!selectedRouteId) return;
        const newVehicle: Vehicle = {
            id: Date.now().toString(),
            routeId: selectedRouteId,
            vehicleType: formData.vehicleType || 'bus',
            vehicleName: formData.vehicleName,
            capacity: formData.capacity || 40,
            driverName: formData.driverName,
            driverPhone: formData.driverPhone,
            licensePlate: formData.licensePlate,
            assignedGuestIds: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        addVehicle(newVehicle);
        setShowVehicleModal(false);
        setSelectedRouteId(null);
    };

    const getRouteStats = (routeId: string) => {
        const routeVehicles = vehicles.filter(v => v.routeId === routeId);
        const totalCapacity = routeVehicles.reduce((sum, v) => sum + v.capacity, 0);
        const assignedGuests = routeVehicles.reduce(
            (sum, v) => sum + (v.assignedGuestIds?.length || 0),
            0
        );
        return { vehicles: routeVehicles.length, totalCapacity, assignedGuests };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Transport</h1>
                    <p className="text-slate-600 mt-1">
                        {routes.length} routes · {vehicles.length} vehicles
                    </p>
                </div>
                <button onClick={() => setShowRouteModal(true)} className="btn-primary flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Route
                </button>
            </div>

            {routes.length === 0 ? (
                <div className="card text-center py-12">
                    <Bus className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No transport routes yet</h3>
                    <p className="text-slate-500 mb-4">Create shuttle routes to transport guests between venues</p>
                    <button onClick={() => setShowRouteModal(true)} className="btn-primary">
                        Add Route
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {routes.map((route) => {
                        const stats = getRouteStats(route.id);
                        const routeVehicles = vehicles.filter(v => v.routeId === route.id);
                        const linkedEvent = events.find(e => e.id === route.eventId);

                        return (
                            <div key={route.id} className="card">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start space-x-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                                            <Bus className="w-6 h-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-slate-900">{route.name}</h3>
                                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded mt-1 ${route.routeType === 'shuttle'
                                                ? 'bg-blue-100 text-blue-700'
                                                : route.routeType === 'charter'
                                                    ? 'bg-purple-100 text-purple-700'
                                                    : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {route.routeType.charAt(0).toUpperCase() + route.routeType.slice(1)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setEditingRoute(route)}
                                            className="p-2 text-slate-400 hover:text-primary-600"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteRoute(route.id)}
                                            className="p-2 text-slate-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Route Details */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="flex items-center text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 mr-2 text-green-500" />
                                        <span>From: {route.pickupLocation}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <MapPin className="w-4 h-4 mr-2 text-red-500" />
                                        <span>To: {route.dropoffLocation}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-600">
                                        <Clock className="w-4 h-4 mr-2" />
                                        <span>Departs: {route.departureTime}</span>
                                    </div>
                                </div>

                                {linkedEvent && (
                                    <div className="mb-4 text-sm text-slate-500">
                                        Linked to: <span className="font-medium">{linkedEvent.name}</span>
                                    </div>
                                )}

                                {/* Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 rounded-lg">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-slate-900">{stats.vehicles}</div>
                                        <div className="text-xs text-slate-500">Vehicles</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">{stats.totalCapacity}</div>
                                        <div className="text-xs text-slate-500">Total Capacity</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-amber-600">{stats.assignedGuests}</div>
                                        <div className="text-xs text-slate-500">Assigned</div>
                                    </div>
                                </div>

                                {/* Vehicles */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-medium text-slate-700">Vehicles</h4>
                                        <button
                                            onClick={() => {
                                                setSelectedRouteId(route.id);
                                                setShowVehicleModal(true);
                                            }}
                                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            + Add Vehicle
                                        </button>
                                    </div>

                                    {routeVehicles.length === 0 ? (
                                        <p className="text-sm text-slate-500 py-4 text-center">No vehicles added yet</p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {routeVehicles.map((vehicle) => (
                                                <div key={vehicle.id} className="p-3 bg-white border border-slate-200 rounded-lg">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-2">
                                                            <Bus className="w-4 h-4 text-slate-400" />
                                                            <span className="font-medium">
                                                                {vehicle.vehicleName || vehicle.vehicleType}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => deleteVehicle(vehicle.id)}
                                                            className="text-slate-400 hover:text-red-600"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <div className="mt-1 flex items-center text-xs text-slate-500">
                                                        <Users className="w-3 h-3 mr-1" />
                                                        Capacity: {vehicle.capacity}
                                                        {vehicle.assignedGuestIds && vehicle.assignedGuestIds.length > 0 && (
                                                            <span className="ml-2 text-amber-600">
                                                                ({vehicle.assignedGuestIds.length} assigned)
                                                            </span>
                                                        )}
                                                    </div>
                                                    {vehicle.driverName && (
                                                        <div className="mt-1 text-xs text-slate-500">
                                                            Driver: {vehicle.driverName}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {route.notes && (
                                    <p className="mt-4 text-sm text-slate-500 border-t pt-4">{route.notes}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Route Modal */}
            {(showRouteModal || editingRoute) && (
                <RouteFormModal
                    route={editingRoute}
                    events={events}
                    onSave={editingRoute ? handleUpdateRoute : handleAddRoute}
                    onClose={() => {
                        setShowRouteModal(false);
                        setEditingRoute(null);
                    }}
                />
            )}

            {/* Vehicle Modal */}
            {showVehicleModal && (
                <VehicleFormModal
                    onSave={handleAddVehicle}
                    onClose={() => {
                        setShowVehicleModal(false);
                        setSelectedRouteId(null);
                    }}
                />
            )}
        </div>
    );
}

// Route Form Modal
function RouteFormModal({
    route,
    events,
    onSave,
    onClose,
}: {
    route: Route | null;
    events: any[];
    onSave: (data: Partial<Route>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Route>>(
        route || {
            name: '',
            routeType: 'shuttle',
            pickupLocation: '',
            dropoffLocation: '',
            departureTime: '',
            eventId: '',
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
                        {route ? 'Edit Route' : 'Add Route'}
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="label">Route Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="input"
                            placeholder="e.g., Hotel to Ceremony"
                            required
                        />
                    </div>

                    <div>
                        <label className="label">Route Type</label>
                        <select
                            value={formData.routeType}
                            onChange={(e) => setFormData({ ...formData, routeType: e.target.value as any })}
                            className="input"
                        >
                            <option value="shuttle">Shuttle</option>
                            <option value="charter">Charter Bus</option>
                            <option value="rideshare">Rideshare</option>
                            <option value="private">Private</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Pickup Location *</label>
                            <input
                                type="text"
                                value={formData.pickupLocation}
                                onChange={(e) => setFormData({ ...formData, pickupLocation: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Dropoff Location *</label>
                            <input
                                type="text"
                                value={formData.dropoffLocation}
                                onChange={(e) => setFormData({ ...formData, dropoffLocation: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Departure Time *</label>
                            <input
                                type="time"
                                value={formData.departureTime}
                                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                className="input"
                                required
                            />
                        </div>
                        <div>
                            <label className="label">Linked Event</label>
                            <select
                                value={formData.eventId || ''}
                                onChange={(e) => setFormData({ ...formData, eventId: e.target.value || undefined })}
                                className="input"
                            >
                                <option value="">None</option>
                                {events.map((event) => (
                                    <option key={event.id} value={event.id}>{event.name}</option>
                                ))}
                            </select>
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
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">
                            {route ? 'Update Route' : 'Add Route'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Vehicle Form Modal
function VehicleFormModal({
    onSave,
    onClose,
}: {
    onSave: (data: Partial<Vehicle>) => void;
    onClose: () => void;
}) {
    const [formData, setFormData] = useState<Partial<Vehicle>>({
        vehicleType: 'bus',
        vehicleName: '',
        capacity: 40,
        driverName: '',
        driverPhone: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Add Vehicle</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Vehicle Type</label>
                            <select
                                value={formData.vehicleType}
                                onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as any })}
                                className="input"
                            >
                                <option value="bus">Bus</option>
                                <option value="van">Van</option>
                                <option value="car">Car</option>
                                <option value="shuttle">Shuttle</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Capacity *</label>
                            <input
                                type="number"
                                value={formData.capacity}
                                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                                className="input"
                                min="1"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="label">Vehicle Name/ID</label>
                        <input
                            type="text"
                            value={formData.vehicleName}
                            onChange={(e) => setFormData({ ...formData, vehicleName: e.target.value })}
                            className="input"
                            placeholder="e.g., Bus #1, Van A"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Driver Name</label>
                            <input
                                type="text"
                                value={formData.driverName}
                                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                className="input"
                            />
                        </div>
                        <div>
                            <label className="label">Driver Phone</label>
                            <input
                                type="tel"
                                value={formData.driverPhone}
                                onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                                className="input"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
                        <button type="submit" className="btn-primary">Add Vehicle</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
