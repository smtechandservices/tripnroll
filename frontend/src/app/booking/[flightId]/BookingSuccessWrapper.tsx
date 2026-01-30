'use client';

import { BookingForm } from '@/components/BookingForm';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export function BookingSuccessWrapper({ flightId, departureDate, isInternational }: { flightId: number; departureDate: string; isInternational: boolean }) {
    const router = useRouter();

    return (
        <BookingForm
            flightId={flightId}
            departureDate={departureDate}
            isInternational={isInternational}
            onSuccess={(bookingId) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Booking Request Sent!',
                    html: `
                        <div class="space-y-3 font-sans">
                            <p class="text-lg">Your booking ID is <span class="font-mono font-bold text-slate-800">${bookingId}</span></p>
                            <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-100 text-yellow-800 text-sm">
                                <strong>Status: Pending Approval</strong><br/>
                                You will receive a confirmation <br/> once an admin approves your request.
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'View Bookings',
                    confirmButtonColor: '#16a34a', // green-600
                    allowOutsideClick: false
                }).then(() => {
                    router.push('/my-bookings');
                });
            }}
        />
    );
}
