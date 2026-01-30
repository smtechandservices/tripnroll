'use client';

import { useState } from 'react';
import { updateProfile } from '@/lib/api';
import { X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
    const { user, login } = useAuth(); // We need login to update the user in context
    const [isLoading, setIsLoading] = useState(false);
    const [phone, setPhone] = useState(user?.profile?.phone_number || '');
    const [passport, setPassport] = useState(user?.profile?.passport_number || '');
    const [address, setAddress] = useState(user?.profile?.address || '');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            }).then(() => {
                window.location.reload();
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
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none transition-all text-sm font-medium text-slate-700"
                        placeholder="+1 234 567 890"
                    />
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
