'use client';

import { useEffect, useState, Fragment } from 'react';
import { getAdminBookings, processRefund, cancelRefundRequest, Booking } from '@/lib/api';
import { RefreshCw, CheckCircle, Search } from 'lucide-react';
import Swal from 'sweetalert2';

export default function RefundPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

    const fetchRefundRequests = async (tab: 'pending' | 'completed' = activeTab) => {
        setLoading(true);
        try {
            // Fetch based on active tab
            const status = tab === 'pending' ? 'REFUND_REQUESTED' : 'REFUNDED';
            const data = await getAdminBookings(1, '', status);
            setBookings(data.results);
        } catch (error) {
            console.error('Failed to fetch refund requests', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRefundRequests(activeTab);
    }, [activeTab]);

    const handleProcessRefund = async (groupKey: string, groupBookings: Booking[]) => {
        const isGroup = !groupKey.startsWith('IND-');
        
        // Calculate Total Max Refund for the Group
        let totalMaxRefund = 0;
        groupBookings.forEach(booking => {
            const cp = parseFloat(booking.charged_price);
            const fp = parseFloat(booking.flight_details.price);
            totalMaxRefund += (cp > 0 || booking.is_infant) ? cp : fp;
        });

        // Custom Swal with input for refund amount
        const result = await Swal.fire({
            title: isGroup ? 'Process Group Refund' : 'Process Refund',
            html: `
                <div class="text-left">
                    <p class="mb-2 text-sm text-slate-500">${isGroup ? 'Group ID' : 'Booking ID'}: <strong class="text-slate-900">${groupKey}</strong></p>
                    <p class="mb-2 text-sm text-slate-500">Passengers: <strong class="text-slate-900">${groupBookings.length}</strong></p>
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-4">
                        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Group Cost</p>
                        <p class="text-xl font-bold text-blue-800">₹${totalMaxRefund.toLocaleString('en-IN')}</p>
                    </div>
                    <p class="text-xs text-slate-400">Total refund amount will be distributed proportionally across all passengers in this group.</p>
                </div>
            `,
            input: 'number',
            inputLabel: 'Total Refund Amount (₹)',
            inputValue: totalMaxRefund,
            inputAttributes: {
                min: '0',
                max: totalMaxRefund.toString(),
                step: '0.01'
            },
            showCancelButton: true,
            confirmButtonText: 'Process Group Refund',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            showLoaderOnConfirm: true,
            preConfirm: async (amount) => {
                if (!amount) {
                    Swal.showValidationMessage('Please enter an amount');
                    return false;
                }
                const numAmount = parseFloat(amount);
                if (numAmount < 0 || numAmount > totalMaxRefund) {
                    Swal.showValidationMessage(`Amount must be between 0 and ${totalMaxRefund}`);
                    return false;
                }

                try {
                    const res = isGroup 
                        ? await processRefund(undefined, groupKey, numAmount)
                        : await processRefund(groupBookings[0].booking_id, undefined, numAmount);
                    return res;
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
                text: `Successfully refunded ₹${parseFloat(result.value.total_refunded as any).toLocaleString('en-IN')} for ${result.value.processed_count} passenger(s).`,
                icon: 'success'
            });
            fetchRefundRequests();
        }
    };

    const handleCancelRefund = async (groupKey: string, groupBookings: Booking[]) => {
        const isGroup = !groupKey.startsWith('IND-');
        const result = await Swal.fire({
            title: isGroup ? 'Reject Group Refund?' : 'Reject Refund?',
            text: isGroup 
                ? `Are you sure you want to reject and cancel the refund requests for all ${groupBookings.length} passengers in this group?`
                : `Are you sure you want to reject the refund request for ${groupBookings[0].first_name} ${groupBookings[0].last_name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, reject group!'
        });

        if (result.isConfirmed) {
            try {
                if (isGroup) {
                    await cancelRefundRequest(undefined, groupKey);
                } else {
                    await cancelRefundRequest(groupBookings[0].booking_id);
                }
                Swal.fire('Rejected!', 'The refund request(s) have been rejected.', 'success');
                fetchRefundRequests();
            } catch (error: any) {
                Swal.fire('Error!', error.message || 'Failed to cancel refund.', 'error');
            }
        }
    };

    return (
        <div className='pt-8'>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Refund Management</h2>
                    <p className="text-slate-500 mt-1">Manage pending and completed refunds</p>
                </div>
                <button
                    onClick={() => fetchRefundRequests(activeTab)}
                    className="cursor-pointer p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-600 shadow-sm"
                    title="Refresh List"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`cursor-pointer px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'pending'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    Pending Requests
                </button>
                <button
                    onClick={() => setActiveTab('completed')}
                    className={`cursor-pointer px-4 py-2 rounded-lg font-medium text-sm transition-all ${activeTab === 'completed'
                        ? 'bg-green-600 text-white shadow-lg shadow-green-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                        }`}
                >
                    Completed Refunds
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
                            {activeTab === 'completed' && (
                                <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Refunded</th>
                            )}
                            <th colSpan={2} className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs text-right">
                                {activeTab === 'pending' ? 'Action' : 'Status'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={activeTab === 'completed' ? 7 : 6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading {activeTab === 'pending' ? 'requests' : 'refunds'}...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={activeTab === 'completed' ? 7 : 6} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                            <CheckCircle className="w-8 h-8 text-green-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">All caught up!</h3>
                                            <p className="text-slate-500 mt-1">
                                                {activeTab === 'pending' ? 'No pending refund requests found.' : 'No completed refunds found.'}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            (() => {
                                const groupedBookingsMap = bookings.reduce((acc: { [key: string]: Booking[] }, booking) => {
                                    const key = booking.booking_group || booking.booking_id;
                                    if (!acc[key]) acc[key] = [];
                                    acc[key].push(booking);
                                    return acc;
                                }, {});

                                const orderedGroupKeys = Array.from(new Set(bookings.map(b => b.booking_group || b.booking_id)));
                                
                                const groupColors = [
                                    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-400' },
                                    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-400' },
                                    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-400' },
                                    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-400' },
                                    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-400' },
                                    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-400' },
                                    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-400' },
                                ];

                                return orderedGroupKeys.map((groupKey, groupIdx) => {
                                    const groupBookings = groupedBookingsMap[groupKey];
                                    const groupBgClass = groupIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60';
                                    const colorTheme = groupColors[groupIdx % groupColors.length];

                                    return (
                                        <Fragment key={groupKey}>
                                            {groupBookings.map((booking, idx) => {
                                                const isLastInGroup = idx === groupBookings.length - 1;
                                                return (
                                                    <tr 
                                                        key={booking.booking_id} 
                                                        className={`${groupBgClass} hover:bg-slate-100/50 transition-colors ${isLastInGroup && groupIdx !== orderedGroupKeys.length - 1 ? 'border-b-[3px] border-slate-200' : 'border-b border-slate-100/30'}`}
                                                    >
                                                        <td className={`px-4 py-4 border-l-4 ${colorTheme.border}`}>
                                                            <div className="font-mono text-xs font-bold text-slate-700 pl-1">{booking.booking_id}</div>
                                                            {booking.booking_group && (
                                                                <div className={`ml-1 font-mono text-[10px] ${colorTheme.bg} px-2 py-0.5 rounded-md inline-block ${colorTheme.text} font-bold mt-1.5`}>
                                                                    Grp: {booking.booking_group}
                                                                </div>
                                                            )}
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
                                                            ₹{(() => {
                                                                const cp = parseFloat(booking.charged_price);
                                                                const fp = parseFloat(booking.flight_details.price);
                                                                return ((cp > 0 || booking.is_infant) ? cp : fp).toLocaleString('en-IN');
                                                            })()}
                                                        </td>
                                                        {activeTab === 'completed' && (
                                                            <td className="px-6 py-4">
                                                                <span className="font-bold text-red-600">
                                                                    -₹{parseFloat(booking.refunded_amount || '0').toLocaleString('en-IN')}
                                                                </span>
                                                            </td>
                                                        )}
                                                        <td colSpan={2} className="px-6 py-4 text-right">
                                                            {activeTab === 'completed' && (
                                                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                                    ✓ Refunded
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {/* Group Summary Row */}
                                            <tr className={`${groupBgClass} border-b-2 border-slate-200`}>
                                                <td colSpan={4} className="px-6 py-4 text-slate-500 font-medium italic">
                                                    Group Total Summary
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-900">
                                                    ₹{(() => {
                                                        let total = 0;
                                                        groupBookings.forEach(b => {
                                                            const cp = parseFloat(b.charged_price);
                                                            const fp = parseFloat(b.flight_details.price);
                                                            total += (cp > 0 || b.is_infant) ? cp : fp;
                                                        });
                                                        return total.toLocaleString('en-IN');
                                                    })()}
                                                </td>
                                                {activeTab === 'completed' && (
                                                    <td className="px-6 py-4 font-bold text-red-600">
                                                        -₹{(() => {
                                                            let total = 0;
                                                            groupBookings.forEach(b => {
                                                                total += parseFloat(b.refunded_amount || '0');
                                                            });
                                                            return total.toLocaleString('en-IN');
                                                        })()}
                                                    </td>
                                                )}
                                                <td colSpan={2} className="px-6 py-4 text-right">
                                                    {activeTab === 'pending' ? (
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => handleCancelRefund(groupKey, groupBookings)}
                                                                className="cursor-pointer inline-flex items-center px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-50 transition-colors shadow-sm"
                                                            >
                                                                Reject Group
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessRefund(groupKey, groupBookings)}
                                                                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                                            >
                                                                Process Group Refund
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 text-green-700 font-bold text-[10px] uppercase tracking-wider bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                                                            <CheckCircle className="w-3.5 h-3.5" />
                                                            Group Fully Processed
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        </Fragment>
                                    );
                                });
                            })()
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
