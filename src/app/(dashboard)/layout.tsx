'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
    LayoutDashboard,
    Users,
    Calendar,
    Hotel,
    Bus,
    Mail,
    Settings,
    Menu,
    X,
    Search,
    Bell,
    Plus,
    LogOut,
} from 'lucide-react';
import { useStore } from '@/store';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Guests', href: '/guests', icon: Users },
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Accommodations', href: '/accommodations', icon: Hotel },
    { name: 'Transport', href: '/transport', icon: Bus },
    { name: 'Messages', href: '/messages', icon: Mail },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const currentWedding = useStore((state) => state.currentWedding);
    const currentUser = useStore((state) => state.currentUser);
    const { signOut, user, profile, loading } = useAuth();

    console.log('[Dashboard] State:', { loading, user: user?.email, profile: profile?.weddingId, currentWedding: currentWedding?.id });

    // Redirect to login if not authenticated
    useEffect(() => {
        console.log('[Dashboard] Auth check - loading:', loading, 'user:', !!user);
        if (!loading && !user) {
            console.log('[Dashboard] No user, redirecting to login');
            router.push('/login');
        }
    }, [loading, user, router]);

    // Redirect to onboarding if no wedding (wait for profile to load)
    useEffect(() => {
        console.log('[Dashboard] Wedding check - loading:', loading, 'user:', !!user, 'profile:', profile, 'currentWedding:', currentWedding?.id);
        // Only redirect to onboarding if:
        // 1. Not loading
        // 2. User is authenticated
        // 3. Profile has loaded (not null)
        // 4. Profile has no wedding ID (database is source of truth)
        if (!loading && user && profile !== null && !profile.weddingId) {
            console.log('[Dashboard] No wedding in profile, clearing local store and redirecting to onboarding');
            // Clear stale wedding data from local store if it exists
            if (currentWedding) {
                useStore.getState().setCurrentWedding(null);
            }
            router.push('/onboarding');
        }
    }, [loading, user, profile, currentWedding, router]);

    const handleSignOut = async () => {
        console.log('Signing out...');
        await signOut();
        router.push('/login');
    };

    // Show loading state while checking auth or waiting for profile
    if (loading || (user && profile === null)) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Mobile sidebar */}
            {sidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div className="fixed inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
                    <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
                        <div className="flex h-full flex-col">
                            <div className="flex h-16 items-center justify-between px-4 border-b">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                                        W
                                    </div>
                                    <span className="font-semibold text-slate-900 truncate">
                                        {currentWedding?.coupleName1 || 'Wedding Ops'}
                                    </span>
                                </div>
                                <button onClick={() => setSidebarOpen(false)} className="text-slate-500 hover:text-slate-700">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <nav className="flex-1 space-y-1 px-3 py-4">
                                {navigation.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            onClick={() => setSidebarOpen(false)}
                                            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                                ? 'bg-primary-600 text-white'
                                                : 'text-slate-700 hover:bg-slate-100'
                                                }`}
                                        >
                                            <Icon className="w-5 h-5" />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                            {/* Bottom section - Settings & Sign Out */}
                            <div className="border-t border-slate-200 px-3 py-4 space-y-1">
                                <Link
                                    href="/settings"
                                    onClick={() => setSidebarOpen(false)}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/settings'
                                        ? 'bg-primary-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    <Settings className="w-5 h-5" />
                                    <span>Settings</span>
                                </Link>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span>Sign Out</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop sidebar */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
                <div className="flex flex-col flex-1 bg-white border-r border-slate-200">
                    <div className="flex h-16 items-center px-4 border-b">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">
                                W
                            </div>
                            <span className="font-semibold text-slate-900 truncate">
                                {currentWedding?.coupleName1 && currentWedding?.coupleName2
                                    ? `${currentWedding.coupleName1} & ${currentWedding.coupleName2}`
                                    : 'Wedding Ops'}
                            </span>
                        </div>
                    </div>
                    <nav className="flex-1 space-y-1 px-3 py-4">
                        {navigation.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary-600 text-white'
                                        : 'text-slate-700 hover:bg-slate-100'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>
                    {/* Bottom section - Settings & Sign Out */}
                    <div className="border-t border-slate-200 px-3 py-4 space-y-1">
                        <Link
                            href="/settings"
                            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === '/settings'
                                ? 'bg-primary-600 text-white'
                                : 'text-slate-700 hover:bg-slate-100'
                                }`}
                        >
                            <Settings className="w-5 h-5" />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Top bar */}
                <div className="sticky top-0 z-40 flex h-16 bg-white border-b border-slate-200">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="px-4 text-slate-500 hover:text-slate-700 lg:hidden"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <div className="flex flex-1 items-center justify-between px-4 sm:px-6 lg:px-8">
                        {/* Search */}
                        <div className="flex flex-1 max-w-2xl">
                            <div className="relative w-full">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search guests, tables, rooms..."
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>

                        {/* Right side */}
                        <div className="flex items-center space-x-4 ml-4">
                            {/* Quick actions */}
                            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md">
                                <Plus className="w-5 h-5" />
                            </button>

                            {/* Notifications */}
                            <button className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md">
                                <Bell className="w-5 h-5" />
                            </button>

                            {/* User avatar */}
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm">
                                    {currentUser?.name?.charAt(0) || 'U'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
