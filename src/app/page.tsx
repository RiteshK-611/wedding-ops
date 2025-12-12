'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/store';
import { 
    Users, 
    Calendar, 
    Hotel, 
    Bus, 
    MessageSquare, 
    LayoutDashboard,
    ChevronRight,
    Sparkles
} from 'lucide-react';

const features = [
    {
        icon: Users,
        title: 'Guest Management',
        description: 'Track RSVPs, dietary requirements, and seating preferences for all your guests.',
    },
    {
        icon: Calendar,
        title: 'Event Planning',
        description: 'Organize your ceremony, reception, and all wedding events in one place.',
    },
    {
        icon: Hotel,
        title: 'Accommodations',
        description: 'Manage hotel room blocks and guest accommodation assignments.',
    },
    {
        icon: Bus,
        title: 'Transportation',
        description: 'Coordinate shuttles, routes, and transportation for your guests.',
    },
    {
        icon: MessageSquare,
        title: 'Communication',
        description: 'Send updates and reminders to your guests effortlessly.',
    },
    {
        icon: LayoutDashboard,
        title: 'Dashboard Overview',
        description: 'Get a complete view of your wedding planning progress at a glance.',
    },
];

export default function LandingPage() {
    const router = useRouter();
    const { user, profile, loading: authLoading } = useAuth();
    const currentWedding = useStore((state) => state.currentWedding);

    // Redirect authenticated users
    useEffect(() => {
        if (!authLoading && user && profile !== null) {
            if (profile.weddingId) {
                router.push('/dashboard');
            } else {
                if (currentWedding) {
                    useStore.getState().setCurrentWedding(null);
                }
                router.push('/onboarding');
            }
        }
    }, [authLoading, user, profile, currentWedding, router]);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            W
                        </div>
                        <span className="font-semibold text-slate-900">Wedding Ops</span>
                    </Link>
                    <div className="flex items-center space-x-4">
                        <Link 
                            href="/login" 
                            className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
                        >
                            Sign In
                        </Link>
                        <Link 
                            href="/login?signup=true" 
                            className="text-sm bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Get Started
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center space-x-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
                        <Sparkles className="w-4 h-4" />
                        <span>Simplify your wedding planning</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-slate-900 leading-tight mb-6">
                        Plan your perfect day,{' '}
                        <span className="text-primary-600">effortlessly</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Wedding Ops brings together guest management, event planning, 
                        accommodations, and transportation in one elegant platform.
                    </p>
                    <Link 
                        href="/login?signup=true" 
                        className="inline-flex items-center justify-center space-x-2 bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        <span>Start Planning</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-20 px-6 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-slate-900 mb-4">
                            Everything you need
                        </h2>
                        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                            From guest lists to transportation, manage every detail of your wedding in one place.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature) => {
                            const Icon = feature.icon;
                            return (
                                <div 
                                    key={feature.title} 
                                    className="bg-white p-6 rounded-xl border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
                                        <Icon className="w-6 h-6 text-primary-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-4">
                        Ready to start planning?
                    </h2>
                    <p className="text-lg text-slate-600 mb-8">
                        Join couples who trust Wedding Ops to organize their special day.
                    </p>
                    <Link 
                        href="/login?signup=true" 
                        className="inline-flex items-center space-x-2 bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                        <span>Create Your Free Account</span>
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-slate-200">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary-600 rounded flex items-center justify-center text-white font-bold text-xs">
                            W
                        </div>
                        <span className="text-sm text-slate-600">Wedding Ops</span>
                    </div>
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Wedding Ops. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
