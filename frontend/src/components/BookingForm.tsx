'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateBookingData, createBooking, getWalletBalance, WalletData } from '@/lib/api';
import { Loader2, Wallet, CreditCard, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

interface BookingFormProps {
    flightId: number;
    departureDate: string; // ISO date string from flight
    isInternational: boolean; // Whether the flight is international
    onSuccess: (bookingId: string) => void;
    onPassengersChange?: (count: number) => void;
}

export function BookingForm({ flightId, departureDate, isInternational, onSuccess, onPassengersChange }: BookingFormProps) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMode, setPaymentMode] = useState<'WALLET' | 'DIRECT'>('WALLET');
    const [walletData, setWalletData] = useState<WalletData | null>(null);

    // Fetch wallet data for accurate spending power
    useEffect(() => {
        const fetchWallet = async () => {
            if (user) {
                try {
                    const data = await getWalletBalance();
                    setWalletData(data);
                } catch (error) {
                    console.error('Failed to fetch wallet balance:', error);
                }
            }
        };
        fetchWallet();
    }, [user]);

    // Format departure date to YYYY-MM-DD for input field
    const formattedDate = new Date(departureDate).toISOString().split('T')[0];

    const [passengers, setPassengers] = useState(() => {
        const count = Number(searchParams.get('passengers')) || 1;
        const p = [];
        for (let i = 0; i < count; i++) {
            p.push({
                first_name: '',
                last_name: '',
                passenger_email: '',
                passenger_phone: '',
                date_of_birth: '',
                passport_number: '',
                passport_issue_date: '',
                passport_expiry_date: '',
                frequent_flyer_number: '',
            });
        }
        return p;
    });

    useEffect(() => {
        if (onPassengersChange) {
            onPassengersChange(passengers.length);
        }
    }, [passengers.length, onPassengersChange]);

    useEffect(() => {
        if (user && passengers.length >= 1 && !passengers[0].first_name) {
            // Split username into first and last name if possible
            const nameParts = (user.username || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            const newPassengers = [...passengers];
            newPassengers[0] = {
                ...newPassengers[0],
                first_name: firstName,
                last_name: lastName,
                passenger_email: user.email || '',
                passenger_phone: user.profile?.phone_number || '',
                passport_number: user.profile?.passport_number || '',
            };
            setPassengers(newPassengers);
        }
    }, [user]);

    const handleAddPassenger = () => {
        setPassengers([...passengers, {
            first_name: '',
            last_name: '',
            passenger_email: '',
            passenger_phone: '',
            date_of_birth: '',
            passport_number: '',
            passport_issue_date: '',
            passport_expiry_date: '',
            frequent_flyer_number: '',
        }]);
    };

    const handleRemovePassenger = (index: number) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter((_, i) => i !== index));
        }
    };

    const handlePassengerChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newPassengers = [...passengers];
        (newPassengers[index] as any)[name] = value;
        setPassengers(newPassengers);
    };

    const validatePhoneNumber = (phoneNumber: string): boolean => {
        if (!phoneNumber) return false; // Phone is required in booking

        // Remove all spaces and special characters except +
        const cleaned = phoneNumber.replace(/[\s\-()]/g, '');

        // Check for valid Indian phone number formats:
        // +919876543210 (with country code)
        // 919876543210 (without + but with country code)
        // 9876543210 (10 digits only)
        const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;

        return phoneRegex.test(cleaned);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await Swal.fire({
            title: 'Complete Your Booking',
            text: `Are you sure you want to book for ${passengers.length} passenger(s)?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Book Now',
            cancelButtonText: 'No, Cancel',
            confirmButtonColor: '#2563eb', // blue-600
            cancelButtonColor: '#64748b', // slate-500
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl px-6 py-3 font-bold',
                cancelButton: 'rounded-xl px-6 py-3 font-bold'
            }
        });

        if (!result.isConfirmed) return;

        // KYC Verification Check
        if (user?.profile?.kyc_status !== 'VERIFIED') {
            const statusText = user?.profile?.kyc_status === 'SUBMITTED' 
                ? 'Your KYC is currently under review by our admin team.' 
                : 'You must complete your KYC verification (Aadhar & PAN) to book flights.';
            
            await Swal.fire({
                icon: 'warning',
                title: 'KYC Required',
                text: statusText,
                confirmButtonColor: '#2563eb',
                confirmButtonText: user?.profile?.kyc_status === 'SUBMITTED' ? 'Okay' : 'Complete KYC Now',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl px-6 py-3 font-bold'
                }
            }).then((result) => {
                if (result.isConfirmed && user?.profile?.kyc_status !== 'SUBMITTED') {
                    // Navigate to profile or open KYC modal
                    window.dispatchEvent(new CustomEvent('open-kyc-modal'));
                }
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const data = {
                flight: flightId,
                travel_date: formattedDate,
                payment_mode: paymentMode,
                passengers: passengers.map(p => ({
                    ...p,
                    passport_number: p.passport_number || undefined,
                    passport_issue_date: p.passport_issue_date || undefined,
                    passport_expiry_date: p.passport_expiry_date || undefined,
                    frequent_flyer_number: p.frequent_flyer_number || undefined,
                    date_of_birth: p.date_of_birth || undefined,
                }))
            };
            const response = await createBooking(data);
            // If response is an array (multiple bookings), use the first one's group or ID for success message
            const firstBooking = Array.isArray(response) ? response[0] : response;
            onSuccess(firstBooking.booking_group || firstBooking.booking_id);
        } catch (err: unknown) {
            let errorMessage = 'Something went wrong';
            if (err instanceof Error) {
                errorMessage = err.message;
                try {
                    // Try to parse JSON error from api.ts
                    const errorObj = JSON.parse(errorMessage);
                    if (errorObj.error) {
                        errorMessage = errorObj.error;
                        if (errorObj.available !== undefined && errorObj.required !== undefined) {
                            errorMessage += ` (Available: ₹${errorObj.available}, Required: ₹${errorObj.required})`;
                        }
                    } else if (errorObj.detail) {
                        errorMessage = errorObj.detail;
                    } else {
                        // Fallback for other JSON structures
                        errorMessage = JSON.stringify(errorObj);
                    }
                } catch (e) {
                    // Not JSON, use original message
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="space-y-12">
                {passengers.map((passenger, index) => (
                    <div key={index} className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                    {index + 1}
                                </span>
                                Passenger Information
                            </h3>
                            {passengers.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemovePassenger(index)}
                                    className="text-red-500 hover:text-red-700 text-sm font-bold flex items-center gap-1 transition-colors"
                                >
                                    Remove
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormInput
                                label="First Name"
                                name="first_name"
                                value={passenger.first_name}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required
                            />
                            <FormInput
                                label="Last Name"
                                name="last_name"
                                value={passenger.last_name}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <FormInput
                                label="Email Address"
                                name="passenger_email"
                                type="email"
                                value={passenger.passenger_email}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required
                            />
                            <FormInput
                                label="Phone Number"
                                name="passenger_phone"
                                type="tel"
                                value={passenger.passenger_phone}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required
                            />
                            <FormInput
                                label="Date of Birth"
                                name="date_of_birth"
                                type="date"
                                value={passenger.date_of_birth}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required
                            />
                            <FormInput
                                label="Travel Date"
                                name="travel_date"
                                type="date"
                                value={formattedDate}
                                readOnly
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <FormInput
                                label={isInternational ? "Passport Number" : "Passport Number (Optional)"}
                                name="passport_number"
                                value={passenger.passport_number}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required={isInternational}
                            />
                            <FormInput
                                label="Frequent Flyer Number (Optional)"
                                name="frequent_flyer_number"
                                value={passenger.frequent_flyer_number}
                                onChange={(e) => handlePassengerChange(index, e)}
                                placeholder="Enter if you have one"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <FormInput
                                label={isInternational ? "Passport Issue Date" : "Passport Issue Date (Optional)"}
                                name="passport_issue_date"
                                type="date"
                                value={passenger.passport_issue_date}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required={isInternational}
                            />
                            <FormInput
                                label={isInternational ? "Passport Expiry Date" : "Passport Expiry Date (Optional)"}
                                name="passport_expiry_date"
                                type="date"
                                value={passenger.passport_expiry_date}
                                onChange={(e) => handlePassengerChange(index, e)}
                                required={isInternational}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    Payment Method
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        type="button"
                        onClick={() => setPaymentMode('WALLET')}
                        className={`relative p-4 rounded-xl border-2 flex items-start gap-4 transition-all text-left ${paymentMode === 'WALLET'
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`p-3 rounded-full ${paymentMode === 'WALLET' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Wallet size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">Trip N Roll Wallet</div>
                            <div className="text-sm text-slate-500 mt-1">
                                Pay using your wallet balance.
                                {walletData ? (
                                    <div className="mt-1 space-y-1">
                                        <span className="block font-medium text-emerald-600">
                                            Available: ₹{Number(walletData.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                        <span className="block text-[11px] font-bold text-blue-600 flex items-center gap-1">
                                            <Info size={10} />
                                            Spending Power: ₹{Number(walletData.available_spending_power).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ) : user?.profile?.wallet_balance !== undefined && (
                                    <span className="block mt-1 font-medium text-emerald-600">
                                        Available: ₹{Number(user.profile.wallet_balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </span>
                                )}
                            </div>
                        </div>
                        {paymentMode === 'WALLET' && (
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white" />
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={() => setPaymentMode('DIRECT')}
                        className={`relative p-4 rounded-xl border-2 flex items-start gap-4 transition-all text-left ${paymentMode === 'DIRECT'
                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                            : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                            }`}
                    >
                        <div className={`p-3 rounded-full ${paymentMode === 'DIRECT' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">Pay Directly</div>
                            <div className="text-sm text-slate-500 mt-1">
                                Pay via Credit/Debit Card or Netbanking (Zaakpay).
                            </div>
                        </div>
                        {paymentMode === 'DIRECT' && (
                            <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white" />
                        )}
                    </button>
                </div>
            </div>

            <button
                type="button"
                onClick={handleAddPassenger}
                className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
            >
                + Add Another Passenger
            </button>

            <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? <Loader2 className="animate-spin" /> : `Confirm Booking for ${passengers.length} Passenger${passengers.length !== 1 ? 's' : ''}`}
            </button>
        </form>
    );
}

function FormInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
    return (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <input
                {...props}
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-800 ${props.readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                    }`}
            />
        </div>
    );
}
