'use client';

import { useEffect, useState } from 'react';
import { getAdminBookings, processRefund, Booking } from '@/lib/api';
import { RefreshCw, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';

export default function RefundPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRefundRequests = async () => {
        setLoading(true);
        try {
            // We use the status filter to get only refund requests
            const data = await getAdminBookings(1, '', 'REFUND_REQUESTED');
            setBookings(data.results);
        } catch (error) {
            console.error('Failed to fetch refund requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundRequests();
    }, []);

    const handleProcessRefund = async (booking: Booking) => {
        const maxRefund = parseFloat(booking.flight_details.price);

        // Custom Swal with input for refund amount
        const result = await Swal.fire({
            title: 'Process Refund',
            html: `
                <div class="text-left">
                    <p class="mb-2 text-sm text-slate-500">Booking ID: <strong class="text-slate-900">${booking.booking_id}</strong></p>
                    <p class="mb-2 text-sm text-slate-500">Passenger: <strong class="text-slate-900">${booking.first_name} ${booking.last_name}</strong></p>
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Max Refund Amount</p>
                        <p class="text-xl font-bold text-blue-800">₹${maxRefund.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            `,
            input: 'number',
            inputLabel: 'Refund Amount (₹)',
            inputValue: maxRefund,
            inputAttributes: {
                min: '0',
                max: maxRefund.toString(),
                step: '0.01'
            },
            showCancelButton: true,
            confirmButtonText: 'Process Refund',
            confirmButtonColor: '#2563eb', // blue-600
            cancelButtonColor: '#64748b', // slate-500
            showLoaderOnConfirm: true,
            preConfirm: async (amount) => {
                if (!amount) {
                    Swal.showValidationMessage('Please enter an amount');
                    return false;
                }
                const numAmount = parseFloat(amount);
                if (numAmount <= 0 || numAmount > maxRefund) {
                    Swal.showValidationMessage(`Amount must be between 0 and ${maxRefund}`);
                    return false;
                }

                try {
                    const result = await processRefund(booking.booking_id, numAmount);
                    return result;
                } catch (error: any) {
                    Swal.showValidationMessage(`Request failed: ${error.message}`);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (result.isConfirmed && result.value) {
            Swal.fire({
                title: 'Refund Processed!',
                text: `Successfully refunded ₹${parseFloat(result.value.refunded_amount).toLocaleString('en-IN')} to user wallet.`,
                icon: 'success'
            });
            fetchRefundRequests();
        }
    };

    return (
        <div className='pt-8'>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Refund Requests</h2>
                    <p className="text-slate-500 mt-1">Manage and process pending refund requests</p>
                </div>
                <button
                    onClick={fetchRefundRequests}
                    className="cursor-pointer p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-600 shadow-sm"
                    title="Refresh List"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Booking ID</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Passenger</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Requested By</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Flight Details</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Paid Amount</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading requests...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                                            <p className="text-slate-500 mt-1">No pending refund requests found.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            bookings.map((booking) => (
                                <tr key={booking.booking_id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                        {booking.booking_group || booking.booking_id}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-900">{booking.first_name} {booking.last_name}</div>
                                        <div className="text-slate-500 text-xs flex items-center gap-1 mt-0.5">
                                            {booking.passenger_email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {booking.booked_by ? (
                                            <>
                                                <div className="font-medium text-slate-900">{booking.booked_by.username}</div>
                                                <div className="text-slate-500 text-xs mt-0.5">{booking.booked_by.email}</div>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 italic">System/Guest</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{booking.flight_details.airline}</div>
                                        <div className="text-slate-500 text-xs mt-0.5">
                                            {booking.flight_details.origin} <span className="text-slate-300">→</span> {booking.flight_details.destination}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">
                                            {booking.flight_details.flight_number}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        ₹{parseFloat(booking.flight_details.price).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleProcessRefund(booking)}
                                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 active:translate-y-0.5"
                                        >
                                            Process Refund
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
