'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { login as loginApi, getUserProfile } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const { token } = await loginApi(username, password);
            localStorage.setItem('token', token);
            const userProfile = await getUserProfile();

            login(token, {
                id: userProfile.id,
                username: userProfile.username,
                email: userProfile.email,
                profile: userProfile.profile
            });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4">
            {/* Hero Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/hero-search.png)' }}
            />
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-green-900/70" />

            {/* Login Card */}
            <div className="relative z-10 max-w-md w-full">
                <div className="bg-white/95 backdrop-blur-lg p-8 md:p-10 rounded-3xl shadow-2xl border border-white/20">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="h-20 w-20 relative">
                            <Image
                                src="/logo.png"
                                alt="TripnRoll Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 text-center">Welcome Back</h1>
                    <p className="text-slate-600 mb-8 text-center">Sign in to manage your bookings</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="text-black w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="text-black w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                                placeholder="Enter your password"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="cursor-pointer w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transform hover:scale-[1.02]"
                        >
                            Sign In
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-600 text-sm">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors">
                            Sign up
                        </Link>
                    </p>
                </div>

                {/* Back to Home Link */}
                <div className="text-center mt-6">
                    <Link href="/" className="text-white/90 hover:text-white text-sm font-medium hover:underline transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
