import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "react-datepicker/dist/react-datepicker.css";
import { AuthProvider } from "@/context/AuthContext";
import { LayoutContent } from "@/components/LayoutContent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Trip N Roll Travel",
  description: "Experience the journey like never before with TripNRoll. Book flights to destinations worldwide with ease.",
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: "Trip N Roll Travel",
    description: "Experience the journey like never before with TripNRoll. Book flights to destinations worldwide with ease.",
    images: ['/logo.png'],
    siteName: 'TripNRoll',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: "Trip N Roll Travel",
    description: "Experience the journey like never before with TripNRoll.",
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
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-50`}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}
