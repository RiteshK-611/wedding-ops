'use client';

import { DataProvider } from '@/components/DataProvider';
import { AuthProvider } from '@/contexts/AuthContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <DataProvider>{children}</DataProvider>
        </AuthProvider>
    );
}
