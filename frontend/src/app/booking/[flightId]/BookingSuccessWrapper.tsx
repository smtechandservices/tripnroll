'use client';

import { BookingForm } from '@/components/BookingForm';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';
import { Flight } from '@/lib/api';

export function BookingSuccessWrapper({
    flight,
    isInternational,
    onPassengersChange
}: {
    flight: Flight;
    isInternational: boolean;
    onPassengersChange?: (counts: { adults: number; infants: number }) => void;
}) {
    const router = useRouter();

    return (
        <BookingForm
            flightId={flight.id}
            departureDate={flight.departure_time}
            isInternational={isInternational}
            onPassengersChange={onPassengersChange}
            onSuccess={(bookingId) => {
                Swal.fire({
                    icon: 'success',
                    title: 'Booking Confirmed!',
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

                            <div class="bg-green-50 p-4 rounded-xl border border-green-100 text-green-800 text-sm">
                                <div class="flex items-center gap-2">
                                    <div class="h-2 w-2 rounded-full bg-green-500"></div>
                                    <strong class="font-bold">Status: Confirmed</strong>
                                </div>
                                <p class="opacity-80 mt-1">Your flight has been successfully booked. You can view your ticket details in your history.</p>
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
