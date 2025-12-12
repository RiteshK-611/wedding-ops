'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { User, Session, Provider } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type UserRole = 'planner' | 'couple' | 'hotel' | 'vendor';

interface UserProfile {
    id: string;
    email: string;
    role: UserRole;
    weddingId: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    session: Session | null;
    loading: boolean;
    isConfigured: boolean;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signInWithProvider: (provider: Provider) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    hasRole: (roles: UserRole[]) => boolean;
    refreshProfile: () => Promise<void>;
    isPlanner: boolean;
    isCouple: boolean;
    isHotel: boolean;
    isVendor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const isConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (!isConfigured) {
            setLoading(false);
            return;
        }

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);

            if (session?.user) {
                await fetchProfile(session.user.id);
            } else {
                setProfile(null);
            }

            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, [isConfigured]);

    async function fetchProfile(userId: string) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                // If user doesn't exist in public.users, try to create the profile
                if (error.code === 'PGRST116') {
                    console.log('User profile not found, attempting to create...');

                    // Try to ensure user profile exists via RPC
                    const { error: rpcError } = await supabase.rpc('ensure_user_profile');

                    if (rpcError) {
                        console.warn('Could not create profile via RPC:', rpcError);
                    }

                    // Wait and retry
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const { data: retryData, error: retryError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (retryError) {
                        console.warn('Profile still not found after creation attempt');
                        // Set a minimal profile based on auth user
                        setProfile({
                            id: userId,
                            email: user?.email || '',
                            role: 'planner' as UserRole,
                            weddingId: null,
                        });
                        return;
                    }

                    setProfile({
                        id: retryData.id,
                        email: retryData.email,
                        role: retryData.role as UserRole,
                        weddingId: retryData.wedding_id,
                    });
                    return;
                }
                throw error;
            }

            setProfile({
                id: data.id,
                email: data.email,
                role: data.role as UserRole,
                weddingId: data.wedding_id,
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            // Create a fallback profile so the app doesn't break
            setProfile({
                id: userId,
                email: user?.email || '',
                role: 'planner' as UserRole,
                weddingId: null,
            });
        } finally {
            setLoading(false);
        }
    }

    async function refreshProfile() {
        if (user) {
            await fetchProfile(user.id);
        }
    }

    async function signUp(email: string, password: string) {
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        return { error: error ? new Error(error.message) : null };
    }

    async function signIn(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { error: error ? new Error(error.message) : null };
    }

    async function signInWithProvider(provider: Provider) {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/`,
            },
        });
        return { error: error ? new Error(error.message) : null };
    }

    async function signOut() {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        setSession(null);
    }

    function hasRole(roles: UserRole[]) {
        return profile ? roles.includes(profile.role) : false;
    }

    const value: AuthContextType = {
        user,
        profile,
        session,
        loading,
        isConfigured,
        signUp,
        signIn,
        signInWithProvider,
        signOut,
        hasRole,
        refreshProfile,
        isPlanner: profile?.role === 'planner',
        isCouple: profile?.role === 'couple',
        isHotel: profile?.role === 'hotel',
        isVendor: profile?.role === 'vendor',
    } as AuthContextType;

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
