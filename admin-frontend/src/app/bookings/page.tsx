'use client';

import { useEffect, useState } from 'react';
import { getAdminBookings, updateBookingStatus, Booking } from '@/lib/api';
import { Check, X, Search } from 'lucide-react';
// import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    // const router = useRouter();

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            const data = await getAdminBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings', error);
            // router.push('/login');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        // Optional: Add confirmation for status changes
        const action = newStatus === 'CONFIRMED' ? 'approve' : 'reject/cancel';
        const result = await Swal.fire({
            title: `Are you sure you want to ${action} this booking?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Yes, ${action} it!`,
            confirmButtonColor: newStatus === 'CONFIRMED' ? '#16a34a' : '#dc2626'
        });

        if (result.isConfirmed) {
            try {
                await updateBookingStatus(id, newStatus);
                fetchBookings(); // Refresh list
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: 'Failed to update booking status.',
                });
            }
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.booking_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.passenger_email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Loading bookings...</div>;

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Booking Management</h2>
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search bookings..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500">Booking ID</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Passenger</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Flight</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Origin</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Destination</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Travel Date</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Status</th>
                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredBookings.map((booking) => (
                            <tr key={booking.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-mono text-slate-600">{booking.booking_id}</td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => setSelectedBooking(booking)}
                                        className="text-left group w-full"
                                    >
                                        <div className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors cursor-pointer">
                                            {booking.first_name} {booking.last_name}
                                        </div>
                                        <div className="text-slate-500 text-xs cursor-pointer">{booking.passenger_email}</div>
                                    </button>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900">{booking.flight_details.airline}</div>
                                    <div className="text-slate-500 text-xs">{booking.flight_details.flight_number}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {booking.flight_details.origin}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {booking.flight_details.destination}
                                </td>
                                <td className="px-6 py-4 text-slate-600">
                                    {new Date(booking.travel_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {booking.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.booking_id, 'CONFIRMED')}
                                                    className="p-1 rounded text-green-600 hover:bg-green-50"
                                                    title="Approve"
                                                >
                                                    <Check className="cursor-pointer w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(booking.booking_id, 'CANCELLED')}
                                                    className="p-1 rounded text-red-600 hover:bg-red-50"
                                                    title="Reject"
                                                >
                                                    <X className="cursor-pointer w-5 h-5" />
                                                </button>
                                            </>
                                        )}
                                        {booking.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => handleStatusUpdate(booking.booking_id, 'CANCELLED')}
                                                className="p-1 rounded text-red-600 hover:bg-red-50"
                                                title="Cancel"
                                            >
                                                <X className="cursor-pointer w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Passenger Details Modal */}
            {selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 sticky top-0 backdrop-blur-md z-10">
                            <h3 className="text-xl font-bold text-slate-800">
                                Passenger Details
                            </h3>
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="cursor-pointer w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl uppercase">
                                    {selectedBooking.first_name[0]}{selectedBooking.last_name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">
                                        {selectedBooking.first_name} {selectedBooking.last_name}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${selectedBooking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                            selectedBooking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {selectedBooking.status}
                                        </span>
                                        <span className="text-slate-400 text-xs">•</span>
                                        <p className="text-slate-500 text-xs font-mono">
                                            ID: {selectedBooking.booking_id}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-6 px-2">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Email Address</label>
                                    <div className="text-slate-900 font-medium break-words text-sm">{selectedBooking.passenger_email}</div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                                    <div className="text-slate-900 font-medium text-sm">{selectedBooking.passenger_phone}</div>
                                </div>
                                {selectedBooking.date_of_birth && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Date of Birth</label>
                                        <div className="text-slate-900 font-medium text-sm">{new Date(selectedBooking.date_of_birth).toLocaleDateString()}</div>
                                    </div>
                                )}
                                {selectedBooking.frequent_flyer_number && (
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Frequent Flyer #</label>
                                        <div className="text-slate-900 font-medium text-sm font-mono">{selectedBooking.frequent_flyer_number}</div>
                                    </div>
                                )}
                            </div>

                            {(selectedBooking.passport_number || selectedBooking.passport_issue_date || selectedBooking.passport_expiry_date) && (
                                <div className="px-2 pt-6 border-t border-slate-100">
                                    <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-sm">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        Passport Information
                                    </h5>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                            {selectedBooking.passport_number && (
                                                <div className="col-span-2">
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Passport Number</label>
                                                    <div className="text-slate-900 font-bold font-mono text-base">
                                                        {selectedBooking.passport_number}
                                                    </div>
                                                </div>
                                            )}
                                            {selectedBooking.passport_issue_date && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Issue Date</label>
                                                    <div className="text-slate-900 font-medium text-sm">{new Date(selectedBooking.passport_issue_date).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                            {selectedBooking.passport_expiry_date && (
                                                <div>
                                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">Expiry Date</label>
                                                    <div className="text-slate-900 font-medium text-sm">{new Date(selectedBooking.passport_expiry_date).toLocaleDateString()}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end sticky bottom-0">
                            <button
                                onClick={() => setSelectedBooking(null)}
                                className="cursor-pointer px-6 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm text-sm"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
