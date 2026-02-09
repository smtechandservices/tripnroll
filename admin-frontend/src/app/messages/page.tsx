'use client';

import { useEffect, useState } from 'react';
import { getAdminContactMessages, ContactMessage } from '@/lib/api';
import { RefreshCw, CheckCircle, Mail, Clock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function MessagesPage() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await getAdminContactMessages(1);
            setMessages(data.results);
        } catch (error) {
            console.error('Failed to fetch messages', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const showMessageDetails = (msg: ContactMessage) => {
        Swal.fire({
            title: `Message from ${msg.name}`,
            html: `
                <div class="text-left">
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</label>
                        <a href="mailto:${msg.email}" class="text-blue-600 hover:underline font-medium">${msg.email}</a>
                    </div>
                    <div class="mb-4">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Received</label>
                        <div class="text-slate-700 font-medium">${new Date(msg.created_at).toLocaleString()}</div>
                    </div>
                    <div class="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Content</label>
                        <p class="text-slate-800 whitespace-pre-wrap leading-relaxed text-sm">${msg.message}</p>
                    </div>
                </div>
            `,
            width: '600px',
            showConfirmButton: false,
            showCloseButton: true,
            confirmButtonText: 'Close'
        });
    }

    return (
        <div className='pt-8'>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Contact Messages</h2>
                    <p className="text-slate-500 mt-1">View inquiries and feedback from users</p>
                </div>
                <button
                    onClick={fetchMessages}
                    className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors text-slate-600 shadow-sm"
                    title="Refresh List"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Sender</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Email</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Message Preview</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs">Date</th>
                            <th className="px-6 py-4 font-medium text-slate-500 uppercase tracking-wider text-xs text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading && messages.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading messages...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : messages.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                                            <Mail className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800">No messages yet</h3>
                                            <p className="text-slate-500 mt-1">Inbox is empty.</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            messages.map((msg) => (
                                <tr key={msg.id} className="hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => showMessageDetails(msg)}>
                                    <td className="px-6 py-4 font-bold text-slate-900">
                                        {msg.name}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {msg.email}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-600 truncate max-w-xs">{msg.message}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(msg.created_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                showMessageDetails(msg);
                                            }}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs hover:underline"
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
