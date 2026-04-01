const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Flight {
    id: number;
    airline: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    duration: string;
    price: string;
    stops: number;
    stop_details?: string;
    available_seats?: number;
    is_hidden?: boolean;
}

export interface Booking {
    id: number;
    flight_details: Flight;
    first_name: string;
    last_name: string;
    passenger_email: string;
    passenger_phone: string;
    date_of_birth?: string;
    passport_number?: string;
    passport_issue_date?: string;
    passport_expiry_date?: string;
    frequent_flyer_number?: string;
    travel_date: string;
    booking_id: string;
    booking_group?: string;
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'REFUND_REQUESTED' | 'REFUNDED';
    created_at: string;
    pnr?: string | null;
    payment_mode?: 'WALLET' | 'DIRECT';
}

export interface CreateBookingData {
    flight: number;
    first_name: string;
    last_name: string;
    passenger_email: string;
    passenger_phone: string;
    date_of_birth?: string;
    passport_number?: string;
    passport_issue_date?: string;
    passport_expiry_date?: string;
    frequent_flyer_number?: string;
    travel_date: string;
    payment_mode?: 'WALLET';
}

export interface CreateMultiBookingData {
    flight: number;
    travel_date: string;
    passengers: Omit<CreateBookingData, 'flight' | 'travel_date'>[];
}

export interface User {
    id: number;
    username: string;
    email: string;
    is_staff: boolean;
    is_superuser: boolean;
    profile: {
        phone_number: string;
        passport_number: string;
        address: string;
        wallet_balance?: number;
        credit_limit?: number;
        total_dues?: number;
        aadhar_number?: string;
        pan_number?: string;
        kyc_status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
    }
}

export interface ContactMessage {
    name: string;
    email: string;
    message: string;
}

export interface WalletData {
    wallet_balance: number;
    credit_limit: number;
    total_dues: number;
    available_spending_power: number;
    recent_transactions: WalletTransaction[];
}

export interface WalletTransaction {
    id: number;
    amount: string;
    transaction_type: 'CREDIT' | 'DEBIT';
    description: string;
    timestamp: string;
    balance_after: string;
    dues_after: string;
}

export interface TopUpRequest {
    id: number;
    amount: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    created_at: string;
    updated_at: string;
}

export async function getWalletBalance(): Promise<WalletData> {
    const res = await fetch(`${API_BASE_URL}/wallet/balance/`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch wallet balance');
    return res.json();
}

export async function topUpWallet(amount: number): Promise<{ message: string, request_id: number, amount: string, status: string }> {
    const res = await fetch(`${API_BASE_URL}/wallet/top-up/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Failed to top up wallet');
    return res.json();
}

export async function getTopUpRequests(): Promise<TopUpRequest[]> {
    const res = await fetch(`${API_BASE_URL}/wallet/top-up-requests/`, {
        headers: getAuthHeaders(),
        cache: 'no-store'
    });
    if (!res.ok) throw new Error('Failed to fetch top-up requests');
    const data: PaginatedResponse<TopUpRequest> = await res.json();
    return data.results;
}


// Helper to get token (only works on client side)
function getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Authorization'] = `Token ${token}`;
    }
    return headers;
}

export async function login(username: string, password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE_URL}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Invalid credentials');
    }
    return res.json();
}

export async function getUserProfile(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/profile/`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
}

export async function updateProfile(data: { phone_number?: string; passport_number?: string; address?: string }): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/profile/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
}

export async function register(username: string, email: string, password: string, phone_number: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone_number }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Registration failed');
    }
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface FlightFilters {
    stops?: string[];
    airlines?: string[];
    departure_time?: string[];
    arrival_time?: string[];
}

export async function getFlights(
    origin?: string,
    destination?: string,
    date?: string,
    returnDate?: string,
    page: number = 1,
    filters: any = {},
    passengers?: number
): Promise<PaginatedResponse<Flight>> {
    const params = new URLSearchParams({
        page: page.toString(),
    });

    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (returnDate) params.append('returnDate', returnDate);
    if (passengers) params.append('passengers', passengers.toString());

    // Add filter parameters
    if (filters) {
        if (filters.stops && filters.stops.length > 0) {
            filters.stops.forEach((stop: string) => params.append('stops', stop));
        }
        if (filters.airlines && filters.airlines.length > 0) {
            filters.airlines.forEach((airline: string) => params.append('airlines', airline));
        }
        if (filters.departure_time && filters.departure_time.length > 0) {
            filters.departure_time.forEach((time: string) => params.append('departure_time', time));
        }
        if (filters.arrival_time && filters.arrival_time.length > 0) {
            filters.arrival_time.forEach((time: string) => params.append('arrival_time', time));
        }
    }

    const res = await fetch(`${API_BASE_URL}/flights/?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch flights');
    return res.json();
}

export async function getSearchMeta(origin?: string, destination?: string, passengers?: number): Promise<{ origins: string[], destinations: string[], dates: string[], return_dates: string[] }> {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (passengers) params.append('passengers', passengers.toString());

    const res = await fetch(`${API_BASE_URL}/search-meta/?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch search metadata');
    return res.json();
}

export async function getAvailableAirlines(origin?: string, destination?: string, date?: string, passengers?: number): Promise<{ airlines: string[] }> {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (passengers) params.append('passengers', passengers.toString());

    const res = await fetch(`${API_BASE_URL}/available-airlines/?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch available airlines');
    return res.json();
}

export async function getFlightById(id: number | string): Promise<Flight | undefined> {
    if (!id) return undefined;
    const res = await fetch(`${API_BASE_URL}/flights/?id=${id}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const data: PaginatedResponse<Flight> = await res.json();
    return data.results[0];
}

export async function createBooking(data: CreateBookingData | CreateMultiBookingData): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: getAuthHeaders(), // Use auth headers
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        if (errorData) {
            throw new Error(JSON.stringify(errorData));
        }
        throw new Error('Failed to create booking');
    }
    return res.json();
}

export async function getBookingHistory(email?: string): Promise<Booking[]> {
    const url = email
        ? `${API_BASE_URL}/bookings/history/?email=${encodeURIComponent(email)}`
        : `${API_BASE_URL}/bookings/history/`;

    const res = await fetch(url, {
        cache: 'no-store',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch booking history');
    const data: PaginatedResponse<Booking> = await res.json();
    return data.results;
}

export async function submitContactMessage(data: ContactMessage): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/contact/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to submit message');
}

export async function requestRefund(bookingId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/bookings/refund/${bookingId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to request refund');
    }
}


export async function submitKYC(aadhar_number: string, pan_number: string): Promise<{ message: string, kyc_status: string }> {
    const res = await fetch(`${API_BASE_URL}/kyc/submit/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ aadhar_number, pan_number }),
    });
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to submit KYC');
    }
    return res.json();
}
