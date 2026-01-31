'use client';
import { Flight } from '@/lib/api';
import { Clock, Plane } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface FlightCardProps {
    flight: Flight;
}

export function FlightCard({ flight }: FlightCardProps) {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    const formatTime = (isoString: string) => {
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' });
    };

    const handleBookNow = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault();
            router.push('/login');
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                    <div className="h-12 w-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 font-bold text-xl">
                        {flight.airline[0]}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{flight.airline}</h3>
                        <p className="text-sm text-slate-500">{flight.flight_number}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-slate-600 px-2 md:px-6">
                    <div className="text-center">
                        <div className="font-bold text-xl text-slate-800">{formatTime(flight.departure_time)}</div>
                        <div className="uppercase tracking-wider text-xs font-semibold text-slate-700">{flight.origin}</div>
                        <div className="text-xs text-slate-400 mt-1">{formatDate(flight.departure_time)}</div>
                    </div>

                    <div className="flex flex-col items-center flex-1 px-4">
                        <div className="text-xs text-slate-400 mb-1">{flight.duration}</div>
                        <div className="w-full flex items-center space-x-2">
                            <div className="h-[2px] bg-slate-200 flex-1"></div>
                            <Plane className="h-4 w-4 text-green-500 transform rotate-90" />
                            <div className="h-[2px] bg-slate-200 flex-1"></div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">
                            <div className="flex flex-col items-center">
                                <span>{flight.stops === 0 && !flight.stop_details ? 'Non-stop' : `${flight.stops} Stop(s)`}</span>
                                {flight.stop_details && (
                                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                                        via {flight.stop_details}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="font-bold text-xl text-slate-800">{formatTime(flight.arrival_time)}</div>
                        <div className="uppercase tracking-wider text-xs font-semibold text-slate-700">{flight.destination}</div>
                        <div className="text-xs text-slate-400 mt-1">{formatDate(flight.arrival_time)}</div>
                    </div>
                </div>
            </div>

            <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 w-full md:w-48 flex flex-col items-center justify-center gap-3">
                <div className="text-2xl font-bold text-green-600">{`₹${parseFloat(flight.price).toLocaleString('en-IN')}`}</div>
                <Link
                    href={`/booking/${flight.id}`}
                    onClick={handleBookNow}
                    className="w-full bg-green-600 text-center text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                    Book Now
                </Link>
                {/* Seat Availability Badge */}
                {flight.available_seats !== undefined && flight.available_seats > 0 && (
                    <div className="px-6">
                        {flight.available_seats <= 10 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Only {flight.available_seats} seat{flight.available_seats !== 1 ? 's' : ''}!
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {flight.available_seats} seats
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div >
    );
}
