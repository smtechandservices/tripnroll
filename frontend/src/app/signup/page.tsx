'use client';

import { useState } from 'react';
import { register } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function SignupPage() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const router = useRouter();

    const validatePhoneNumber = (phoneNumber: string): boolean => {
        if (!phoneNumber) return true; // Phone is optional

        // Remove all spaces and special characters except +
        const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

        // Check for valid Indian phone number formats:
        // +919876543210 (with country code)
        // 919876543210 (without + but with country code)
        // 9876543210 (10 digits only)
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

        return phoneRegex.test(cleaned);
    };

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        if (value && !validatePhoneNumber(value)) {
            setPhoneError('Please enter a valid Indian phone number (10 digits, starting with 6-9)');
        } else {
            setPhoneError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate phone number before submission
        if (phone && !validatePhoneNumber(phone)) {
            setError('Please enter a valid phone number');
            return;
        }

        try {
            await register(username, email, password, phone);
            router.push('/login');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center px-4 py-8">
            {/* Hero Background */}
            <div
                className="fixed inset-0 bg-cover bg-center bg-no-repeat"
                style={{ backgroundImage: 'url(/hero-search.png)' }}
            />
            <div className="fixed inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-green-900/70" />

            {/* Signup Card */}
            <div className="relative z-10 max-w-xl w-full">
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

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2 text-center">Create Account</h1>
                    <p className="text-slate-600 mb-8 text-center">Join TripnRoll for exclusive deals</p>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm font-medium mb-6">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="text-black w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                                placeholder="Choose a username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="text-black w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                                placeholder="your@email.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="text-black w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white"
                                    placeholder="Create a strong password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => handlePhoneChange(e.target.value)}
                                className={`text-black w-full px-4 py-3 rounded-xl border-2 ${phoneError
                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                        : 'border-slate-200 focus:border-green-500 focus:ring-green-200'
                                    } focus:ring-2 outline-none transition-all bg-white`}
                                placeholder="+91 9876543210"
                            />
                            {phoneError && (
                                <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                            )}
                            <p className="mt-1 text-xs text-slate-500">Optional. Format: 10 digits starting with 6-9</p>
                        </div>

                        <button
                            type="submit"
                            className="cursor-pointer w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3.5 rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transform hover:scale-[1.02] mt-6"
                        >
                            Sign Up
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-600 text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="text-green-600 font-bold hover:text-green-700 hover:underline transition-colors">
                            Log in
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
