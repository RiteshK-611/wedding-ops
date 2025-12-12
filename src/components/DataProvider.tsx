'use client';

/**
 * DataProvider Component
 * Handles loading data from Supabase when user is authenticated
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useSupabaseSync } from '../hooks/useSupabaseSync';

interface DataProviderProps {
    children: ReactNode;
}

export function DataProvider({ children }: DataProviderProps) {
    const { isLoading, isLoaded, error } = useSupabaseSync();

    // Log sync status for debugging
    useEffect(() => {
        if (error) {
            console.error('Data sync error:', error);
        }
        if (isLoaded) {
            console.log('Data sync complete');
        }
    }, [isLoaded, error]);

    // Show loading state only on initial load
    if (isLoading && !isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                    <p className="text-slate-600">Loading your wedding data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Error</h2>
                    <p className="text-slate-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="btn-primary"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
