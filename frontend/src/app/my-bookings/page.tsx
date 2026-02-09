'use client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { Booking, getBookingHistory, requestRefund } from '@/lib/api';
import Swal from 'sweetalert2';
import { Loader2, User as UserIcon, Mail, Phone, Calendar as CalendarIcon, FileText, RefreshCw, Wallet, CreditCard } from 'lucide-react';
import { RipplesBackground } from '@/components/RipplesBackground';

export default function MyBookingsPage() {
    const { user, isAuthenticated } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchBookings = async () => {
        try {
            const data = await getBookingHistory();
            setBookings(data);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        }
    };

    useEffect(() => {
        const initBookings = async () => {
            try {
                await fetchBookings();
            } catch (error) {
                setBookings([]);
            } finally {
                setLoading(false);
            }
        };

        if (isAuthenticated) {
            initBookings();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchBookings();
        // Artificial delay to show spinning animation
        await new Promise(resolve => setTimeout(resolve, 500));
        setIsRefreshing(false);
    };

    const handleRequestRefund = async (booking: Booking) => {
        const result = await Swal.fire({
            title: 'Request Refund?',
            text: `Are you sure you want to request a refund for this booking?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, request refund!'
        });

        if (result.isConfirmed) {
            try {
                await requestRefund(booking.booking_id);
                Swal.fire(
                    'Requested!',
                    'Your refund request has been submitted.',
                    'success'
                );
                fetchBookings(); // Refresh list
            } catch (error: any) {
                Swal.fire(
                    'Error!',
                    error.message || 'Failed to request refund.',
                    'error'
                );
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center pt-24">
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

    // Group bookings by booking_group (or booking_id if booking_group is missing)
    const groupedBookings = bookings.reduce((groups: { [key: string]: Booking[] }, booking) => {
        const key = booking.booking_group || booking.booking_id;
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(booking);
        return groups;
    }, {});

    const groupKeys = Object.keys(groupedBookings).sort((a, b) => {
        // Sort groups by the creation date of the first booking in each group (descending)
        const dateA = new Date(groupedBookings[a][0].created_at).getTime();
        const dateB = new Date(groupedBookings[b][0].created_at).getTime();
        return dateB - dateA;
    });

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
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
                <h2 className="text-xl font-bold text-slate-800 mb-6">{groupKeys.length} Booking Group{groupKeys.length !== 1 ? 's' : ''} Found</h2>

                {groupKeys.length > 0 ? (
                    groupKeys.map((groupKey, groupIndex) => {
                        const passengers = groupedBookings[groupKey];
                        const firstPassenger = passengers[0];
                        const isMulti = passengers.length > 1;

                        // Check if flight has expired (departure time has passed)
                        const isExpired = new Date(firstPassenger.flight_details.departure_time) < new Date();
                        const displayStatus = isExpired ? 'EXPIRED' : firstPassenger.status;

                        return (
                            <div
                                key={groupKey}
                                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12 animate-fade-in"
                                style={{ animationDelay: `${groupIndex * 0.15}s` }}
                            >
                                {/* Flight Ticket Card - Left (2/3 width) */}
                                <div className="lg:col-span-2">
                                    <div className={`border-y-2 rounded-2xl overflow-hidden ${isExpired ? 'border-slate-400 opacity-75' : 'border-slate-700'}`}>
                                        {/* Main Ticket Body */}
                                        <div className="relative">
                                            {/* Header with Airline and Status */}
                                            <div className={`${isExpired ? 'bg-gradient-to-r from-slate-500 to-slate-600' :
                                                firstPassenger.status === 'REFUNDED' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                    firstPassenger.status === 'CANCELLED' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                                                        firstPassenger.status === 'PENDING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                                                            'bg-gradient-to-r from-green-600 to-emerald-600'
                                                } text-white px-6 py-4 flex justify-between items-center`}>
                                                <div>
                                                    <div className="text-xs uppercase tracking-wider opacity-90">Flight Ticket</div>
                                                    <div className="text-2xl font-bold">{firstPassenger.flight_details.airline}</div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {isMulti && (
                                                        <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                                                            {passengers.length} Passengers
                                                        </div>
                                                    )}
                                                    <div className={`${isExpired ? 'bg-red-500/90' :
                                                        firstPassenger.status === 'PENDING' ? 'bg-yellow-700/30' :
                                                            'bg-white/20'
                                                        } backdrop-blur-sm px-4 py-2 rounded-full text-right`}>
                                                        <div className="font-bold">{displayStatus}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Flight Route Section */}
                                            <div className="px-2 pt-14 bg-gradient-to-b from-slate-50 to-white">
                                                <div className="grid grid-cols-3 gap-8 items-center">
                                                    {/* Origin */}
                                                    <div className="text-center">
                                                        <div className="text-4xl font-bold text-slate-800">{firstPassenger.flight_details.origin}</div>
                                                        <div className="text-sm text-slate-500 mt-1">Origin</div>
                                                        <div className="text-sm text-slate-400 mt-1">
                                                            {new Date(firstPassenger.flight_details.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </div>

                                                    {/* Flight Path */}
                                                    <div className="flex flex-col items-center">
                                                        <div className="text-md text-slate-500 mb-2">Flight {firstPassenger.flight_details.flight_number}</div>
                                                        <div className="w-full flex items-center justify-center">
                                                            <div className="h-px bg-slate-300 flex-1"></div>
                                                            <svg className="w-6 h-6 text-green-600 mx-2" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                                                            </svg>
                                                            <div className="h-px bg-slate-300 flex-1"></div>
                                                        </div>
                                                        <div className="flex flex-col items-center mt-2">
                                                            <div className="text-md text-slate-500">{firstPassenger.flight_details.duration}</div>
                                                            <div className="text-xs mt-1">
                                                                <span className="text-slate-400 font-medium">
                                                                    {firstPassenger.flight_details.stops === 0 && !firstPassenger.flight_details.stop_details ? 'Non-stop' : `${firstPassenger.flight_details.stops} Stop(s)`}
                                                                </span>
                                                                {firstPassenger.flight_details.stop_details && (
                                                                    <span className="text-slate-400 ml-1">via {firstPassenger.flight_details.stop_details}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Destination */}
                                                    <div className="text-center">
                                                        <div className="text-4xl font-bold text-slate-800">{firstPassenger.flight_details.destination}</div>
                                                        <div className="text-sm text-slate-500 mt-1">Destination</div>
                                                        <div className="text-sm text-slate-400 mt-1">
                                                            {new Date(firstPassenger.flight_details.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Travel Date</div>
                                                        <div className="font-semibold text-slate-800">
                                                            {new Date(firstPassenger.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Price per Person</div>
                                                        <div className="font-bold text-slate-800">₹{parseFloat(firstPassenger.flight_details.price).toLocaleString('en-IN')}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Payment Method</div>
                                                        <div className="font-bold text-slate-800 flex items-center justify-center gap-1.5">
                                                            {firstPassenger.payment_mode === 'WALLET' ? (
                                                                <>
                                                                    <Wallet size={14} className="text-blue-500" />
                                                                    <span>Wallet</span>
                                                                </>
                                                            ) : firstPassenger.payment_mode === 'DIRECT' ? (
                                                                <>
                                                                    <CreditCard size={14} className="text-purple-500" />
                                                                    <span>Direct</span>
                                                                </>
                                                            ) : (
                                                                <span className="text-slate-400 text-xs">Wallet</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Group Ref</div>
                                                        <div className="font-mono font-bold text-blue-600">{groupKey}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Refund Action */}
                                            {!isExpired && firstPassenger.status === 'CONFIRMED' && (
                                                <div className="border-t border-slate-100 p-4">
                                                    <button
                                                        onClick={() => handleRequestRefund(firstPassenger)}
                                                        className="cursor-pointer text-sm text-red-500 hover:text-red-700 font-medium underline decoration-red-200 hover:decoration-red-500 underline-offset-4 transition-all"
                                                    >
                                                        Request Refund
                                                    </button>
                                                </div>
                                            )}
                                            {!isExpired && firstPassenger.status === 'REFUND_REQUESTED' && (
                                                <div className="border-t border-slate-100 p-4">
                                                    <span className="text-sm text-orange-500 font-medium">
                                                        Refund Requested
                                                    </span>
                                                </div>
                                            )}
                                            {firstPassenger.status === 'REFUNDED' && (
                                                <div className="border-t border-slate-100 p-4">
                                                    <span className="text-sm text-slate-500 font-medium">
                                                        Refunded to Wallet
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Passenger Details Card - Right (1/3 width) */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white rounded-2xl overflow-hidden border-y-2 border-slate-700 h-full shadow-sm">
                                        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4">
                                            <div className="text-xs uppercase tracking-wider opacity-90">Passenger List</div>
                                            <div className="text-lg font-bold mt-1">{passengers.length} Passenger{passengers.length !== 1 ? 's' : ''}</div>
                                        </div>

                                        <div className="p-0 max-h-[500px] overflow-y-auto">
                                            {passengers.map((passenger, pIdx) => (
                                                <div key={passenger.booking_id} className={`p-6 ${pIdx !== passengers.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="font-bold text-slate-800 text-lg leading-tight">
                                                                {passenger.first_name} {passenger.last_name}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap gap-2">
                                                                <div className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-500 inline-block">
                                                                    ID: {passenger.booking_id}
                                                                </div>
                                                                {passenger.pnr ? (
                                                                    <div className="text-[10px] font-mono bg-green-100 px-2 py-0.5 rounded text-green-700 font-bold border border-green-200 inline-block">
                                                                        PNR: {passenger.pnr}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="text-[10px] bg-yellow-50 px-2 py-0.5 rounded text-yellow-700 border border-yellow-200 border-dashed">
                                                                            PNR: Will be generated soon
                                                                        </div>
                                                                        <button
                                                                            onClick={handleRefresh}
                                                                            className={`cursor-pointer p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-blue-600 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`}
                                                                            title="Refresh PNR"
                                                                        >
                                                                            <RefreshCw size={12} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                                            <Mail size={14} className="text-slate-400" />
                                                            <span className="truncate">{passenger.passenger_email}</span>
                                                        </div>
                                                        {passenger.passenger_phone && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <Phone size={14} className="text-slate-400" />
                                                                <span>{passenger.passenger_phone}</span>
                                                            </div>
                                                        )}
                                                        {passenger.date_of_birth && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <CalendarIcon size={14} className="text-slate-400" />
                                                                <span>DOB: {new Date(passenger.date_of_birth).toLocaleDateString()}</span>
                                                            </div>
                                                        )}
                                                        {passenger.passport_number && (
                                                            <div className="flex items-center gap-2 text-sm text-slate-600">
                                                                <FileText size={14} className="text-slate-400" />
                                                                <span>Passport: <span className="font-mono">{passenger.passport_number}</span></span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="p-4 bg-slate-50 border-t border-slate-100">
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Booked On</div>
                                            <div className="text-xs text-slate-600">
                                                {new Date(firstPassenger.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm">
                        <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CalendarIcon size={32} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-lg font-medium">No bookings found.</p>
                        <p className="text-slate-400 text-sm mt-2 max-w-xs mx-auto">You haven't made any bookings yet. Start your journey today!</p>
                        <a
                            href="/search"
                            className="inline-block mt-8 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                        >
                            Explore Flights
                        </a>
                    </div>
                )}
            </div>
        </div >
    );
}
