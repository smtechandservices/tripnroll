'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plane, LogOut, User, Wallet, ShieldCheck, ShieldAlert, Shield, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useState, useEffect } from 'react';

export function Header() {
    const { user, logout, isAuthenticated, refreshUser } = useAuth();
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Poll for wallet updates every 10 seconds
    useEffect(() => {
        if (!isAuthenticated) return;

        const interval = setInterval(() => {
            refreshUser().catch(err => console.error("Wallet poll failed", err));
        }, 10000);

        return () => clearInterval(interval);
    }, [isAuthenticated, refreshUser]);

    return (
        <header className={`${isMenuOpen ? 'fixed inset-0 z-[1000] bg-slate-950 flex flex-col' : 'fixed top-0 inset-x-0 z-50 bg-black/60 lg:bg-black/20'} transition-all duration-300 ${isScrolled ? 'bg-black/80 lg:bg-black/40 backdrop-blur-md border-b border-white/20' : ''}`}>
            <div className="mx-auto px-4 md:px-12 h-20 flex items-center justify-between shrink-0">
                <Link href="/" className="flex items-center space-x-2 md:space-x-3 font-semibold shrink-0" style={{ fontFamily: "sans-serif" }}>
                    <Image src="/logo.png" alt="Trip N Roll Logo" width={32} height={32} className="object-contain md:w-10 md:h-10" />
                    <span className={`bg-gradient-to-r ${isScrolled ? 'from-green-200 to-yellow-200' : 'from-green-500 to-yellow-500'} text-transparent text-xl md:text-3xl bg-clip-text whitespace-nowrap`}>
                        Trip N Roll
                    </span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden lg:flex items-center space-x-6">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/search">Flights</NavLink>
                    {isAuthenticated && <NavLink href="/my-bookings">Bookings</NavLink>}
                    {isAuthenticated && <NavLink href="/wallet">Wallet</NavLink>}
                    <NavLink href="/about">About</NavLink>
                    <NavLink href="/contact">Contact</NavLink>
                </nav>

                {/* Desktop Auth Section */}
                <div className="hidden lg:flex items-center space-x-4">
                    {isAuthenticated ? (
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <button
                                    onClick={() => window.dispatchEvent(new CustomEvent('open-edit-profile-modal'))}
                                    className="cursor-pointer text-white font-medium flex items-center gap-2 hover:text-green-200 transition-colors"
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
                            </div>
                            {user?.profile?.wallet_balance !== undefined && (
                                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-emerald-500 hover:bg-emerald-500/20 transition-all duration-300 group cursor-default">
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

                {/* Mobile Menu Toggle */}
                <button
                    className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors relative z-[110]"
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Menu Content (Only visible when open) */}
            {isMenuOpen && (
                <>
                <div className="flex-1 overflow-y-auto px-6 py-8 flex flex-col space-y-8 animate-fade-in pb-12">
                    {/* User Info on Mobile */}
                    {isAuthenticated ? (
                        <div className="flex flex-col space-y-6">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                    <User size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-lg truncate">{user?.username}</p>
                                    <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                                </div>
                                <button onClick={logout} className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-colors">
                                    <LogOut size={20} />
                                </button>
                            </div>

                            {/* Mobile Profile Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        window.dispatchEvent(new CustomEvent('open-edit-profile-modal'));
                                    }}
                                    className="flex items-center justify-center gap-2 p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all font-bold text-sm"
                                >
                                    <User size={18} className="text-emerald-400" />
                                    Edit Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        window.dispatchEvent(new CustomEvent('open-kyc-modal'));
                                    }}
                                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all font-bold text-sm ${user?.profile?.kyc_status === 'VERIFIED'
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                        : user?.profile?.kyc_status === 'SUBMITTED'
                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                                        }`}
                                >
                                    {user?.profile?.kyc_status === 'VERIFIED' ? <ShieldCheck size={18} /> :
                                        user?.profile?.kyc_status === 'SUBMITTED' ? <Shield size={18} /> :
                                            <ShieldAlert size={18} />}
                                    {user?.profile?.kyc_status === 'VERIFIED' ? 'Verified' :
                                        user?.profile?.kyc_status === 'SUBMITTED' ? 'Reviewing' : 'Verify KYC'}
                                </button>
                            </div>

                            {user?.profile?.wallet_balance !== undefined && (
                                <div className="flex items-center justify-between p-5 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-green-600/10 border border-emerald-500/30">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                            <Wallet size={20} className="text-emerald-400" />
                                        </div>
                                        <span className="text-gray-300">Wallet Balance</span>
                                    </div>
                                    <span className="text-white font-bold text-xl">
                                        ₹{Number(user.profile.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                </div>
                            )}
                        </div>
                    ) : (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-center text-white text-2xl font-bold mb-2">Welcome to Trip N Roll</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Link
                                        href="/login"
                                        className="py-4 text-center text-white font-bold bg-white/5 rounded-2xl border border-white/10"
                                    >
                                        Login
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="py-4 text-center text-white font-bold bg-green-600 rounded-2xl shadow-lg shadow-green-600/20"
                                    >
                                        Join Now
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Mobile Links */}
                        <div className="flex flex-col space-y-4">
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest pl-2">Navigation</p>
                            <MobileNavLink href="/">Home</MobileNavLink>
                            <MobileNavLink href="/search">Flights</MobileNavLink>
                            {isAuthenticated && <MobileNavLink href="/my-bookings">My Bookings</MobileNavLink>}
                            {isAuthenticated && <MobileNavLink href="/wallet">Wallet</MobileNavLink>}
                            <MobileNavLink href="/about">About Us</MobileNavLink>
                            <MobileNavLink href="/contact">Support</MobileNavLink>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-white/10 text-center">
                        <p className="text-gray-500 text-sm">© 2026 Trip N Roll Travel</p>
                    </div>
                </>
            )}
        </header>
    );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`relative text-gray-200 hover:text-white px-2 py-2 transition-all duration-300 text-lg font-medium group ${isActive ? 'text-white' : ''}`}
        >
            {children}
            <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-green-500 transition-all duration-300 rounded-full ${isActive ? 'w-2/3' : 'group-hover:w-1/3'}`} />
        </Link>
    );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    const pathname = usePathname();
    const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

    return (
        <Link
            href={href}
            className={`flex items-center px-6 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 ${isActive
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-gray-300 hover:bg-white/5'
                }`}
        >
            {children}
        </Link>
    );
}
