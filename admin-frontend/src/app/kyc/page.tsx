'use client';

import { useEffect, useState } from 'react';
import { getAdminKYCs, updateKYCStatus, User } from '@/lib/api';
import { Shield, ShieldCheck, ShieldAlert, Search, Check, X, User as UserIcon, Calendar, FileText, Eye } from 'lucide-react';
import Swal from 'sweetalert2';

export default function KYCManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [filterStatus, setFilterStatus] = useState<string>('SUBMITTED');
    const [selectedDoc, setSelectedDoc] = useState<{ url: string, title: string } | null>(null);
    const pageSize = 10;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchKYCs(currentPage, debouncedSearch, filterStatus);
    }, [currentPage, debouncedSearch, filterStatus]);

    const fetchKYCs = async (page: number = 1, search: string = '', status: string = '') => {
        setLoading(true);
        try {
            const data = await getAdminKYCs(page, search, status);
            setUsers(data.results);
            setTotalCount(data.count);
        } catch (error) {
            console.error('Failed to fetch KYC submissions', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId: number, action: 'APPROVE' | 'REJECT', username: string) => {
        const result = await Swal.fire({
            title: `${action === 'APPROVE' ? 'Approve' : 'Reject'} KYC?`,
            text: `Are you sure you want to ${action.toLowerCase()} the KYC for ${username}?`,
            icon: action === 'APPROVE' ? 'success' : 'warning',
            showCancelButton: true,
            confirmButtonColor: action === 'APPROVE' ? '#16a34a' : '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: `Yes, ${action.toLowerCase()} it!`
        });

        if (result.isConfirmed) {
            try {
                await updateKYCStatus(userId, action);
                Swal.fire({
                    icon: 'success',
                    title: `KYC ${action.toLowerCase()}d`,
                    showConfirmButton: false,
                    timer: 1500
                });
                fetchKYCs(currentPage, debouncedSearch, filterStatus);
            } catch (error: any) {
                Swal.fire('Error', error.message || 'Action failed', 'error');
            }
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="pt-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield className="text-blue-600" />
                        KYC Management
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Review and verify user identity documents</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        {['SUBMITTED', 'VERIFIED', 'REJECTED', ''].map((status) => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    filterStatus === status 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {status === '' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name, email, Aadhar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-slate-700 pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 shadow-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {loading && users.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-500 font-medium">Loading KYC submissions...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 text-slate-300 mb-4">
                            <Shield size={32} />
                        </div>
                        <p className="text-slate-500 font-medium">No KYC submissions found for the selected filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {users.map((user) => (
                            <div key={user.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                <UserIcon size={24} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-800 text-lg">{user.username}</h3>
                                                <p className="text-slate-500 text-sm">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            user.profile.kyc_status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                            user.profile.kyc_status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {user.profile.kyc_status}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <FileText size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">Aadhar Number</span>
                                                </div>
                                                <p className="text-slate-700 font-mono font-bold tracking-widest mb-3">
                                                    {user.profile.aadhar_number || 'N/A'}
                                                </p>
                                            </div>
                                            {user.profile.aadhar_card_doc && (
                                                <button 
                                                    onClick={() => setSelectedDoc({ url: user.profile.aadhar_card_doc as string, title: `Aadhar Card - ${user.username}` })}
                                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                    View Aadhar Card
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                    <FileText size={14} />
                                                    <span className="text-[10px] font-bold uppercase tracking-widest">PAN Number</span>
                                                </div>
                                                <p className="text-slate-700 font-mono font-bold tracking-widest uppercase mb-3">
                                                    {user.profile.pan_number || 'N/A'}
                                                </p>
                                            </div>
                                            {user.profile.pan_card_doc && (
                                                <button 
                                                    onClick={() => setSelectedDoc({ url: user.profile.pan_card_doc as string, title: `PAN Card - ${user.username}` })}
                                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                                                >
                                                    <Eye size={14} />
                                                    View PAN Card
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {(user.profile.gst_number || user.profile.brand_logo) && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-100">
                                            {user.profile.gst_number && (
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                                        <Shield size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">GST Number</span>
                                                    </div>
                                                    <p className="text-slate-700 font-mono font-bold tracking-widest uppercase">
                                                        {user.profile.gst_number}
                                                    </p>
                                                </div>
                                            )}
                                            {user.profile.brand_logo && (
                                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                    <div className="flex items-center gap-2 text-slate-400 mb-2">
                                                        <UserIcon size={14} />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">Brand Identity</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setSelectedDoc({ url: user.profile.brand_logo as string, title: `Brand Logo - ${user.username}` })}
                                                        className="flex items-center gap-3 group/logo text-blue-600 cursor-pointer w-full text-left"
                                                    >
                                                        <Eye size={14} />
                                                        <span className="text-xs font-bold text-blue-600 group-hover/logo:text-blue-700">View Logo</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                                            <Calendar size={14} />
                                            Joined {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : 'N/A'}
                                        </div>
                                        
                                        {user.profile.kyc_status === 'SUBMITTED' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleAction(user.id, 'REJECT', user.username)}
                                                    className="flex items-center gap-1.5 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-all"
                                                >
                                                    <X size={16} />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAction(user.id, 'APPROVE', user.username)}
                                                    className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm shadow-emerald-200"
                                                >
                                                    <Check size={16} />
                                                    Approve
                                                </button>
                                            </div>
                                        )}
                                        
                                        {(user.profile.kyc_status === 'VERIFIED' || user.profile.kyc_status === 'REJECTED') && (
                                             <button
                                                onClick={() => handleAction(user.id, user.profile.kyc_status === 'VERIFIED' ? 'REJECT' : 'APPROVE', user.username)}
                                                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider"
                                             >
                                                Change Status
                                             </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {!loading && totalPages > 1 && (
                <div className="mt-8 flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
                    <span className="text-sm text-slate-500 font-medium">
                        Page <span className="text-slate-800 font-bold">{currentPage}</span> of <span className="text-slate-800 font-bold">{totalPages}</span> ({totalCount} entries)
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-4 py-2 text-sm font-bold border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {selectedDoc && (
                <DocumentModal 
                    url={selectedDoc.url} 
                    title={selectedDoc.title} 
                    onClose={() => setSelectedDoc(null)} 
                />
            )}
        </div>
    );
}

// ─── Document Viewer Modal ───────────────────────────────────────────────────

function DocumentModal({ 
    url, 
    title, 
    onClose 
}: { 
    url: string; 
    title: string; 
    onClose: () => void; 
}) {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPdf, setIsPdf] = useState(false);

    useEffect(() => {
        let active = true;
        let currentBlobUrl: string | null = null;

        async function fetchFile() {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token');
                // Ensure HTTPS in production to avoid mixed content issues
                const securedUrl = (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) 
                    ? url.replace('http://', 'https://') 
                    : url;

                const response = await fetch(securedUrl, {
                    headers: {
                        'Authorization': `Token ${token}`
                    }
                });
                
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                
                const blob = await response.blob();
                if (active) {
                    setIsPdf(blob.type === 'application/pdf');
                    currentBlobUrl = URL.createObjectURL(blob);
                    setBlobUrl(currentBlobUrl);
                }
            } catch (err) {
                if (active) {
                    console.error('Document fetch failed:', err);
                    setError('Failed to load document. Please check your connection or login again.');
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchFile();

        return () => {
            active = false;
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
            }
        };
    }, [url]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <FileText size={18} className="text-blue-600" />
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 bg-slate-50 overflow-auto p-4 flex items-center justify-center">
                    {loading ? (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-sm font-bold text-slate-400 animate-pulse uppercase tracking-widest">Securely loading...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-white p-8 rounded-2xl border border-red-100 text-center max-w-sm">
                            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShieldAlert size={24} />
                            </div>
                            <p className="text-slate-800 font-bold mb-2">Access Error</p>
                            <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
                        </div>
                    ) : (
                        isPdf ? (
                            <iframe 
                                src={blobUrl!} 
                                className="w-full h-full rounded-xl border border-slate-200 bg-white" 
                                title={title}
                            />
                        ) : (
                            <img 
                                src={blobUrl!} 
                                alt={title} 
                                className="max-w-full max-h-full object-contain shadow-sm rounded-[2rem] bg-white p-2 border border-slate-200" 
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
