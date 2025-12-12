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
    signUp: (email: string, password: string) => Promise<{ error: Error | null; needsEmailConfirmation?: boolean; userExists?: boolean }>;
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
        console.log('[Auth] Starting auth initialization, isConfigured:', isConfigured);
        
        if (!isConfigured) {
            console.log('[Auth] Supabase not configured, setting loading false');
            setLoading(false);
            return;
        }

        // Handle confirmation/magic-link redirects that include tokens in the URL hash
        // Example: https://app/login#access_token=...&refresh_token=...
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');
            
            if (accessToken && refreshToken) {
                console.log('[Auth] Found tokens in hash, setting session...');
                // Clean up the hash immediately to prevent reprocessing
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
                
                // Set session from hash tokens
                supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
                    .then(({ data, error }) => {
                        if (error) {
                            console.warn('[Auth] Failed to set session from hash:', error);
                            setLoading(false);
                        } else {
                            console.log('[Auth] Session set from hash, user:', data.session?.user?.email);
                            // Don't reload, let the normal flow continue
                            setSession(data.session);
                            setUser(data.session?.user ?? null);
                            if (data.session?.user) {
                                fetchProfile(data.session.user.id);
                            } else {
                                setLoading(false);
                            }
                        }
                    });
                return; // Don't proceed with normal getSession while processing hash
            }
        }

        // Get initial session
        console.log('[Auth] Getting initial session...');
        supabase.auth.getSession().then(({ data: { session } }) => {
            console.log('[Auth] Got session:', session?.user?.email ?? 'no session');
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
            console.log('[Auth] Auth state changed:', _event, session?.user?.email);
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
        console.log('[Auth] Fetching profile for user:', userId);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.log('[Auth] Profile fetch error:', error.code, error.message);
                // If user doesn't exist in public.users, try to create the profile
                if (error.code === 'PGRST116') {
                    console.log('[Auth] User profile not found, attempting to create...');

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
            console.log('[Auth] Profile loaded:', { id: data.id, weddingId: data.wedding_id });
        } catch (error) {
            console.error('[Auth] Error fetching profile:', error);
            // Create a fallback profile so the app doesn't break
            setProfile({
                id: userId,
                email: user?.email || '',
                role: 'planner' as UserRole,
                weddingId: null,
            });
            console.log('[Auth] Using fallback profile');
        } finally {
            console.log('[Auth] Setting loading to false');
            setLoading(false);
        }
    }

    async function refreshProfile() {
        if (user) {
            await fetchProfile(user.id);
        }
    }

    async function signUp(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/login`,
            },
        });
        
        // Check if user already exists (Supabase returns user with empty identities)
        const userExists = data?.user && data.user.identities?.length === 0;
        if (userExists) {
            return { 
                error: new Error('An account with this email already exists. Please sign in.'),
                userExists: true
            };
        }
        
        // If session exists, email confirmation is disabled and user is logged in
        // If no session, user needs to confirm their email
        const needsEmailConfirmation = !data?.session;
        return { 
            error: error ? new Error(error.message) : null,
            needsEmailConfirmation
        };
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
