'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getFlightById, Flight } from '@/lib/api';
import { BookingForm } from '@/components/BookingForm';
import { Plane, Clock, Calendar, Loader2 } from 'lucide-react';
import { BookingSuccessWrapper } from './BookingSuccessWrapper';
import { BackButton } from '@/components/BackButton';
import { isInternationalFlight } from '@/lib/flightUtils';


export default function BookingPage() {
    const { isAuthenticated, loading: authLoading } = useAuth() as any;
    const router = useRouter();
    const params = useParams();
    const flightId = params.flightId as string;

    const [flight, setFlight] = useState<Flight | null>(null);
    const [loading, setLoading] = useState(true);
    const [passengerCounts, setPassengerCounts] = useState({ adults: 1, infants: 0, infantPrice: 0 });

    const handlePassengersChange = useCallback((counts: { adults: number; infants: number; infantPrice: number }) => {
        setPassengerCounts(prev => {
            if (prev.adults === counts.adults && prev.infants === counts.infants && prev.infantPrice === counts.infantPrice) return prev;
            return counts;
        });
    }, []);

    useEffect(() => {
        // Redirect to login if not authenticated
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
            return;
        }

        // Fetch flight data if authenticated
        if (isAuthenticated && flightId) {
            const fetchFlight = async () => {
                try {
                    const flightData = await getFlightById(flightId);
                    if (flightData) {
                        setFlight(flightData);
                    } else {
                        setFlight(null);
                    }
                } catch (error) {
                    console.error('Error fetching flight:', error);
                    setFlight(null);
                } finally {
                    setLoading(false);
                }
            };
            fetchFlight();
        }
    }, [isAuthenticated, authLoading, flightId, router]);

    // Show loading state while checking authentication or fetching flight
    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="animate-spin text-green-600" size={40} />
            </div>
        );
    }

    // Don't render anything if not authenticated (will redirect)
    if (!isAuthenticated) {
        return null;
    }

    if (!flight) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <h1 className="text-2xl font-bold text-slate-800">Flight not found</h1>
            </div>
        );
    }

    // Check if flight is international
    const isInternational = isInternationalFlight(flight.origin, flight.destination);

    const unitPrice = parseFloat(flight.price);
    const infantPriceVal = parseFloat(flight.infant_price || '0');
    const totalPrice = (unitPrice * passengerCounts.adults) + (infantPriceVal * passengerCounts.infants);


    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-slate-900 py-10 text-center"></div>
            
            <div className="max-w-9xl px-4 md:px-12 mx-auto pt-14">

                <BackButton />
                <h1 className="text-3xl font-bold text-slate-800 mb-8">Complete Your Booking</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Flight Summary</h2>
                            <div className="space-y-8">
                                <div>
                                    <div className="text-xs text-slate-400 uppercase mb-1">Airline</div>
                                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                                        <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">
                                            {flight.airline[0]}
                                        </div>
                                        {flight.airline}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 uppercase mb-1">Route</div>
                                    <div className="font-semibold text-slate-700">{flight.origin} → {flight.destination}</div>
                                    <div className="text-xs mt-1 flex flex-col gap-0.5">
                                        <div>
                                            <span className="text-slate-500">{flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`}</span>
                                            {flight.stops > 0 && flight.stop_details && (
                                                <span className="text-slate-400 ml-1">via {flight.stop_details}</span>
                                            )}
                                        </div>
                                        {flight.stops > 0 && flight.layover_duration && (
                                            <div className="text-blue-500/80">Layover: {flight.layover_duration}</div>
                                        )}
                                        {flight.baggage_allowance && (
                                            <div className="text-slate-500 bg-slate-100 w-fit px-2 py-0.5 rounded-full border border-slate-200 mt-1">
                                                Baggage: {flight.baggage_allowance}
                                            </div>
                                        )}
                                    </div>
                                    {isInternational && (
                                        <div className="text-xs text-blue-600 mt-1 font-medium">International Flight</div>
                                    )}
                                </div>
                                <div>
                                    <div className="text-xs text-slate-400 uppercase mb-1">Schedule</div>
                                    <div className="font-semibold text-slate-700 flex items-center gap-2">
                                        <Clock size={14} className="text-green-600" />
                                        {new Date(flight.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        {flight.departure_terminal && (
                                            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                                                Dep: T{flight.departure_terminal}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-slate-600 ml-6">
                                        {new Date(flight.departure_time).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                                    </div>
                                    <div className="font-semibold text-slate-700 flex items-center gap-2 mt-2">
                                        <Clock size={14} className="text-blue-600" />
                                        {new Date(flight.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        {flight.arrival_terminal && (
                                            <span className="text-[10px] bg-slate-50 text-slate-600 px-2 py-0.5 rounded-full border border-slate-200">
                                                Arr: T{flight.arrival_terminal}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-1 ml-6">
                                        Duration: {flight.duration}
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="text-xs text-slate-400 uppercase">Total Price</div>
                                    <div className="text-2xl font-bold text-green-600">{`₹${totalPrice.toLocaleString('en-IN')}`}</div>
                                    <div className="mt-2 space-y-1">
                                        {passengerCounts.adults > 0 && (
                                            <div className="text-[10px] text-slate-500 font-medium flex justify-between">
                                                <span>Adults (₹{unitPrice.toLocaleString('en-IN')} x {passengerCounts.adults})</span>
                                                <span>₹{(unitPrice * passengerCounts.adults).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                        {passengerCounts.infants > 0 && (
                                            <div className="text-[10px] text-blue-500 font-bold flex justify-between">
                                                <span>Infants {infantPriceVal > 0 ? `(₹${infantPriceVal.toLocaleString('en-IN')} x ${passengerCounts.infants})` : `(FREE x ${passengerCounts.infants})`}</span>
                                                <span>₹{(infantPriceVal * passengerCounts.infants).toLocaleString('en-IN')}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 italic text-[14px] text-slate-400">
                                        Note: This booking is non-refundable and non-changeable.
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
                            <h2 className="text-xl font-bold text-slate-800 mb-6">Passenger Details</h2>
                            <BookingSuccessWrapper
                                flight={flight}
                                isInternational={isInternational}
                                onPassengersChange={handlePassengersChange}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

