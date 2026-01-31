'use client';

import { BookingForm } from '@/components/BookingForm';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Flight } from '@/lib/api';

export function BookingSuccessWrapper({ flight, isInternational }: { flight: Flight; isInternational: boolean }) {
    const router = useRouter();

    return (
        <BookingForm
            flightId={flight.id}
            departureDate={flight.departure_time}
            isInternational={isInternational}
            onSuccess={(bookingId) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Booking Request Sent!',
                    html: `
                        <div class="space-y-4 font-sans text-left">
                            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <p class="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Booking Confirmation</p>
                                <p class="text-lg font-bold text-slate-800">ID: <span class="text-blue-600 font-mono">${bookingId}</span></p>
                            </div>
                            
                            <div class="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-4">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="text-sm font-bold text-slate-700">${flight.origin} → ${flight.destination}</span>
                                    <span class="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">${flight.airline}</span>
                                </div>
                                <div class="text-xs text-slate-500">
                                    ${flight.stops === 0 && !flight.stop_details ? 'Non-stop' : `<span class="font-bold text-slate-600">${flight.stops} Stop(s)</span> via ${flight.stop_details || 'N/A'}`}
                                </div>
                            </div>

                            <div class="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                    <strong class="font-bold">Status: Pending Approval</strong>
                                </div>
                                <p class="opacity-80">Our team will review your request and send a confirmation email shortly.</p>
                            </div>
                        </div>
                    `,
                    confirmButtonText: 'View My Bookings',
                    confirmButtonColor: '#16a34a', // green-600
                    allowOutsideClick: false,
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl px-8 py-3 font-bold'
                    }
                }).then(() => {
                    router.push('/my-bookings');
                });
            }}
        />
    );
}
