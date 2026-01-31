'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Booking, getBookingHistory } from '@/lib/api';
import { FlightCard } from '@/components/FlightCard';
import { Loader2 } from 'lucide-react';
import { RipplesBackground } from '@/components/RipplesBackground';

export default function MyBookingsPage() {
    const { user, isAuthenticated } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            if (user?.email) {
                try {
                    const data = await getBookingHistory(user.email);
                    setBookings(data);
                } catch (error) {
                    console.error('Error fetching bookings:', error);
                    setBookings([]);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [user]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">My Bookings</h1>
                    <p className="text-slate-600">Please log in to view your bookings.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
                <Loader2 className="animate-spin text-green-600" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section with WebGL Ripples */}
            <div className="pt-20 relative min-h-[30vh] flex items-center overflow-hidden">
                <RipplesBackground imageUrl="/hero-booking.png">
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-black/10"></div>

                    {/* Content */}
                    <div className="relative max-w-9xl px-10 mx-auto w-full pt-42">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">My Bookings</h1>
                        <p className="text-slate-200 text-lg">Showing bookings for {user?.email}</p>
                    </div>
                </RipplesBackground>
            </div>

            {/* Main Content */}
            <div className="max-w-9xl px-10 mx-auto py-8">
                <h2 className="text-xl font-bold text-slate-800 mb-6">{bookings.length} Booking{bookings.length !== 1 ? 's' : ''} Found</h2>

                {bookings.length > 0 ? (
                    bookings.map((booking, index) => {
                        // Check if flight has expired (departure time has passed)
                        const isExpired = new Date(booking.flight_details.departure_time) < new Date();
                        const displayStatus = isExpired ? 'EXPIRED' : booking.status;

                        return (
                            <div
                                key={booking.booking_id}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 animate-fade-in"
                                style={{ animationDelay: `${index * 0.15}s` }}
                            >
                                {/* Flight Ticket Card - Left (2/3 width) */}
                                <div className="lg:col-span-2">
                                    <div className={`border-y-2 rounded-2xl overflow-hidden ${isExpired ? 'border-slate-400 opacity-75' : 'border-slate-700'}`}>
                                        {/* Main Ticket Body */}
                                        <div className="relative">
                                            {/* Header with Airline and Status */}
                                            <div className={`${isExpired ? 'bg-gradient-to-r from-slate-500 to-slate-600' :
                                                booking.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                    booking.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                        'bg-gradient-to-r from-green-600 to-emerald-600'
                                                } text-white px-6 py-4 flex justify-between items-center`}>
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider opacity-90">Flight Ticket</div>
                                                    <div className="text-2xl font-bold">{booking.flight_details.airline}</div>
                                                </div>
                                                <div className={`${isExpired ? 'bg-red-500/90' :
                                                    booking.status === 'PENDING' ? 'bg-yellow-700/30' :
                                                        'bg-white/20'
                                                    } backdrop-blur-sm px-4 py-2 rounded-lg`}>
                                                    <div className="text-xs opacity-90">Status</div>
                                                    <div className="font-bold">{displayStatus}</div>
                                                </div>
                                            </div>

                                            {/* Flight Route Section */}
                                            <div className="px-2 pt-14 bg-gradient-to-b from-slate-50 to-white">
                                                <div className="grid grid-cols-3 gap-8 items-center">
                                                    {/* Origin */}
                                                    <div className="text-center">
                                                        <div className="text-4xl font-bold text-slate-800">{booking.flight_details.origin}</div>
                                                        <div className="text-sm text-slate-500 mt-1">Origin</div>
                                                        <div className="text-sm text-slate-400 mt-1">
                                                            {new Date(booking.flight_details.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {/* Flight Path */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-md text-slate-500 mb-2">Flight {booking.flight_details.flight_number}</div>
                                                        <div className="w-full flex items-center justify-center">
                                                            <div className="h-px bg-slate-300 flex-1"></div>
                                                            <svg className="w-6 h-6 text-green-600 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                            </svg>
                                                            <div className="h-px bg-slate-300 flex-1"></div>
                                                        </div>
                                                        <div className="flex flex-col items-center mt-2">
                                                            <div className="text-md text-slate-500">{booking.flight_details.duration}</div>
                                                            <div className="text-xs mt-1">
                                                                <span className="text-slate-400 font-medium">
                                                                    {booking.flight_details.stops === 0 && !booking.flight_details.stop_details ? 'Non-stop' : `${booking.flight_details.stops} Stop(s)`}
                                                                </span>
                                                                {booking.flight_details.stop_details && (
                                                                    <span className="text-slate-400 ml-1">via {booking.flight_details.stop_details}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Destination */}
                                                    <div className="text-center">
                                                        <div className="text-4xl font-bold text-slate-800">{booking.flight_details.destination}</div>
                                                        <div className="text-sm text-slate-500 mt-1">Destination</div>
                                                        <div className="text-sm text-slate-400 mt-1">
                                                            {new Date(booking.flight_details.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Perforated Divider */}
                                            <div className="relative h-24 bg-white">
                                                <div className="absolute inset-0 flex items-center">
                                                    <div className="w-full border-t-2 border-dashed border-slate-300"></div>
                                                </div>
                                                <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-slate-50 rounded-full border-2 border-slate-200"></div>
                                                <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-8 h-12 bg-slate-50 rounded-full border-2 border-slate-200"></div>
                                            </div>

                                            {/* Flight Info Section */}
                                            <div className="px-6 pt-4 pb-12 bg-white text-center">
                                                <div className="grid grid-cols-3 gap-4">
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Travel Date</div>
                                                        <div className="font-semibold text-slate-800">
                                                            {new Date(booking.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Price</div>
                                                        <div className="font-bold text-slate-800">₹{booking.flight_details.price}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Booking Ref</div>
                                                        <div className="font-mono font-bold text-green-600">{booking.booking_id}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Passenger Details Card - Right (1/3 width) */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-2xl overflow-hidden border-y-2 border-slate-700 h-full">
                                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                                            <div className="text-xs uppercase tracking-wider opacity-90">Passenger Details</div>
                                            <div className="text-lg font-bold mt-1">Booking Info</div>
                                        </div>

                                        <div className="p-6">
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                {/* Left Column: Basic Info */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Name</div>
                                                        <div className="font-bold text-slate-800 text-lg leading-tight">{booking.first_name} {booking.last_name}</div>
                                                    </div>

                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Email</div>
                                                        <div className="text-sm text-slate-700 break-all">{booking.passenger_email}</div>
                                                    </div>

                                                    {booking.passenger_phone && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Phone</div>
                                                            <div className="text-sm text-slate-700">{booking.passenger_phone}</div>
                                                        </div>
                                                    )}

                                                    {booking.date_of_birth && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Date of Birth</div>
                                                            <div className="text-sm text-slate-700">
                                                                {new Date(booking.date_of_birth).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right Column: Travel Docs */}
                                                <div className="space-y-4 border-l border-slate-100 pl-4">
                                                    {booking.passport_number ? (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Passport</div>
                                                            <div className="font-mono text-sm text-slate-700">{booking.passport_number}</div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-xs text-slate-400 italic">No passport details</div>
                                                    )}

                                                    {booking.frequent_flyer_number && (
                                                        <div>
                                                            <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Frequent Flyer</div>
                                                            <div className="font-mono text-sm text-slate-700">{booking.frequent_flyer_number}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200">
                                                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Booked On</div>
                                                <div className="text-sm text-slate-700">
                                                    {new Date(booking.created_at).toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
                        <p className="text-slate-500 text-lg">No bookings found.</p>
                        <p className="text-slate-400 text-sm mt-2">Start exploring flights to make your first booking!</p>
                        <a
                            href="/search"
                            className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                        >
                            Search Flights
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
