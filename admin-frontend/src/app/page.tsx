'use client';

import { useEffect, useState } from 'react';
import { getAdminStats, AdminStats } from '@/lib/api';
import { IndianRupee, BookOpen, Plane, Users, Wallet, Undo2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => router.push('/login'));
  }, [router]);

  if (!stats) return <div className="flex h-96 items-center justify-center text-slate-500">Loading stats...</div>;

  const cards = [
    { label: 'Total Revenue', value: `₹${stats.total_revenue.toLocaleString('en-IN')}`, icon: IndianRupee, color: 'bg-green-500' },
    { label: 'Pending Top-ups', value: stats.pending_topups, icon: Wallet, color: 'bg-amber-500', link: '/topups' },
    { label: 'Pending Refunds', value: stats.pending_refunds, icon: Undo2, color: 'bg-rose-500', link: '/refunds' },
    { label: 'Total Bookings', value: stats.total_bookings, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'Active Bookings', value: stats.active_bookings, icon: Users, color: 'bg-purple-500' },
    { label: 'Total Flights', value: stats.total_flights, icon: Plane, color: 'bg-orange-500' },
  ];

  return (
    <div className='pt-8'>
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Dashboard Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <div 
            key={card.label} 
            className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 ${card.link ? 'cursor-pointer hover:border-slate-300 transition-all' : ''}`}
            onClick={() => card.link && router.push(card.link)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-full ${card.color} bg-opacity-10`}>
                <card.icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.label}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Bookings</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-slate-500">
                <th className="pb-3 font-medium">Booking ID</th>
                <th className="pb-3 font-medium">Passenger</th>
                <th className="pb-3 font-medium">Flight</th>
                <th className="pb-3 font-medium">Date</th>
                <th className="pb-3 font-medium text-center">Flight Status</th>
                <th className="pb-3 font-medium text-center">Payment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.recent_bookings.map((booking) => (
                <tr key={booking.id} className="group hover:bg-slate-50">
                  <td className="py-4 font-mono text-slate-600">{booking.booking_id}</td>
                  <td className="py-4 text-slate-600">{booking.first_name} {booking.last_name}</td>
                  <td className="py-4 text-slate-600">{booking.flight_details.airline} {booking.flight_details.flight_number}</td>
                  <td className="py-4 text-slate-600">{new Date(booking.created_at).toLocaleDateString()}</td>
                  <td className="py-4">
                    <div className="flex flex-col items-center gap-1.5">
                      {/* Flight Status Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                        booking.flight_status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.flight_status}
                      </span>
                      
                      {/* Payment Status Badge */}
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tighter ${
                        booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                        booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {booking.payment_status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
