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

    const adminRemarksField = `
        <div class="mt-3">
            <label class="block text-xs font-medium text-slate-600 mb-1 text-left">Admin Remarks <span class="text-slate-400 font-normal">(optional)</span></label>
            <textarea id="admin-remarks" rows="2" placeholder="Internal note visible to user…"
                class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"></textarea>
        </div>`;

    const getAdminRemarks = () =>
        (document.getElementById('admin-remarks') as HTMLTextAreaElement)?.value?.trim() || '';

    const handleProcessRefund = async (groupKey: string, groupBookings: Booking[]) => {
        const isGroup = !groupKey.startsWith('IND-');

        let totalMaxRefund = 0;
        groupBookings.forEach(booking => {
            const cp = parseFloat(booking.charged_price);
            const fp = parseFloat(booking.flight_details.price);
            totalMaxRefund += (cp > 0 || booking.is_infant) ? cp : fp;
        });

        const userRemarksHtml = groupBookings.some(b => b.user_refund_remarks)
            ? `<div class="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-lg text-left">
                <p class="text-[10px] text-orange-500 font-bold uppercase tracking-wide mb-1">User Remarks</p>
                ${groupBookings.filter(b => b.user_refund_remarks).map(b =>
                    `<p class="text-xs text-slate-700"><span class="font-medium">${b.first_name}:</span> ${b.user_refund_remarks}</p>`
                ).join('')}
               </div>`
            : '';

        const result = await Swal.fire({
            title: isGroup ? 'Approve All — Group Refund' : 'Approve Refund',
            html: `
                <div class="text-left">
                    <p class="mb-2 text-sm text-slate-500">${isGroup ? 'Group ID' : 'Booking ID'}: <strong class="text-slate-900">${groupKey}</strong></p>
                    <p class="mb-3 text-sm text-slate-500">Passengers: <strong class="text-slate-900">${groupBookings.length}</strong></p>
                    ${userRemarksHtml}
                    <div class="bg-blue-50 p-3 rounded-lg border border-blue-100 mb-3">
                        <p class="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">Total Group Cost</p>
                        <p class="text-xl font-bold text-blue-800">₹${totalMaxRefund.toLocaleString('en-IN')}</p>
                    </div>
                    <p class="text-xs text-slate-400 mb-1">Refund will be distributed proportionally across all passengers.</p>
                    ${adminRemarksField}
                </div>
            `,
            input: 'number',
            inputLabel: 'Total Refund Amount (₹)',
            inputValue: totalMaxRefund,
            inputAttributes: { min: '0', max: totalMaxRefund.toString(), step: '0.01' },
            showCancelButton: true,
            confirmButtonText: 'Approve Group Refund',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            showLoaderOnConfirm: true,
            preConfirm: async (amount) => {
                if (!amount) { Swal.showValidationMessage('Please enter an amount'); return false; }
                const numAmount = parseFloat(amount);
                if (numAmount < 0 || numAmount > totalMaxRefund) {
                    Swal.showValidationMessage(`Amount must be between 0 and ${totalMaxRefund}`);
                    return false;
                }
                const remarks = getAdminRemarks();
                try {
                    const res = isGroup
                        ? await processRefund(undefined, groupKey, numAmount, remarks)
                        : await processRefund(groupBookings[0].booking_id, undefined, numAmount, remarks);
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
                title: 'Refund Approved!',
                text: `Successfully refunded ₹${parseFloat(result.value.total_refunded as any).toLocaleString('en-IN')} for ${result.value.processed_count} passenger(s).`,
                icon: 'success'
            });
            fetchRefundRequests();
        }
    };

    const handleCancelRefund = async (groupKey: string, groupBookings: Booking[]) => {
        const isGroup = !groupKey.startsWith('IND-');

        const userRemarksHtml = groupBookings.some(b => b.user_refund_remarks)
            ? `<div class="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-lg">
                <p class="text-[10px] text-orange-500 font-bold uppercase tracking-wide mb-1">User Remarks</p>
                ${groupBookings.filter(b => b.user_refund_remarks).map(b =>
                    `<p class="text-xs text-slate-700"><span class="font-medium">${b.first_name}:</span> ${b.user_refund_remarks}</p>`
                ).join('')}
               </div>`
            : '';

        const result = await Swal.fire({
            title: isGroup ? 'Deny All — Group Refund?' : 'Deny Refund?',
            html: `
                <div class="text-left">
                    <p class="text-sm text-slate-500 mb-3">${isGroup
                        ? `Deny refund for all <strong>${groupBookings.length}</strong> passengers in group <strong>${groupKey}</strong>?`
                        : `Deny refund for <strong>${groupBookings[0].first_name} ${groupBookings[0].last_name}</strong>?`}
                    </p>
                    ${userRemarksHtml}
                    ${adminRemarksField}
                </div>`,
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, deny',
            preConfirm: () => getAdminRemarks()
        });

        if (result.isConfirmed) {
            try {
                const remarks = result.value as string;
                if (isGroup) {
                    await cancelRefundRequest(undefined, groupKey, remarks);
                } else {
                    await cancelRefundRequest(groupBookings[0].booking_id, undefined, remarks);
                }
                Swal.fire('Denied!', 'The refund request(s) have been denied.', 'success');
                fetchRefundRequests();
            } catch (error: any) {
                Swal.fire('Error!', error.message || 'Failed to deny refund.', 'error');
            }
        }
    };

    const handleApprovePassenger = async (booking: Booking) => {
        const maxRefund = parseFloat((parseFloat(booking.charged_price) > 0 || booking.is_infant) ? booking.charged_price : booking.flight_details.price);

        const userRemarksHtml = booking.user_refund_remarks
            ? `<div class="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-lg">
                <p class="text-[10px] text-orange-500 font-bold uppercase tracking-wide mb-1">User's Reason</p>
                <p class="text-xs text-slate-700">${booking.user_refund_remarks}</p>
               </div>`
            : '';

        const result = await Swal.fire({
            title: 'Approve Refund',
            html: `
                <div class="text-left">
                    <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100 mb-3">
                        <div>
                            <div class="font-bold text-slate-800">${booking.first_name} ${booking.last_name}</div>
                            <div class="text-xs text-slate-500 mt-0.5">${booking.booking_id}</div>
                        </div>
                    </div>
                    ${userRemarksHtml}
                    <div class="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-2">
                        <div class="text-xs text-slate-500 mb-1">Amount Paid</div>
                        <div class="text-lg font-bold text-slate-800">₹${maxRefund.toLocaleString('en-IN')}</div>
                    </div>
                    ${adminRemarksField}
                </div>
            `,
            input: 'number',
            inputLabel: 'Refund Amount (₹)',
            inputValue: maxRefund,
            inputAttributes: { min: '0', max: maxRefund.toString(), step: '0.01' },
            showCancelButton: true,
            confirmButtonText: 'Approve Refund',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#64748b',
            showLoaderOnConfirm: true,
            preConfirm: async (amount) => {
                if (!amount) { Swal.showValidationMessage('Please enter an amount'); return false; }
                const num = parseFloat(amount);
                if (num < 0 || num > maxRefund) {
                    Swal.showValidationMessage(`Amount must be between 0 and ₹${maxRefund.toLocaleString('en-IN')}`);
                    return false;
                }
                const remarks = getAdminRemarks();
                try {
                    return await processRefund(booking.booking_id, undefined, num, remarks);
                } catch (error: any) {
                    Swal.showValidationMessage(`Failed: ${error.message}`);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        });

        if (result.isConfirmed && result.value) {
            Swal.fire('Approved!', `Refunded ₹${parseFloat(result.value.total_refunded as any).toLocaleString('en-IN')} to ${booking.first_name} ${booking.last_name}'s wallet.`, 'success');
            fetchRefundRequests();
        }
    };

    const handleDenyPassenger = async (booking: Booking) => {
        const userRemarksHtml = booking.user_refund_remarks
            ? `<div class="mb-3 p-2 bg-orange-50 border border-orange-100 rounded-lg">
                <p class="text-[10px] text-orange-500 font-bold uppercase tracking-wide mb-1">User's Reason</p>
                <p class="text-xs text-slate-700">${booking.user_refund_remarks}</p>
               </div>`
            : '';

        const result = await Swal.fire({
            title: 'Deny Refund?',
            html: `
                <div class="text-left px-1">
                    <p class="text-sm text-slate-500 mb-3">Deny refund request for:</p>
                    <div class="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100 mb-3">
                        <div>
                            <div class="font-bold text-slate-800">${booking.first_name} ${booking.last_name}</div>
                            <div class="text-xs text-slate-500 mt-0.5">${booking.booking_id}</div>
                        </div>
                    </div>
                    ${userRemarksHtml}
                    <p class="text-xs text-slate-400 mb-2">Booking will revert to <strong>Confirmed</strong> status.</p>
                    ${adminRemarksField}
                </div>
            `,
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, deny refund',
            preConfirm: () => getAdminRemarks()
        });

        if (result.isConfirmed) {
            try {
                const remarks = result.value as string;
                await cancelRefundRequest(booking.booking_id, undefined, remarks);
                Swal.fire('Denied', `Refund request for ${booking.first_name} ${booking.last_name} has been denied.`, 'success');
                fetchRefundRequests();
            } catch (error: any) {
                Swal.fire('Error!', error.message || 'Failed to deny refund.', 'error');
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
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Remarks</th>
                            <th colSpan={2} className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs text-right">
                                {activeTab === 'pending' ? 'Action' : 'Status'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={activeTab === 'completed' ? 8 : 7} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading {activeTab === 'pending' ? 'requests' : 'refunds'}...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : bookings.length === 0 ? (
                            <tr>
                                <td colSpan={activeTab === 'completed' ? 8 : 7} className="px-6 py-20 text-center">
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
                                                        <td className="px-4 py-4 max-w-[160px]">
                                                            {booking.user_refund_remarks && (
                                                                <div className="mb-1">
                                                                    <div className="text-[9px] text-orange-500 font-bold uppercase tracking-wide leading-none mb-0.5">User</div>
                                                                    <div className="text-xs text-slate-700 leading-snug line-clamp-2">{booking.user_refund_remarks}</div>
                                                                </div>
                                                            )}
                                                            {booking.admin_refund_remarks && (
                                                                <div>
                                                                    <div className="text-[9px] text-blue-500 font-bold uppercase tracking-wide leading-none mb-0.5">Admin</div>
                                                                    <div className="text-xs text-slate-700 leading-snug line-clamp-2">{booking.admin_refund_remarks}</div>
                                                                </div>
                                                            )}
                                                            {!booking.user_refund_remarks && !booking.admin_refund_remarks && (
                                                                <span className="text-[10px] text-slate-300 italic">—</span>
                                                            )}
                                                        </td>
                                                        <td colSpan={2} className="px-6 py-4 text-right">
                                                            {activeTab === 'completed' ? (
                                                                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                                                    ✓ Refunded
                                                                </span>
                                                            ) : (
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button
                                                                        onClick={() => handleDenyPassenger(booking)}
                                                                        className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-50 transition-colors shadow-sm"
                                                                    >
                                                                        Deny
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleApprovePassenger(booking)}
                                                                        className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-green-600 text-white rounded-lg text-[10px] font-bold hover:bg-green-700 transition-colors shadow-sm"
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                </div>
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
                                                            <span className="text-[10px] text-slate-400 italic mr-1">Bulk:</span>
                                                            <button
                                                                onClick={() => handleCancelRefund(groupKey, groupBookings)}
                                                                className="cursor-pointer inline-flex items-center px-3 py-1.5 bg-white text-red-600 border border-red-200 rounded-lg text-[10px] font-bold hover:bg-red-50 transition-colors shadow-sm"
                                                            >
                                                                Deny All
                                                            </button>
                                                            <button
                                                                onClick={() => handleProcessRefund(groupKey, groupBookings)}
                                                                className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20"
                                                            >
                                                                Approve All
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
