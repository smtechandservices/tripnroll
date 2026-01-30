'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getUserProfile } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Plane, Calendar, Users, LogOut } from 'lucide-react';
import './globals.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      if (pathname === '/login') {
        setIsAdmin(true); // Allow login page access
        setLoading(false);
        return;
      }
      try {
        const user = await getUserProfile();
        // Check for admin usertype OR superuser status
        if (user.profile?.usertype === 'admin' || user.is_superuser) {
          setIsAdmin(true);
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router, pathname]);

  if (loading) {
    return (
      <html lang="en">
        <body>
          <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Loading TripnRoll Admin...</div>
        </body>
      </html>
    );
  }

  if (!isAdmin && pathname !== '/login') {
    return (
      <html lang="en">
        <body></body>
      </html>
    );
  }

  if (pathname === '/login') return <html lang="en"><body>{children}</body></html>;

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Flights', href: '/flights', icon: Plane },
    { name: 'Bookings', href: '/bookings', icon: Calendar },
    { name: 'Users', href: '/users', icon: Users },
  ];

  return (
    <html lang="en">
      <head>
        <title>Trip N Roll Admin</title>
        <link rel="icon" href="/logo.png" />
      </head>
      <body>
        <div className="flex min-h-screen bg-slate-100">
          {/* Sidebar */}
          <aside className="w-64 bg-slate-900 text-white fixed h-full z-20">
            <div className="p-6 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Logo"
                width={48}
                height={48}
                priority
                unoptimized
                className="object-contain rounded-lg"
              />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-200 to-emerald-400">
                Trip N Roll
              </h1>
            </div>
            <nav className="mt-6 px-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-green-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  router.push('/login');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mt-8"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
