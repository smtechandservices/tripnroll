'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KYCModal } from '@/components/KYCModal';
import { EditProfileModal } from '@/components/EditProfileModal';

export function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Hide header and footer on auth pages
    const isAuthPage = pathname === '/login' || pathname === '/signup';

    return (
        <>
            {!isAuthPage && <Header />}
            <main>
                {children}
            </main>
            {!isAuthPage && <Footer />}
            <KYCModal />
            <EditProfileModal />
        </>
    );
}
