'use client';
import { useState, useEffect } from 'react';
import { CreateBookingData, createBooking } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface BookingFormProps {
    flightId: number;
    departureDate: string; // ISO date string from flight
    isInternational: boolean; // Whether the flight is international
    onSuccess: (bookingId: string) => void;
}

export function BookingForm({ flightId, departureDate, isInternational, onSuccess }: BookingFormProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Format departure date to YYYY-MM-DD for input field
    const formattedDate = new Date(departureDate).toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        passenger_email: '',
        passenger_phone: '',
        date_of_birth: '',
        passport_number: '',
        passport_issue_date: '',
        passport_expiry_date: '',
        frequent_flyer_number: '',
        travel_date: formattedDate,
    });

    useEffect(() => {
        if (user) {
            // Split username into first and last name if possible
            const nameParts = (user.username || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            setFormData(prev => ({
                ...prev,
                first_name: firstName,
                last_name: lastName,
                passenger_email: user.email || '',
                passenger_phone: user.profile?.phone_number || '',
                passport_number: user.profile?.passport_number || '',
                travel_date: formattedDate, // Ensure travel_date is set
            }));
        }
    }, [user, formattedDate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data: CreateBookingData = {
                flight: flightId,
                ...formData,
                // Sanitize optional fields: send undefined if empty string
                passport_number: formData.passport_number || undefined,
                passport_issue_date: formData.passport_issue_date || undefined,
                passport_expiry_date: formData.passport_expiry_date || undefined,
                frequent_flyer_number: formData.frequent_flyer_number || undefined,
                date_of_birth: formData.date_of_birth || undefined,
            };
            const booking = await createBooking(data);
            onSuccess(booking.booking_id);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                    label="First Name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label="Last Name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                    label="Email Address"
                    name="passenger_email"
                    type="email"
                    value={formData.passenger_email}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label="Phone Number"
                    name="passenger_phone"
                    type="tel"
                    value={formData.passenger_phone}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label="Date of Birth"
                    name="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={handleChange}
                    required
                />
                <FormInput
                    label="Travel Date"
                    name="travel_date"
                    type="date"
                    value={formData.travel_date}
                    onChange={handleChange}
                    readOnly
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                    label={isInternational ? "Passport Number" : "Passport Number (Optional)"}
                    name="passport_number"
                    value={formData.passport_number}
                    onChange={handleChange}
                    required={isInternational}
                />
                <FormInput
                    label="Frequent Flyer Number (Optional)"
                    name="frequent_flyer_number"
                    value={formData.frequent_flyer_number}
                    onChange={handleChange}
                    placeholder="Enter if you have one"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput
                    label={isInternational ? "Passport Issue Date" : "Passport Issue Date (Optional)"}
                    name="passport_issue_date"
                    type="date"
                    value={formData.passport_issue_date}
                    onChange={handleChange}
                    required={isInternational}
                />
                <FormInput
                    label={isInternational ? "Passport Expiry Date" : "Passport Expiry Date (Optional)"}
                    name="passport_expiry_date"
                    type="date"
                    value={formData.passport_expiry_date}
                    onChange={handleChange}
                    required={isInternational}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Confirm Booking'}
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
