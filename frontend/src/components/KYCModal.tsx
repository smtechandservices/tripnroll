'use client';
import { useState, useEffect } from 'react';
import { X, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { submitKYC } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

export function KYCModal() {
    const { user, refreshUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        aadhar_number: '',
        pan_number: ''
    });

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-kyc-modal', handleOpen);
        return () => window.removeEventListener('open-kyc-modal', handleOpen);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (formData.aadhar_number.length !== 12) {
            Swal.fire('Error', 'Aadhar number must be 12 digits', 'error');
            return;
        }
        if (formData.pan_number.length !== 10) {
            Swal.fire('Error', 'PAN number must be 10 characters', 'error');
            return;
        }

        setLoading(true);
        try {
            await submitKYC(formData.aadhar_number, formData.pan_number);
            
            // Refresh user profile in context is tricky without a dedicated refresh function,
            // but we can just tell the user it was submitted and reload or let them closing the modal do it.
            // Ideally useAuth should have a refreshProfile.
            
            await Swal.fire({
                icon: 'success',
                title: 'KYC Submitted',
                text: 'Your KYC details have been submitted for verification. Admin will review them shortly.',
                confirmButtonColor: '#2563eb',
            });
            
            setIsOpen(false);
            // Refresh user state without full page reload
            await refreshUser();
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Failed to submit KYC', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="relative p-8 border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <ShieldCheck size={24} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800">Verify Identity</h2>
                    </div>
                    <p className="text-slate-500 text-sm">
                        Complete your KYC to unlock flight bookings and premium features.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Aadhar Number</label>
                            <input
                                required
                                type="text"
                                maxLength={12}
                                placeholder="12-digit Aadhar Number"
                                value={formData.aadhar_number}
                                onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '') })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 font-medium"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">PAN Number</label>
                            <input
                                required
                                type="text"
                                maxLength={10}
                                placeholder="10-character PAN (e.g. ABCDE1234F)"
                                value={formData.pan_number.toUpperCase()}
                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all text-slate-800 font-medium uppercase"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-700 leading-relaxed font-medium">
                            Please ensure the details above match your official documents. Incorrect information may lead to rejection.
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : 'Submit KYC Details'}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                </form>
            </div>
        </div>
    );
}
