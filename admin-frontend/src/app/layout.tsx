import type { Metadata } from 'next';
import './globals.css';
import { AdminLayoutClient } from '@/components/AdminLayoutClient';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'Trip N Roll Admin',
  description: 'Trip N Roll Admin Dashboard for managing flights, bookings, users and more.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Trip N Roll Admin',
    description: 'Trip N Roll Admin Dashboard for managing flights, bookings, users and more.',
    images: ['/logo.png'],
    siteName: 'Trip N Roll Admin',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Trip N Roll Admin',
    description: 'Trip N Roll Admin Dashboard for managing flights, bookings, users and more.',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AdminLayoutClient>
          {children}
        </AdminLayoutClient>
      </body>
    </html>
  );
}
