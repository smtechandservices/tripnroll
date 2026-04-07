'use client';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { CreateBookingData, createBooking, getWalletBalance, WalletData } from '@/lib/api';
import { Loader2, Wallet, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';

const calculateAge = (dateString: string): number | null => {
    if (!dateString) return null;
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

interface BookingFormProps {
    flightId: number;
    departureDate: string; // ISO date string from flight
    isInternational: boolean; // Whether the flight is international
    onSuccess: (bookingId: string) => void;
    onPassengersChange?: (counts: { adults: number; infants: number }) => void;
}

export function BookingForm({ flightId, departureDate, isInternational, onSuccess, onPassengersChange }: BookingFormProps) {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [paymentMode, setPaymentMode] = useState<'WALLET'>('WALLET');
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

    const [primaryPassengerIndex, setPrimaryPassengerIndex] = useState(0);

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
            let adults = 0;
            let infants = 0;
            passengers.forEach(p => {
                const age = calculateAge(p.date_of_birth);
                // Child is > 2, Infant is <= 2
                // We charge child/adult same, so adults count = count of people > 2
                if (age !== null && age <= 2) {
                    infants++;
                } else {
                    adults++;
                }
            });
            onPassengersChange({ adults, infants });
        }
    }, [passengers]); // intentional removal of onPassengersChange from deps to avoid infinite loop with parent arrow functions

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
            };
            setPassengers(newPassengers);
        }
    }, [user]);

    // Ensure primary passenger is never an infant
    useEffect(() => {
        const currentPrimary = passengers[primaryPassengerIndex];
        if (currentPrimary) {
            const age = calculateAge(currentPrimary.date_of_birth);
            const isInfant = age !== null && age <= 2;
            
            if (isInfant) {
                // Find the first non-infant to be the primary passenger
                const firstNonInfantIndex = passengers.findIndex(p => {
                    const a = calculateAge(p.date_of_birth);
                    return a === null || a > 2;
                });
                
                if (firstNonInfantIndex !== -1 && firstNonInfantIndex !== primaryPassengerIndex) {
                    setPrimaryPassengerIndex(firstNonInfantIndex);
                }
            }
        }
    }, [passengers, primaryPassengerIndex]);

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

    const handleAddInfant = () => {
        const today = new Date();
        // Set default DOB to today to mark as infant immediately
        const infantDOB = today.toISOString().split('T')[0];
        setPassengers([...passengers, {
            first_name: '',
            last_name: '',
            passenger_email: '',
            passenger_phone: '',
            date_of_birth: infantDOB,
            passport_number: '',
            passport_issue_date: '',
            passport_expiry_date: '',
            frequent_flyer_number: '',
        }]);
    };

    const handleRemovePassenger = (index: number) => {
        if (passengers.length > 1) {
            setPassengers(passengers.filter((_, i) => i !== index));
            if (primaryPassengerIndex === index) {
                setPrimaryPassengerIndex(0);
            } else if (primaryPassengerIndex > index) {
                setPrimaryPassengerIndex(prev => prev - 1);
            }
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

        let hasAdult = false;
        for (const p of passengers) {
            const age = calculateAge(p.date_of_birth);
            if (age !== null && age >= 18) {
                hasAdult = true;
                break;
            }
        }

        if (!hasAdult) {
            if (passengers.length === 1) {
                await Swal.fire({
                    icon: 'error',
                    title: 'Age Restriction',
                    text: 'The passenger must be 18 years or older to book.',
                    confirmButtonColor: '#2563eb',
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl px-6 py-3 font-bold'
                    }
                });
                return;
            } else {
                await Swal.fire({
                    icon: 'error',
                    title: 'Age Restriction',
                    text: 'At least one passenger must be 18 years or older when booking for multiple passengers.',
                    confirmButtonColor: '#2563eb',
                    customClass: {
                        popup: 'rounded-3xl',
                        confirmButton: 'rounded-xl px-6 py-3 font-bold'
                    }
                });
                return;
            }
        }

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
            const primaryPassenger = passengers[primaryPassengerIndex] || passengers[0];
            const data = {
                flight: flightId,
                travel_date: formattedDate,
                payment_mode: paymentMode,
                passengers: passengers.map(p => {
                    const age = calculateAge(p.date_of_birth);
                    const isInfant = age !== null && age <= 2;
                    
                    return {
                        ...p,
                        passenger_email: isInfant ? (p.passenger_email || undefined) : p.passenger_email,
                        passenger_phone: isInfant ? (p.passenger_phone || undefined) : p.passenger_phone,
                        passport_number: p.passport_number || undefined,
                        passport_issue_date: p.passport_issue_date || undefined,
                        passport_expiry_date: p.passport_expiry_date || undefined,
                        frequent_flyer_number: p.frequent_flyer_number || undefined,
                        date_of_birth: p.date_of_birth || undefined,
                    };
                })
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
                {passengers.map((passenger, index) => {
                    const age = calculateAge(passenger.date_of_birth);
                    const isInfant = age !== null && age <= 2;

                    return (
                        <div key={index} className="relative p-6 bg-slate-50/50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                                    <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                        {index + 1}
                                    </span>
                                    Passenger Information
                                    {isInfant && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase tracking-wider rounded border border-blue-200 font-bold ml-1">
                                            Infant (FREE)
                                        </span>
                                    )}
                                </h3>
                                {passengers.length > 1 && !isInfant && (
                                    <label className="flex items-center gap-2 ml-4 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="primary_passenger"
                                            checked={primaryPassengerIndex === index}
                                            onChange={() => setPrimaryPassengerIndex(index)}
                                            className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                        />
                                        <span className="text-sm font-bold text-blue-600">Primary Passenger</span>
                                    </label>
                                )}
                            <div className="ml-auto">
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

                        {!isInfant && (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <FormInput
                                        label={index === primaryPassengerIndex ? "Email Address (For Booking Confirmation)" : "Email Address"}
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
                            </>
                        )}
                    </div>
                    );
                })}
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-200">
                <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                    Payment Method
                </h3>
                <div className="grid grid-cols-1 gap-4">
                    <div
                        className={`relative p-4 rounded-xl border-2 flex items-start gap-4 transition-all text-left border-blue-500 bg-blue-50/50 ring-1 ring-blue-500`}
                    >
                        <div className={`p-3 rounded-full bg-blue-100 text-blue-600`}>
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
                        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-blue-500 ring-2 ring-white" />
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    type="button"
                    onClick={handleAddPassenger}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                >
                    + Add Passenger
                </button>
                <button
                    type="button"
                    onClick={handleAddInfant}
                    className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:border-pink-400 hover:text-pink-500 hover:bg-pink-50/30 transition-all flex items-center justify-center gap-2"
                >
                    + Add Infant (0-2 Yrs)
                </button>
            </div>

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
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label} {props.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                {...props}
                className={`w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-slate-800 ${props.readOnly ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'
                    }`}
            />
        </div>
    );
}
