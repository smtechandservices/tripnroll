'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Calendar, ChevronDown, X, Users } from 'lucide-react';
import airports from '@/assets/airports.json';
import DatePicker from 'react-datepicker';
import { getSearchMeta } from '@/lib/api';

interface SearchFormProps {
    initialOrigin?: string;
    initialDestination?: string;
    initialDate?: string;
    initialReturnDate?: string;
    initialTripType?: 'one-way' | 'round-trip';
    initialPassengers?: number;
}

export function SearchForm({
    initialOrigin = '',
    initialDestination = '',
    initialDate,
    initialReturnDate,
    initialTripType = 'one-way',
    initialPassengers = 1
}: SearchFormProps) {
    const router = useRouter();
    const [originQuery, setOriginQuery] = useState(initialOrigin);
    const [destQuery, setDestQuery] = useState(initialDestination);
    const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
    const [showDestSuggestions, setShowDestSuggestions] = useState(false);
    const [showDepartureOptions, setShowDepartureOptions] = useState(false);
    const [showReturnOptions, setShowReturnOptions] = useState(false);
    const [tripType, setTripType] = useState<'one-way' | 'round-trip'>(initialTripType);
    const [passengers, setPassengers] = useState<number | string>(initialPassengers);

    // Parse initial dates
    const parseDate = (d?: string) => {
        if (!d) return null;
        const [y, m, day] = d.split('-').map(Number);
        return new Date(y, m - 1, day);
    };

    const [departureDate, setDepartureDate] = useState<Date | null>(parseDate(initialDate));
    const [returnDate, setReturnDate] = useState<Date | null>(parseDate(initialReturnDate));

    // Metadata for filtering
    const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
    const [availableDestinations, setAvailableDestinations] = useState<string[]>([]);
    const [availableDates, setAvailableDates] = useState<Date[]>([]);

    const fetchMetadata = (origin?: string, dest?: string) => {
        getSearchMeta(origin, dest).then(data => {
            // Only update what we need based on context to avoid clearing user's current valid selection view
            // actually, we should update everything that is downstream.

            if (!origin) setAvailableOrigins(data.origins);
            // Always update destinations if origin changes or on load
            setAvailableDestinations(data.destinations);

            const dates = data.dates.map(d => {
                const [y, m, dstr] = d.split('-').map(Number);
                return new Date(y, m - 1, dstr);
            });
            setAvailableDates(dates);
        }).catch(err => console.error(err));
    };

    // Validate selected dates when available dates change
    useEffect(() => {
        if (departureDate && availableDates.length > 0) {
            const isValid = availableDates.some(d => d.toDateString() === departureDate.toDateString());
            if (!isValid) {
                setDepartureDate(null);
                setReturnDate(null);
            }
        }
    }, [availableDates, departureDate]);

    useEffect(() => {
        fetchMetadata(initialOrigin, initialDestination);
    }, []);

    interface Airport {
        code: string;
        name: string;
        city: string;
        country: string;
    }

    const filterAirports = (query: string, availableCodes: string[]): Airport[] => {
        if (!query) return [];
        const lower = query.toLowerCase();
        return (airports as Airport[])
            .filter(a => availableCodes.includes(a.code)) // Filter by availability
            .filter((a) =>
                a.city.toLowerCase().includes(lower) ||
                a.code.toLowerCase().includes(lower) ||
                a.name.toLowerCase().includes(lower)
            );
    };

    const originSuggestions = filterAirports(originQuery, availableOrigins);
    const destSuggestions = filterAirports(destQuery, availableDestinations);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams();
        if (originQuery) params.append('origin', originQuery);
        if (destQuery) params.append('destination', destQuery);
        params.append('passengers', (parseInt(passengers as string) || 1).toString());

        if (departureDate) {
            // Format as YYYY-MM-DD manually to avoid timezone issues with toISOString
            const year = departureDate.getFullYear();
            const month = String(departureDate.getMonth() + 1).padStart(2, '0');
            const day = String(departureDate.getDate()).padStart(2, '0');
            params.append('date', `${year}-${month}-${day}`);
        }

        if (tripType === 'round-trip' && returnDate) {
            const year = returnDate.getFullYear();
            const month = String(returnDate.getMonth() + 1).padStart(2, '0');
            const day = String(returnDate.getDate()).padStart(2, '0');
            params.append('returnDate', `${year}-${month}-${day}`);
        }

        router.push(`/search?${params.toString()}`);
    };

    const handleSelectOrigin = (code: string, city: string) => {
        setOriginQuery(code);
        setShowOriginSuggestions(false);
        // Reset downstream selections
        setDestQuery('');
        setDepartureDate(null);
        setReturnDate(null);

        // Cascading update: When origin is selected, fetch compatible destinations and dates
        fetchMetadata(code, '');
    };

    const handleSelectDest = (code: string, city: string) => {
        setDestQuery(code);
        setShowDestSuggestions(false);
        fetchMetadata(originQuery, code);
    };

    const handleClear = () => {
        setOriginQuery('');
        setDestQuery('');
        setDepartureDate(null);
        setReturnDate(null);
        setTripType('one-way');
        router.push('/search');
    };

    return (
        <form onSubmit={handleSearch} className="bg-white p-6 md:p-12 rounded-3xl shadow-xl flex flex-col md:flex-row items-center gap-6 md:gap-8 max-w-9xl mx-auto -mt-16 relative z-10 border border-slate-700">
            {/* Clear Search Button */}
            {(initialOrigin || initialDestination || initialDate) && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute -top-14 right-4 px-6 py-3 rounded-t-xl font-bold text-base transition-colors cursor-pointer bg-red-500 text-white hover:bg-red-600 shadow-lg flex items-center gap-2"
                    title="Clear search and start over"
                >
                    <X className="w-4 h-4" />
                    Clear Search
                </button>
            )}

            {/* Trip Type Tabs */}
            <div className="absolute -top-14 left-4 flex space-x-2">
                <button
                    type="button"
                    onClick={() => setTripType('one-way')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-colors cursor-pointer ${tripType === 'one-way'
                        ? 'bg-white text-green-600 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                        }`}
                >
                    One Way
                </button>
                <button
                    type="button"
                    onClick={() => setTripType('round-trip')}
                    className={`px-8 py-3 rounded-t-xl font-bold text-base transition-colors cursor-pointer ${tripType === 'round-trip'
                        ? 'bg-white text-green-600 shadow-lg'
                        : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm'
                        }`}
                >
                    Round Trip
                </button>
            </div>

            {/* Origin Input */}
            <div className="flex-1 w-full relative">
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center space-x-3 border border-slate-200 focus-within:border-green-400 transition-colors">
                    <MapPin className="text-slate-400" />
                    <div className="flex-1">
                        <label className="block text-base font-semibold text-slate-400 uppercase tracking-wider">From</label>
                        <input
                            type="text"
                            placeholder="City or Airport"
                            className="w-full bg-transparent outline-none text-slate-800 font-medium text-xl"
                            value={originQuery}
                            onChange={(e) => { setOriginQuery(e.target.value); setShowOriginSuggestions(true); }}
                            onFocus={() => setShowOriginSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                        />
                    </div>
                </div>
                {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 mt-2 max-h-60 overflow-y-auto z-50">
                        {originSuggestions.map((airport: Airport) => (
                            <div
                                key={airport.code}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectOrigin(airport.code, airport.city); }}
                            >
                                <div className="font-bold text-slate-800">{airport.city} ({airport.code})</div>
                                <div className="text-xs text-slate-500">{airport.name}, {airport.country}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Destination Input */}
            <div className="flex-1 w-full relative">
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center space-x-3 border border-slate-200 focus-within:border-blue-400 transition-colors">
                    <MapPin className="text-slate-400" />
                    <div className="flex-1">
                        <label className="block text-base font-semibold text-slate-400 uppercase tracking-wider">To</label>
                        <input
                            type="text"
                            placeholder="City or Airport"
                            className="w-full bg-transparent outline-none text-slate-800 font-medium text-xl"
                            value={destQuery}
                            onChange={(e) => { setDestQuery(e.target.value); setShowDestSuggestions(true); }}
                            onFocus={() => setShowDestSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowDestSuggestions(false), 200)}
                        />
                    </div>
                </div>
                {showDestSuggestions && destSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 mt-2 max-h-60 overflow-y-auto z-50">
                        {destSuggestions.map((airport: Airport) => (
                            <div
                                key={airport.code}
                                className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                                onMouseDown={(e) => { e.preventDefault(); handleSelectDest(airport.code, airport.city); }}
                            >
                                <div className="font-bold text-slate-800">{airport.city} ({airport.code})</div>
                                <div className="text-xs text-slate-500">{airport.name}, {airport.country}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Date Inputs */}
            <div className="flex-1 w-full flex gap-2">
                {/* Departure Dropdown */}
                <div className="flex-1 w-full relative">
                    <div
                        className="bg-slate-50 p-6 rounded-2xl flex items-center space-x-3 border border-slate-200 focus-within:border-green-400 transition-colors cursor-pointer group"
                        onClick={() => { setShowDestSuggestions(false); setShowOriginSuggestions(false); setShowDepartureOptions(!showDepartureOptions); }}
                    >
                        <Calendar className="text-slate-400 group-hover:text-green-500 transition-colors" size={20} />
                        <div className="flex-1 min-w-0">
                            <label className="block text-base font-semibold text-slate-400 uppercase tracking-wider cursor-pointer">Departure</label>
                            <div className="text-slate-800 font-medium truncate text-xl">
                                {departureDate
                                    ? departureDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                    : <span className="text-slate-400">{availableDates.length > 0 ? "Select Date" : "No dates"}</span>
                                }
                            </div>
                        </div>
                        <ChevronDown className={`text-slate-400 w-4 h-4 transition-transform ${showDepartureOptions ? 'rotate-180' : ''}`} />
                    </div>

                    {showDepartureOptions && (
                        <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 mt-2 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                            {availableDates.length > 0 ? (
                                availableDates.map(date => {
                                    const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                    const isSelected = departureDate?.toDateString() === date.toDateString();
                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDepartureDate(date);
                                                setShowDepartureOptions(false);
                                            }}
                                        >
                                            <span className="font-medium">{dateStr}</span>
                                            {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-4 text-center text-slate-400 text-sm italic">No dates available</div>
                            )}
                        </div>
                    )}

                    {/* Backdrop to close dropdown */}
                    {showDepartureOptions && (
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowDepartureOptions(false)} />
                    )}
                </div>

                {tripType === 'round-trip' && (
                    <div className="flex-1 w-full relative animate-in fade-in zoom-in duration-200">
                        <div
                            className={`bg-slate-50 p-6 rounded-2xl flex items-center space-x-3 border border-slate-200 transition-colors cursor-pointer group ${!departureDate ? 'opacity-50 cursor-not-allowed' : 'focus-within:border-green-400'}`}
                            onClick={() => {
                                if (!departureDate) return;
                                setShowDestSuggestions(false);
                                setShowOriginSuggestions(false);
                                setShowReturnOptions(!showReturnOptions);
                            }}
                        >
                            <Calendar className="text-slate-400 group-hover:text-green-500 transition-colors" size={20} />
                            <div className="flex-1 min-w-0">
                                <label className="block text-base font-semibold text-slate-400 uppercase tracking-wider cursor-pointer">Return</label>
                                <div className="text-slate-800 font-medium truncate text-xl">
                                    {returnDate
                                        ? returnDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                                        : <span className="text-slate-400">Select Date</span>
                                    }
                                </div>
                            </div>
                            <ChevronDown className={`text-slate-400 w-4 h-4 transition-transform ${showReturnOptions ? 'rotate-180' : ''}`} />
                        </div>

                        {showReturnOptions && (
                            <div className="absolute top-full left-0 right-0 bg-white rounded-xl shadow-xl border border-slate-100 mt-2 max-h-60 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                                {availableDates
                                    .filter(d => !departureDate || d >= departureDate)
                                    .map(date => {
                                        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                                        const isSelected = returnDate?.toDateString() === date.toDateString();
                                        return (
                                            <div
                                                key={date.toISOString()}
                                                className={`px-4 py-3 cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                                                    }`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReturnDate(date);
                                                    setShowReturnOptions(false);
                                                }}
                                            >
                                                <span className="font-medium">{dateStr}</span>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                            </div>
                                        );
                                    })}
                            </div>
                        )}

                        {/* Backdrop to close dropdown */}
                        {showReturnOptions && (
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setShowReturnOptions(false)} />
                        )}
                    </div>
                )}
            </div>

            {/* Passengers Input */}
            <div className="w-full md:w-48 relative">
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center space-x-3 border border-slate-200 focus-within:border-green-400 transition-colors">
                    <Users className="text-slate-400" />
                    <div className="flex-1">
                        <label className="block text-base font-semibold text-slate-400 uppercase tracking-wider">Passengers</label>
                        <input
                            type="number"
                            min="1"
                            max="9"
                            className="w-full bg-transparent outline-none text-slate-800 font-medium text-xl"
                            value={passengers}
                            onChange={(e) => setPassengers(e.target.value)}
                            onBlur={() => {
                                if (passengers === '' || parseInt(passengers as string) < 1) {
                                    setPassengers(1);
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <button type="submit" className="cursor-pointer w-full md:w-auto h-24 px-12 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-2xl hover:shadow-lg hover:shadow-green-600/30 transition-all flex items-center justify-center space-x-2">
                <Search size={24} />
                <span>Search</span>
            </button>
        </form>
    );
}
