const API_BASE_URL = 'http://localhost:8000/api';

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
    available_seats?: number;
    total_seats?: number;
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
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    created_at: string;
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
        usertype: 'user' | 'admin' | 'superadmin';
    }
}

export interface ContactMessage {
    name: string;
    email: string;
    message: string;
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
    if (!res.ok) throw new Error('Invalid credentials');
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

export async function register(username: string, email: string, password: string, phone_number: string, passport_number: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, phone_number, passport_number }),
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
    filters?: FlightFilters
): Promise<PaginatedResponse<Flight>> {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);
    if (returnDate) params.append('returnDate', returnDate);
    params.append('page', page.toString());

    // Add filter parameters
    if (filters) {
        if (filters.stops && filters.stops.length > 0) {
            filters.stops.forEach(stop => params.append('stops', stop));
        }
        if (filters.airlines && filters.airlines.length > 0) {
            filters.airlines.forEach(airline => params.append('airlines', airline));
        }
        if (filters.departure_time && filters.departure_time.length > 0) {
            filters.departure_time.forEach(time => params.append('departure_time', time));
        }
        if (filters.arrival_time && filters.arrival_time.length > 0) {
            filters.arrival_time.forEach(time => params.append('arrival_time', time));
        }
    }

    const res = await fetch(`${API_BASE_URL}/flights/?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch flights');
    return res.json();
}

export async function getSearchMeta(origin?: string, destination?: string): Promise<{ origins: string[], destinations: string[], dates: string[] }> {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);

    const res = await fetch(`${API_BASE_URL}/search-meta/?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch search metadata');
    return res.json();
}

export async function getAvailableAirlines(origin?: string, destination?: string, date?: string): Promise<{ airlines: string[] }> {
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (date) params.append('date', date);

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

export async function createBooking(data: CreateBookingData): Promise<Booking> {
    const res = await fetch(`${API_BASE_URL}/bookings/`, {
        method: 'POST',
        headers: getAuthHeaders(), // Use auth headers
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create booking');
    return res.json();
}

export async function getBookingHistory(email: string): Promise<Booking[]> {
    const res = await fetch(`${API_BASE_URL}/bookings/history/?email=${encodeURIComponent(email)}`, {
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

export interface AdminStats {
    total_revenue: number;
    total_bookings: number;
    active_bookings: number;
    total_flights: number;
    recent_bookings: Booking[];
}

export async function getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard/`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch admin stats');
    return res.json();
}

export async function getAdminFlights(page: number = 1, search: string = ''): Promise<PaginatedResponse<Flight>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE_URL}/admin/flights/?${params.toString()}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch flights');
    return res.json();
}

export async function bulkCreateFlights(flights: Partial<Flight>[]): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/flights/bulk/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(flights)
    });
    if (!res.ok) throw new Error('Failed to bulk upload flights');
}

export async function createFlight(data: Partial<Flight>): Promise<Flight> {
    const res = await fetch(`${API_BASE_URL}/admin/flights/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create flight');
    return res.json();
}

export async function updateFlight(id: number, data: Partial<Flight>): Promise<Flight> {
    const res = await fetch(`${API_BASE_URL}/admin/flights/${id}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update flight');
    return res.json();
}

export async function deleteFlight(id: number): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/admin/flights/${id}/`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete flight');
}

export async function getAdminBookings(): Promise<Booking[]> {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const data: PaginatedResponse<Booking> = await res.json();
    return data.results;
}

export async function updateBookingStatus(bookingId: string, status: string): Promise<Booking> {
    const res = await fetch(`${API_BASE_URL}/admin/bookings/${bookingId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Failed to update booking status');
    return res.json();
}
