'use client';

import { useEffect, useState } from 'react';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, User } from '@/lib/api';
import { UserPlus, Edit2, Trash2, Search, X } from 'lucide-react';
import Swal from 'sweetalert2';

export default function UserManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const pageSize = 10;

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        profile: {
            phone_number: '',
            passport_number: '',
            address: '',
            usertype: 'user'
        }
    });

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setCurrentPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        fetchUsers(currentPage, debouncedSearch);
    }, [currentPage, debouncedSearch]);

    const fetchUsers = async (page: number = 1, search: string = '') => {
        setLoading(true);
        try {
            const data = await getAdminUsers(page, search);
            setUsers(data.results);
            setTotalCount(data.count);
        } catch (error) {
            console.error('Failed to fetch users', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (user: User | null = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '', // Don't show password
                profile: {
                    phone_number: user.profile?.phone_number || '',
                    passport_number: user.profile?.passport_number || '',
                    address: user.profile?.address || '',
                    usertype: user.profile?.usertype || 'user'
                }
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                profile: {
                    phone_number: '',
                    passport_number: '',
                    address: '',
                    usertype: 'user'
                }
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await Swal.fire({
            title: `Are you sure you want to ${editingUser ? 'update' : 'create'} this user?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: editingUser ? 'Yes, update' : 'Yes, create',
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
        });

        if (!result.isConfirmed) return;

        try {
            if (editingUser) {
                // Remove password from update if empty
                const updateData = { ...formData };
                if (!updateData.password) delete (updateData as any).password;
                await updateAdminUser(editingUser.id, updateData);
                Swal.fire({
                    icon: 'success',
                    title: 'User updated successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                await createAdminUser(formData);
                Swal.fire({
                    icon: 'success',
                    title: 'User created successfully',
                    timer: 1500,
                    showConfirmButton: false
                });
            }
            setIsModalOpen(false);
            fetchUsers(currentPage, debouncedSearch);
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Action failed', 'error');
        }
    };

    const handleDelete = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await deleteAdminUser(id);
                Swal.fire('Deleted!', 'User has been deleted.', 'success');
                fetchUsers(currentPage, debouncedSearch);
            } catch (error: any) {
                Swal.fire('Error', error.message || 'Delete failed', 'error');
            }
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="pt-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage non-admin travelers and customers</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="text-slate-700 pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        <UserPlus className="w-5 h-5" />
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500">Username</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Email</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Phone</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Passport</th>
                            <th className="px-6 py-4 font-medium text-slate-500">Joined</th>
                            <th className="px-6 py-4 font-medium text-slate-500 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading users...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                    No users found.
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-medium text-slate-900">{user.username}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.email}</td>
                                    <td className="px-6 py-4 text-slate-600">{user.profile?.phone_number || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600 font-mono text-xs">{user.profile?.passport_number || '-'}</td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {user.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openModal(user)}
                                                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                            >
                                                <Edit2 className="w-4 h-4 cursor-pointer" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id)}
                                                className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4 cursor-pointer" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {!loading && (
                    <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-sm text-slate-500">
                            Page {currentPage} of {Math.max(1, totalPages)} ({totalCount} users)
                        </span>
                        <div className="text-slate-700 flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 text-sm border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingUser ? 'Edit User' : 'Add New User'}
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 cursor-pointer" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {editingUser ? 'Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <input
                                    required={!editingUser}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                    <input
                                        type="text"
                                        value={formData.profile.phone_number}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            profile: { ...formData.profile, phone_number: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Passport Number</label>
                                    <input
                                        type="text"
                                        value={formData.profile.passport_number}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            profile: { ...formData.profile, passport_number: e.target.value }
                                        })}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-slate-900"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea
                                    value={formData.profile.address}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        profile: { ...formData.profile, address: e.target.value }
                                    })}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20 text-slate-900"
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-md shadow-green-200 cursor-pointer"
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
