'use client';

import { useEffect, useState } from 'react';
import { getAdminFlights, createFlight, updateFlight, deleteFlight, bulkCreateFlights, Flight } from '@/lib/api';
import { Plus, Edit2, Trash2, Search, X, FileDigit, Download } from 'lucide-react';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

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
                stops: 0,
                total_seats: 150,
                available_seats: 150
            });
        }
        setIsModalOpen(true);
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
                departure_time: '2026-10-25/14:30:00',
                arrival_time: '2026-10-25/16:45:00',
                duration: '02:15:00',
                price: 5500,
                stops: 0,
                total_seats: 180
            },
            {
                airline: 'Air India',
                flight_number: 'AI-101',
                origin: 'BOM',
                destination: 'LHR',
                departure_time: '2026-10-26/02:00:00',
                arrival_time: '2026-10-26/07:30:00',
                duration: '09:00:00',
                price: 45000,
                stops: 0,
                total_seats: 250
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

                // Map Excel data to Flight fields
                const flightsToCreate = data.map((item: any) => ({
                    airline: item.airline || '',
                    flight_number: item.flight_number || '',
                    origin: item.origin || '',
                    destination: item.destination || '',
                    departure_time: item.departure_time || '',
                    arrival_time: item.arrival_time || '',
                    duration: item.duration || '',
                    price: item.price || 0,
                    stops: item.stops || 0,
                    total_seats: item.total_seats || 150
                }));

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
                            className="text-slate-700 pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={downloadSampleExcel}
                            className="cursor-pointer flex items-center gap-2 border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition"
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
                            className="cursor-pointer flex items-center gap-2 border border-green-600 text-green-600 px-4 py-2 rounded-lg hover:bg-green-50 transition"
                        >
                            <FileDigit className="w-5 h-5" />
                            Upload Excel
                        </button>
                        <button
                            onClick={() => openModal()}
                            className="cursor-pointer flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
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
                            <th className="px-6 py-4 font-medium text-slate-500">Departure</th>
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
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {flight.origin} → {flight.destination}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(flight.departure_time).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        ₹{parseFloat(flight.price).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {flight.available_seats !== undefined ? flight.available_seats : '-'} / {flight.total_seats || 0}
                                    </td>
                                    <td className="px-6 py-4 text-right">
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
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Departure Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.departure_time?.toString().slice(0, 16) || ''}
                                        onChange={e => setFormData({ ...formData, departure_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Arrival Time</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.arrival_time?.toString().slice(0, 16) || ''}
                                        onChange={e => setFormData({ ...formData, arrival_time: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                                    <input
                                        type="number"
                                        required
                                        className="text-slate-700 w-full px-3 py-2 border border-slate-300 rounded-lg"
                                        value={formData.price || ''}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
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
