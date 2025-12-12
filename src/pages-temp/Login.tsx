import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useAuth } from '../contexts/AuthContext';
import type { User } from '../types';
import { Loader2 } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const setCurrentUser = useStore((state) => state.setCurrentUser);
    const { signIn, signUp, isConfigured } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (isConfigured) {
            // Use Supabase authentication
            const result = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (result.error) {
                setError(result.error.message);
                setLoading(false);
                return;
            }

            // Supabase auth successful
            navigate('/onboarding');
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
            navigate('/onboarding');
        }

        setLoading(false);
    };

    return (
        <div className="card">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {isSignUp ? 'Create Account' : 'Sign In'}
            </h2>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        placeholder="you@example.com"
                        required
                    />
                </div>
                <div>
                    <label className="label">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="input"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary w-full flex items-center justify-center"
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
        </div>
    );
}
