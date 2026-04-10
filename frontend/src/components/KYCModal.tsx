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
        pan_number: '',
        gst_number: '',
    });
    const [files, setFiles] = useState<{ [key: string]: File | null }>({
        brand_logo: null,
        aadhar_card_doc: null,
        pan_card_doc: null,
    });

    useEffect(() => {
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('open-kyc-modal', handleOpen);
        return () => window.removeEventListener('open-kyc-modal', handleOpen);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles(prev => ({ ...prev, [field]: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic validation
        if (formData.aadhar_number && formData.aadhar_number.length !== 12) {
            Swal.fire('Error', 'Aadhar number must be 12 digits', 'error');
            return;
        }
        if (formData.pan_number && formData.pan_number.length !== 10) {
            Swal.fire('Error', 'PAN number must be 10 characters', 'error');
            return;
        }
        if (!formData.gst_number || formData.gst_number.length !== 15) {
            Swal.fire('Error', 'Please enter a valid 15-character GST number', 'error');
            return;
        }
        if (!files.aadhar_card_doc || !files.pan_card_doc || !files.brand_logo) {
            Swal.fire('Error', 'All documents (Aadhar, PAN, and Brand Logo) are mandatory', 'error');
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            submitData.append('aadhar_number', formData.aadhar_number);
            submitData.append('pan_number', formData.pan_number);
            submitData.append('gst_number', formData.gst_number);
            
            if (files.brand_logo) submitData.append('brand_logo', files.brand_logo);
            if (files.aadhar_card_doc) submitData.append('aadhar_card_doc', files.aadhar_card_doc);
            if (files.pan_card_doc) submitData.append('pan_card_doc', files.pan_card_doc);

            await submitKYC(submitData);
            
            await Swal.fire({
                icon: 'success',
                title: 'KYC Submitted',
                text: 'Your KYC details and documents have been submitted for verification.',
                confirmButtonColor: '#2563eb',
            });
            
            setIsOpen(false);
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
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="relative p-6 border-b border-slate-100 bg-slate-50/50">
                    <button 
                        onClick={() => setIsOpen(false)}
                        className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-full transition-all"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="flex items-center gap-4 mb-1">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                            <ShieldCheck size={20} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Verify Identity</h2>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Aadhar */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">Aadhar Details <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                maxLength={12}
                                placeholder="12-digit Aadhar Number"
                                value={formData.aadhar_number}
                                onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value.replace(/\D/g, '') })}
                                className="text-slate-800 w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all"
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Aadhar Card Copy <span className="text-red-500">*</span></span>
                                <input 
                                    required
                                    type="file" 
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, 'aadhar_card_doc')}
                                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        {/* PAN */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">PAN Details <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                maxLength={10}
                                placeholder="10-character PAN"
                                value={formData.pan_number.toUpperCase()}
                                onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                className="text-slate-800 w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all uppercase"
                            />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">PAN Card Copy <span className="text-red-500">*</span></span>
                                <input 
                                    required
                                    type="file" 
                                    accept="image/*,.pdf"
                                    onChange={(e) => handleFileChange(e, 'pan_card_doc')}
                                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                            </div>
                        </div>

                        {/* GST */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">GST Details <span className="text-red-500">*</span></label>
                            <input
                                required
                                type="text"
                                maxLength={15}
                                placeholder="15-character GST Number"
                                value={formData.gst_number.toUpperCase()}
                                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                                className="text-slate-800 w-full px-4 py-2 text-sm rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all uppercase"
                            />
                        </div>

                        {/* Brand Logo */}
                        <div className="space-y-3">
                            <label className="block text-sm font-bold text-slate-700">Brand Identity <span className="text-red-500">*</span></label>
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Brand Logo <span className="text-red-500">*</span></span>
                                <input 
                                    required
                                    type="file" 
                                    accept="image/*"
                                    onChange={(e) => handleFileChange(e, 'brand_logo')}
                                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                />
                                <p className="text-[9px] text-slate-400">Used for profile identity and bookings.</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
                        <AlertCircle className="text-amber-500 shrink-0" size={18} />
                        <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                            Please ensure all provided details and documents are clear and legible. All fields and document uploads are mandatory. Incorrect or blurred uploads may result in rejection.
                        </p>
                    </div>

                    <div className="pt-2 sticky bottom-0 bg-white space-y-3">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-md transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit KYC & Documents'}
                        </button>
                        
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="w-full py-1 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
