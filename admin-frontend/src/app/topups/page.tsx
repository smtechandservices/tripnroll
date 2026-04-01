'use client';

import { useState, useEffect } from 'react';
import { getAdminTopUpRequests, processTopUpRequest, TopUpRequest, PaginatedResponse } from '@/lib/api';
import { Wallet, Search, CheckCircle, XCircle, Clock, Filter, AlertCircle, TrendingUp, User as UserIcon } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TopUpRequestsPage() {
    const [requests, setRequests] = useState<TopUpRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchRequests();
    }, [page, statusFilter, search]);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const data = await getAdminTopUpRequests(page, search, statusFilter);
            setRequests(data.results);
            setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 per page
        } catch (error) {
            console.error('Failed to fetch top-up requests', error);
            Swal.fire('Error', 'Failed to load top-up requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleAction = async (requestId: number, action: 'APPROVE' | 'REJECT') => {
        const result = await Swal.fire({
            title: action === 'APPROVE' ? 'Approve Top-up' : 'Reject Top-up',
            text: `Are you sure you want to ${action.toLowerCase()} this top-up request?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: action === 'APPROVE' ? '#16a34a' : '#dc2626',
            confirmButtonText: action === 'APPROVE' ? 'Yes, Approve' : 'Yes, Reject',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        setProcessingId(requestId);
        try {
            await processTopUpRequest(requestId, action);
            Swal.fire('Success', `Request ${action.toLowerCase()}d successfully`, 'success');
            fetchRequests(); // Refresh
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Operation failed', 'error');
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Wallet className="text-green-600" size={32} />
                        Top-up Requests
                    </h1>
                    <p className="text-slate-500 mt-1">Review and process user wallet top-up requests.</p>
                </div>
            </div>

            {/* Quick stats / summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Tasks</p>
                        <p className="text-2xl font-bold text-slate-900">
                            {requests.filter(r => r.status === 'PENDING').length}+ Pending
                        </p>
                    </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approval Rate</p>
                        <p className="text-2xl font-bold text-slate-900">High</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <TrendingUp size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volume</p>
                        <p className="text-2xl font-bold text-slate-900">Processed</p>
                    </div>
                </div>
            </div>

            {/* Filters and search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search by username or email..."
                        className="text-slate-700 w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2 w-full lg:w-auto">
                    <Filter className="text-slate-400" size={18} />
                    <select
                        className="flex-1 lg:w-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500/20 text-slate-600 font-medium"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    >
                        <option value="">All Statuses</option>
                        <option value="PENDING">Pending Only</option>
                        <option value="APPROVED">Approved</option>
                        <option value="REJECTED">Rejected</option>
                    </select>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Requested At</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                                    </tr>
                                ))
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                                        No top-up requests found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                requests.map((request) => (
                                    <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold shrink-0">
                                                    {request.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">{request.username}</p>
                                                    <p className="text-xs text-slate-500">{request.user_email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-lg font-extrabold text-slate-800">
                                                ₹{parseFloat(request.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                                                request.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                request.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                                {request.status === 'PENDING' && <Clock size={12} />}
                                                {request.status === 'APPROVED' && <CheckCircle size={12} />}
                                                {request.status === 'REJECTED' && <XCircle size={12} />}
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {new Date(request.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {request.status === 'PENDING' ? (
                                                <div className="flex items-center justify-end gap-2 text-xs font-bold">
                                                    <button
                                                        onClick={() => handleAction(request.id, 'APPROVE')}
                                                        disabled={processingId === request.id}
                                                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm shadow-green-100 disabled:opacity-50"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleAction(request.id, 'REJECT')}
                                                        disabled={processingId === request.id}
                                                        className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">
                                                    Processed {new Date(request.updated_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                        <p className="text-sm text-slate-500 font-medium">
                            Page {page} of {totalPages}
                        </p>
                        <div className="flex gap-2 font-bold text-xs">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
