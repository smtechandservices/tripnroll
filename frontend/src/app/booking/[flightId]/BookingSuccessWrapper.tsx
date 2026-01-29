'use client';

import { BookingForm } from '@/components/BookingForm';
import { useRouter } from 'next/navigation';

export function BookingSuccessWrapper({ flightId, departureDate, isInternational }: { flightId: number; departureDate: string; isInternational: boolean }) {
    const router = useRouter();

    return (
        <BookingForm
            flightId={flightId}
            departureDate={departureDate}
            isInternational={isInternational}
            onSuccess={(bookingId) => {
                alert(`Booking Confirmed! ID: ${bookingId}`);
                router.push('/');
            }}
        />
    );
}
