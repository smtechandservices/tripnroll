'use client';

import { useEffect, useState } from 'react';
import { getAdminFlights, createFlight, updateFlight, deleteFlight, bulkCreateFlights, Flight } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, X, FileDigit, Download, Eye, EyeOff } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

// Helper to format ISO to dd/mm/yyyy
const formatDateToDDMMYYYY = (isoString: string | undefined) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
};

// Helper to parse dd/mm/yyyy to yyyy-mm-dd
const parseDDMMYYYYToYYYYMMDD = (dateStr: string) => {
    if (!dateStr || !dateStr.includes('/')) return null;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const [d, m, y] = parts;
        if (y.length === 4 && d.length <= 2 && m.length <= 2) {
            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        }
    }
    return null;
};

// Helper to safely get parts from ISO string without throwing RangeError
const getISOPart = (isoString: string | undefined, part: 'date' | 'time') => {
    if (!isoString) return part === 'date' ? new Date().toISOString().split('T')[0] : '00:00';
    
    // First try simple string split to avoid timezone/Date object issues
    const split = isoString.split('T');
    if (split.length === 2) {
        if (part === 'date') return split[0];
        const timePart = split[1].slice(0, 5);
        if (/^\d{2}:\d{2}$/.test(timePart)) return timePart;
    }

    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return part === 'date' ? new Date().toISOString().split('T')[0] : '00:00';
        const fullISO = date.toISOString();
        if (part === 'date') return fullISO.split('T')[0];
        return fullISO.split('T')[1].slice(0, 5);
    } catch {
        return part === 'date' ? new Date().toISOString().split('T')[0] : '00:00';
    }
};

