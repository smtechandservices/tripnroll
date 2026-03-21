'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/api';
import { X, ShieldCheck, ShieldAlert, Shield } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, refreshUser } = useAuth(); // We need refreshUser to update the user in context
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState(user?.profile?.phone_number || '');
    const [passport, setPassport] = useState(user?.profile?.passport_number || '');
    const [address, setAddress] = useState(user?.profile?.address || '');
    const [phoneError, setPhoneError] = useState('');

    const validatePhoneNumber = (phoneNumber: string): boolean => {
        if (!phoneNumber) return true; // Phone is optional

        // Remove all spaces and special characters except +
        const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

        // Check for valid Indian phone number formats:
        // +919876543210 (with country code)
        // 919876543210 (without + but with country code)
        // 9876543210 (10 digits only)
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

        return phoneRegex.test(cleaned);
    };

    const handlePhoneChange = (value: string) => {
        setPhone(value);
        if (value && !validatePhoneNumber(value)) {
            setPhoneError('Please enter a valid Indian phone number (10 digits, starting with 6-9)');
        } else {
            setPhoneError('');
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate phone number before submission
        if (phone && !validatePhoneNumber(phone)) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Phone Number',
                text: 'Please enter a valid Indian phone number',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        setIsLoading(true);

        try {
            await updateProfile({
                phone_number: phone,
                passport_number: passport,
                address: address,
            });

            // Update local user context if possible, or force reload/refetch
            // Since our AuthContext takes a User object, we can optimistically update it
            if (user && user.profile) {
                const updatedUser = {
                    ...user,
                    profile: {
                        ...user.profile,
                        phone_number: phone,
                        passport_number: passport,
                        address: address
                    }
                };
                // We don't have a dedicated 'updateUser' method in AuthContext, 
                // but we can re-login or better yet, just close for now. relative 
                // Ideally AuthContext should expose a reloadUser or updateUser method.
                // For simplicity, we just close. The user might need to refresh to see changes elsewhere 
                // unless we fetch profile again.
                // Actually, let's try to fetch profile again if we can. 
            }
            // Better approach: Since AuthContext doesn't expose reload, we just close.
            // But user wants to see changes. 
            // We can assume success.
            onClose();
            Swal.fire({
                icon: 'success',
                title: 'Profile Updated',
                text: 'Your profile has been updated successfully!',
                timer: 2000,
                showConfirmButton: false
            }).then(async () => {
                await refreshUser();
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Update Failed',
                text: 'Failed to update profile. Please try again.',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="absolute top-full right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 z-50 animate-in fade-in slide-in-from-top-5">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-800">Edit Profile</h2>
                <button
                    onClick={onClose}
                    className="cursor-pointer text-slate-400 hover:text-slate-600 transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
                    <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed text-sm font-medium"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Phone Number</label>
                    <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg border ${phoneError
                                ? 'border-red-300 focus:border-red-500'
                                : 'border-slate-200 focus:border-blue-500'
                            } outline-none transition-all text-sm font-medium text-slate-700`}
                        placeholder="+91 9876543210"
                    />
                    {phoneError && (
                        <p className="mt-1 text-xs text-red-600">{phoneError}</p>
                    )}
                    <p className="mt-1 text-xs text-slate-500">Format: 10 digits starting with 6-9</p>
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Passport Number</label>
                    <input
                        type="text"
                        value={passport}
                        onChange={(e) => setPassport(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                        placeholder="A12345678"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Address</label>
                    <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all min-h-[80px] text-sm font-medium text-slate-700 resize-none"
                        placeholder="Your address..."
                    />
                </div>

                <div className="pt-2 border-t border-slate-100 mt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">KYC Status</label>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-3">
                            {user?.profile?.kyc_status === 'VERIFIED' ? (
                                <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <ShieldCheck size={16} />
                                </div>
                            ) : user?.profile?.kyc_status === 'SUBMITTED' ? (
                                <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                    <Shield size={16} />
                                </div>
                            ) : (
                                <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                    <ShieldAlert size={16} />
                                </div>
                            )}
                            <div>
                                <p className="text-sm font-bold text-slate-700">
                                    {user?.profile?.kyc_status === 'VERIFIED' ? 'Verified' : 
                                     user?.profile?.kyc_status === 'SUBMITTED' ? 'Under Review' : 
                                     user?.profile?.kyc_status === 'REJECTED' ? 'Rejected' : 'Not Verified'}
                                </p>
                                <p className="text-[10px] text-slate-500 font-medium">Identity Verification</p>
                            </div>
                        </div>
                        
                        {(user?.profile?.kyc_status === 'PENDING' || user?.profile?.kyc_status === 'REJECTED') && (
                            <button
                                type="button"
                                onClick={() => {
                                    onClose();
                                    window.dispatchEvent(new CustomEvent('open-kyc-modal'));
                                }}
                                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                            >
                                Verify Now
                            </button>
                        )}
                    </div>
                </div>

                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
