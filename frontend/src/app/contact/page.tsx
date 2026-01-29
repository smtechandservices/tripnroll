'use client';
import { useState } from 'react';
import { submitContactMessage } from '@/lib/api';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            message: formData.get('message') as string,
        };

        try {
            await submitContactMessage(data);
            setSuccess(true);
            e.currentTarget.reset();
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <h1 className="text-4xl font-bold text-slate-800 mb-6">Get in Touch</h1>
                        <p className="text-xl text-slate-500 mb-10 leading-relaxed">
                            Have questions about your flight? Need assistance with booking? Our team is here to help you 24/7.
                        </p>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
                                    <Mail />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Email Us</h3>
                                    <p className="text-slate-500">support@tripnroll.com</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 shrink-0">
                                    <Phone />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Call Us</h3>
                                    <p className="text-slate-500">+1 (555) 123-4567</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
                                    <MapPin />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">Visit Us</h3>
                                    <p className="text-slate-500">123 Travel Lane, Sky City, NY 10001</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
                        <h2 className="text-2xl font-bold text-slate-800 mb-6">Send a Message</h2>
                        {success ? (
                            <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center">
                                <div className="text-4xl mb-4">🎉</div>
                                <h3 className="font-bold text-xl mb-2">Message Sent!</h3>
                                <p>We'll get back to you shortly.</p>
                                <button onClick={() => setSuccess(false)} className="mt-4 text-green-700 font-semibold hover:underline">Send another</button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                                    <input name="name" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-green-500 outline-none bg-slate-50" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                                    <input name="email" type="email" required className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50" placeholder="john@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Message</label>
                                    <textarea name="message" required rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none bg-slate-50" placeholder="How can we help?"></textarea>
                                </div>
                                <button disabled={loading} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2">
                                    {loading ? 'Sending...' : <><Send size={18} /> Send Message</>}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