export default function AdminFlightsPage() {
    const [flights, setFlights] = useState<Flight[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
    const [bookedCount, setBookedCount] = useState(0);

    // Form state
    const [formData, setFormData] = useState<Partial<Flight>>({});
    const [modalDateStrings, setModalDateStrings] = useState({ departure: '', arrival: '' });

    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1); // Reset to first page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchFlights(currentPage, debouncedSearch);
    }, [currentPage, debouncedSearch]);

    const fetchFlights = async (page: number, search: string = '') => {
        try {
            setLoading(true);
            const data = await getAdminFlights(page, search);
            setFlights(data.results);
            setTotalCount(data.count);
        } catch (error) {
            console.error('Failed to fetch flights', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteFlight(id);
                fetchFlights(currentPage); // Refresh current page
                Swal.fire(
                    'Deleted!',
                    'The flight has been deleted.',
                    'success'
                );
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: 'Failed to delete flight.',
                });
            }
        }
    };

    const openModal = (flight?: Flight) => {
        if (flight) {
            setEditingFlight(flight);
            setFormData(flight);
            setModalDateStrings({
                departure: formatDateToDDMMYYYY(flight.departure_time),
                arrival: formatDateToDDMMYYYY(flight.arrival_time)
            });
            // Calculate booked count: Total - Available
            const available = flight.available_seats || 0;
            const total = flight.total_seats || 0;
            setBookedCount(total - available);
        } else {
            setEditingFlight(null);
            setBookedCount(0);
            setFormData({
                airline: '',
                flight_number: '',
                origin: '',
                destination: '',
                price: '',
                infant_price: '0',
                stops: 0,
                stop_details: '',
                total_seats: 150,
                available_seats: 150,
                is_hidden: false,
                pnr: '',
                baggage_allowance: '',
                layover_duration: ''
            });
            setModalDateStrings({ departure: '', arrival: '' });
        }
        setIsModalOpen(true);
    };

    const toggleVisibility = async (flight: Flight) => {
        try {
            const newHiddenStatus = !flight.is_hidden;
            await updateFlight(flight.id, { is_hidden: newHiddenStatus });
            setFlights(flights.map(f => f.id === flight.id ? { ...f, is_hidden: newHiddenStatus } : f));
            
            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true,
            });

            Toast.fire({
                icon: 'success',
                title: `Flight ${newHiddenStatus ? 'hidden' : 'visible'}`
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update visibility.',
            });
        }
    };

    const handleTotalSeatsChange = (val: number) => {
        const total = Math.max(bookedCount, val);
        setFormData({
            ...formData,
            total_seats: total,
            available_seats: total - bookedCount
        });
    };

    const handleAvailableSeatsChange = (val: number) => {
        const available = Math.max(0, val);
        setFormData({
            ...formData,
            available_seats: available,
            total_seats: available + bookedCount
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await Swal.fire({
            title: `Are you sure you want to ${editingFlight ? 'update' : 'create'} this flight?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: editingFlight ? 'Yes, update' : 'Yes, create',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
        });

        if (!result.isConfirmed) return;

        try {
            if (editingFlight) {
                await updateFlight(editingFlight.id, formData);
            } else {
                await createFlight(formData);
            }
            setIsModalOpen(false);
            fetchFlights(currentPage);
            Swal.fire({
                icon: 'success',
                title: editingFlight ? 'Flight Updated' : 'Flight Created',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: 'Failed to save flight details.',
            });
        }
    };


    const downloadSampleExcel = () => {
        const sampleData = [
            {
                airline: 'Indigo',
                flight_number: '6E-2134',
                origin: 'DEL',
                destination: 'BOM',
                departure_date: '25/10/2026',
                departure_time: '14:30:00',
                arrival_date: '25/10/2026',
                arrival_time: '16:45:00',
                duration: '02:15:00',
                price: 5500,
                infant_price: 500,
                stops: 0,
                stop_details: '',
                total_seats: 180,
                pnr: 'DELBOM123',
                baggage_allowance: '15kg Cabin / 7kg Hand',
                layover_duration: '',
                'Departure Terminal': '3',
                'Arrival Terminal': '1'
            },
            {
                airline: 'Air India',
                flight_number: 'AI-101',
                origin: 'BOM',
                destination: 'LHR',
                departure_date: '26/10/2026',
                departure_time: '02:00:00',
                arrival_date: '26/10/2026',
                arrival_time: '07:30:00',
                duration: '09:00:00',
                price: 45000,
                infant_price: 4500,
                stops: 1,
                stop_details: 'DXB',
                total_seats: 250,
                pnr: 'BOMLHR999',
                baggage_allowance: '25kg Cabin / 7kg Hand',
                layover_duration: '2h 30m',
                'Departure Terminal': '2',
                'Arrival Terminal': '4'
            }
        ];

        const ws = XLSX.utils.json_to_sheet(sampleData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Flights Template");
        XLSX.writeFile(wb, "tripnroll_flights_template.xlsx");
    };

    const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    throw new Error('Excel file is empty');
                }

                // Helper to parse dd/mm/yyyy to yyyy-mm-dd
                const parseDateStr = (dateStr: any) => {
                    if (!dateStr) return '';
                    if (typeof dateStr === 'string' && dateStr.includes('/')) {
                        const parts = dateStr.split('/');
                        if (parts.length === 3) {
                            const [d, m, y] = parts;
                            return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }
                    }
                    return dateStr;
                };

                // Map Excel data to Flight fields
                const flightsToCreate = data.map((item: any) => {
                    const depDate = parseDateStr(item.departure_date);
                    const arrDate = parseDateStr(item.arrival_date);
                    
                    return {
                        airline: item.airline || '',
                        flight_number: item.flight_number || '',
                        origin: item.origin || '',
                        destination: item.destination || '',
                        departure_time: (depDate && item.departure_time) ? `${depDate}T${item.departure_time}Z` : item.departure_time || '',
                        arrival_time: (arrDate && item.arrival_time) ? `${arrDate}T${item.arrival_time}Z` : item.arrival_time || '',
                        duration: item.duration || '',
                        price: item.price || 0,
                        infant_price: item.infant_price ?? 0,
                        stops: item.stops || 0,
                        stop_details: item.stop_details || '',
                        total_seats: item.total_seats || 150,
                        pnr: item.pnr || '',
                        baggage_allowance: item.baggage_allowance || '',
                        layover_duration: item.layover_duration || '',
                        departure_terminal: item['Departure Terminal'] || item.departure_terminal || '',
                        arrival_terminal: item['Arrival Terminal'] || item.arrival_terminal || ''
                    };
                });

                await bulkCreateFlights(flightsToCreate);
                fetchFlights(currentPage, debouncedSearch);
                Swal.fire({
                    icon: 'success',
                    title: 'Upload Successful',
                    text: `Created ${flightsToCreate.length} flights!`,
                    timer: 3000
                });
            } catch (error: any) {
                console.error('Excel parse failed', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Upload Failed',
                    text: error.message || 'Error processing Excel file'
                });
            } finally {
                // Reset file input
                e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className='pt-8'>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Flight Management</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search flights..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-slate-700 pl-10 pr-4 py-2 border border-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={downloadSampleExcel}
                            className="cursor-pointer flex items-center gap-2 border border-slate-400 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
                        >
                            <Download className="w-5 h-5" />
                            Download Sample
                        </button>
                        <input
                            type="file"
                            id="excel-upload"
                            accept=".xlsx, .xls"
                            className="hidden"
                            onChange={handleExcelUpload}
                        />
                        <button
                            onClick={() => document.getElementById('excel-upload')?.click()}
                            className="cursor-pointer flex items-center gap-2 border border-slate-400 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition"
                        >
                            <FileDigit className="w-5 h-5" />
                            Upload Excel
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition border border-slate-400"
                        >
                            <Plus className="w-5 h-5" />
                            Add Flight
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500">Airline</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Route</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Dep. Date</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Dep. Time</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Price</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Seats</th>
                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Searching flights...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : flights.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No flights found matching your search.
                                </td>
                            </tr>
                        ) : (
                            flights.map((flight) => (
                                <tr key={flight.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{flight.airline}</div>
                                        <div className="text-slate-500 text-xs">{flight.flight_number}</div>
                                        {flight.departure_terminal && <div className="text-[10px] text-blue-500">T{flight.departure_terminal}</div>}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex flex-col">
                                            <span>{flight.origin} → {flight.destination}</span>
                                            <div className="text-[10px] text-slate-500">
                                                {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop(s)`}
                                                {flight.stops > 0 && flight.stop_details && <span className="ml-1">via {flight.stop_details}</span>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {formatDateToDDMMYYYY(flight.departure_time)}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(flight.departure_time).toLocaleTimeString([], { hour12: false })}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        ₹{parseFloat(flight.price).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {flight.available_seats !== undefined ? flight.available_seats : '-'} / {flight.total_seats || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleVisibility(flight)}
                                            className={`p-1 rounded mr-2 transition-colors ${flight.is_hidden ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}`}
                                            title={flight.is_hidden ? "Show Flight" : "Hide Flight"}
                                        >
                                            {flight.is_hidden ? <EyeOff className="cursor-pointer w-4 h-4" /> : <Eye className="cursor-pointer w-4 h-4" />}
                                        </button>
                                        <button
                                            onClick={() => openModal(flight)}
                                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 mr-2"
                                        >
                                            <Edit2 className="cursor-pointer w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(flight.id)}
                                            className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="cursor-pointer w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                        Page {currentPage} of {Math.max(1, totalPages)} ({totalCount} flights)
                    </span>
                    <div className="text-slate-700 flex gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage >= totalPages}
                            className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingFlight ? 'Edit Flight' : 'Add New Flight'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="cursor-pointerw-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Airline</label>
                                    <input
                                        type="text"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.airline || ''}
                                        onChange={e => setFormData({ ...formData, airline: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Flight Number</label>
                                    <input
                                        type="text"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.flight_number || ''}
                                        onChange={e => setFormData({ ...formData, flight_number: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Origin</label>
                                    <input
                                        type="text"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.origin || ''}
                                        onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Destination</label>
                                    <input
                                        type="text"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.destination || ''}
                                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Departure Date (dd/mm/yyyy)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="dd/mm/yyyy"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={modalDateStrings.departure}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setModalDateStrings({ ...modalDateStrings, departure: val });
                                            const parsed = parseDDMMYYYYToYYYYMMDD(val);
                                            if (parsed) {
                                                const time = getISOPart(formData.departure_time, 'time');
                                                setFormData({ ...formData, departure_time: `${parsed}T${time}:00.000Z` });
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={getISOPart(formData.departure_time, 'time')}
                                        onChange={e => {
                                            const val = e.target.value || '00:00';
                                            // Prefer the date from the text input if it's already valid, otherwise use from formData
                                            const manualDate = parseDDMMYYYYToYYYYMMDD(modalDateStrings.departure);
                                            const date = manualDate || getISOPart(formData.departure_time, 'date');
                                            setFormData({ ...formData, departure_time: `${date}T${val}:00.000Z` });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Date (dd/mm/yyyy)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="dd/mm/yyyy"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={modalDateStrings.arrival}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setModalDateStrings({ ...modalDateStrings, arrival: val });
                                            const parsed = parseDDMMYYYYToYYYYMMDD(val);
                                            if (parsed) {
                                                const time = getISOPart(formData.arrival_time, 'time');
                                                setFormData({ ...formData, arrival_time: `${parsed}T${time}:00.000Z` });
                                            }
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={getISOPart(formData.arrival_time, 'time')}
                                        onChange={e => {
                                            const val = e.target.value || '00:00';
                                            // Prefer the date from the text input if it's already valid, otherwise use from formData
                                            const manualDate = parseDDMMYYYYToYYYYMMDD(modalDateStrings.arrival);
                                            const date = manualDate || getISOPart(formData.arrival_time, 'date');
                                            setFormData({ ...formData, arrival_time: `${date}T${val}:00.000Z` });
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Price (Adult)</label>
                                    <input
                                        type="number"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Infant Price (0-2 Yrs)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="0 for free"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.infant_price ?? ''}
                                        onChange={e => setFormData({ ...formData, infant_price: e.target.value })}
                                    />
                                    <p className="text-[10px] text-slate-400 mt-1">Leave 0 for free infant seats</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Duration (hh:mm:ss)</label>
                                    <input
                                        type="text"
                                        placeholder="02:30:00"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.duration || ''}
                                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stops</label>
                                    <input
                                        type="number"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.stops || 0}
                                        onChange={e => setFormData({ ...formData, stops: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Stop Details (Airports)</label>
                                    <input
                                        type="text"
                                        placeholder="DXB, AUH"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.stop_details || ''}
                                        onChange={e => {
                                            const val = e.target.value;
                                            const newStops = (val && formData.stops === 0) ? 1 : formData.stops;
                                            setFormData({ ...formData, stop_details: val, stops: newStops });
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Total Seats</label>
                                    <input
                                        type="number"
                                        required
                                        min={bookedCount}
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.total_seats || ''}
                                        onChange={e => handleTotalSeatsChange(parseInt(e.target.value) || 0)}
                                    />
                                    {bookedCount > 0 && (
                                        <p className="text-[10px] text-slate-500 mt-1">
                                            Minimum {bookedCount} seats required (already booked)
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Available Seats</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-green-700"
                                        value={formData.available_seats !== undefined ? formData.available_seats : ''}
                                        onChange={e => handleAvailableSeatsChange(parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Baggage Allowance</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 15kg / 7kg"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.baggage_allowance || ''}
                                        onChange={e => setFormData({ ...formData, baggage_allowance: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Layover Duration</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 2h 30m"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.layover_duration || ''}
                                        onChange={e => setFormData({ ...formData, layover_duration: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Departure Terminal</label>
                                        <input
                                            type="text"
                                            placeholder="T3"
                                            className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            value={formData.departure_terminal || ''}
                                            onChange={e => setFormData({ ...formData, departure_terminal: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Terminal</label>
                                        <input
                                            type="text"
                                            placeholder="T1"
                                            className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                            value={formData.arrival_terminal || ''}
                                            onChange={e => setFormData({ ...formData, arrival_terminal: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Flight PNR</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. INDBOM001"
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase bg-slate-50 focus:bg-white"
                                        value={formData.pnr || ''}
                                        onChange={e => setFormData({ ...formData, pnr: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                                            checked={formData.is_hidden || false}
                                            onChange={e => setFormData({ ...formData, is_hidden: e.target.checked })}
                                        />
                                        <span className="text-sm font-medium text-slate-700">Temporarily hide this flight from users</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cursor-pointer px-4 py-2 text-slate-600 hover:text-slate-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="cursor-pointer px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                >
                                    Save Flight
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
