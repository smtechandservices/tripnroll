'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, LogOut, User, Wallet, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';
import { EditProfileModal } from '@/components/EditProfileModal';

export function Header() {
    const { user, logout, isAuthenticated, refreshUser } = useAuth();
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Poll for wallet updates every 10 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            refreshUser().catch(err => console.error("Wallet poll failed", err));
        }, 10000);

        return () => clearInterval(interval);
    }, [isAuthenticated, refreshUser]);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/40 backdrop-blur-md border-b border-white/20' : 'bg-black/20'}`}>
            <div className="mx-auto px-12 h-20 flex items-center justify-between">
                <Link href="/" className="flex items-center space-x-3 font-semibold" style={{ fontFamily: "sans-serif" }}>
                    <Image src="/logo.png" alt="Trip N Roll Logo" width={40} height={40} className="object-contain" />
                    <span className={`bg-gradient-to-r ${isScrolled ? 'from-green-200 to-yellow-200' : 'from-green-500 to-yellow-500'} text-transparent text-3xl bg-clip-text`}>
                        Trip N Roll
                    </span>
                </Link>

                <nav className="hidden md:flex items-center space-x-8">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/search">Flights</NavLink>
                    {isAuthenticated && <NavLink href="/my-bookings">Bookings</NavLink>}
                    {isAuthenticated && <NavLink href="/wallet">Wallet</NavLink>}
                    <NavLink href="/about">About</NavLink>
                    <NavLink href="/contact">Contact</NavLink>
                </nav>

                <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                                    className={`cursor-pointer text-white font-medium flex items-center gap-2 hover:text-green-200 transition-colors ${isProfileOpen ? 'text-green-200' : ''}`}
                                >
                                    <User size={18} />
                                    {user?.username}
                                    {user?.profile?.kyc_status === 'VERIFIED' ? (
                                        <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 text-[10px] font-bold">
                                            <ShieldCheck size={10} />
                                        </div>
                                    ) : user?.profile?.kyc_status === 'SUBMITTED' ? (
                                        <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30 text-[10px] font-bold">
                                            <Shield size={10} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 text-[10px] font-bold">
                                            <ShieldAlert size={10} />
                                        </div>
                                    )}
                                </button>
                                <EditProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
                            </div>
                            {user?.profile?.wallet_balance !== undefined && (
                                <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-emerald-500 hover:bg-emerald-500/20 transition-all duration-300 group cursor-default">
                                    <Wallet size={16} className="text-white group-hover:scale-110 transition-transform" />
                                    <span className="text-white font-semibold text-sm">
                                        ₹{Number(user.profile.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={logout}
                                className="cursor-pointer bg-white/10 hover:bg-white/20 text-white p-2 border border-emerald-500 rounded-full transition-colors"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4">
                            <Link href="/login" className="text-white hover:text-green-300 font-medium transition-colors">
                                Login
                            </Link>
                            <Link href="/signup" className="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-full font-bold transition-colors shadow-lg shadow-green-600/20">
                                Create an account
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`relative text-gray-200 hover:text-white px-4 py-2 rounded-full transition-all duration-300 text-xl font-medium group ${isActive ? 'text-white' : ''}`}
        >
            {children}
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 rounded-full ${isActive ? 'w-2/3' : 'group-hover:w-1/3'}`} />
        </Link>
    );
}
