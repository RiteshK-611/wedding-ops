'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { useAuth } from '@/contexts/AuthContext';
import type { User } from '@/types';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [signUpSuccess, setSignUpSuccess] = useState(false);
    const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

    const router = useRouter();
    const setCurrentUser = useStore((state) => state.setCurrentUser);
    const { signIn, signUp, isConfigured } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isConfigured) {
                // Use Supabase authentication
                const result = isSignUp
                    ? await signUp(email, password)
                    : await signIn(email, password);

                if (result.error) {
                    setError(result.error.message);
                    // If user exists, switch to sign-in mode
                    if ('userExists' in result && result.userExists) {
                        setIsSignUp(false);
                    }
                    setLoading(false);
                    return;
                }

                // If signing up, show success message and switch to sign in
                // If signing in, go to dashboard (it will redirect to onboarding if needed)
                if (isSignUp && 'needsEmailConfirmation' in result) {
                    setSignUpSuccess(true);
                    setNeedsEmailConfirmation(Boolean(result.needsEmailConfirmation));
                    setIsSignUp(false); // Switch to sign-in mode
                    setPassword(''); // Clear password for security
                    setLoading(false);
                } else {
                    window.location.href = '/';
                }
            } else {
                // Fallback to mock login
                const user: User = {
                    id: '1',
                    email,
                    name: email.split('@')[0],
                    role: 'admin',
                    permissions: [],
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                };

                setCurrentUser(user);
                window.location.href = '/';
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        W
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">Wedding Ops</h1>
                    <p className="text-slate-600 mt-2">
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    {signUpSuccess ? (
                        <div className="text-center py-4">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            {needsEmailConfirmation ? (
                                <>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Check your email</h3>
                                    <p className="text-slate-600 text-sm mb-4">
                                        We&apos;ve sent a confirmation link to <strong>{email}</strong>. 
                                        Please click the link to verify your account, then sign in.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Account created!</h3>
                                    <p className="text-slate-600 text-sm mb-4">
                                        Your account has been created successfully. Please sign in with your credentials.
                                    </p>
                                </>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setSignUpSuccess(false);
                                }}
                                className="text-primary-600 hover:underline font-medium text-sm"
                            >
                                Sign In Now
                            </button>
                        </div>
                    ) : (
                        <>
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                placeholder="••••••••"
                                required
                                minLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                                </>
                            ) : (
                                isSignUp ? 'Create Account' : 'Sign In'
                            )}
                        </button>
                    </form>

                    {isConfigured ? (
                        <p className="text-sm text-slate-600 text-center mt-4">
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                            <button
                                type="button"
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="text-primary-600 hover:underline font-medium"
                            >
                                {isSignUp ? 'Sign In' : 'Sign Up'}
                            </button>
                        </p>
                    ) : (
                        <p className="text-sm text-slate-600 text-center mt-4">
                            Demo mode: Enter any email and password to continue
                        </p>
                    )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
