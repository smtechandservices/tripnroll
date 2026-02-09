'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { getWalletBalance, topUpWallet, WalletData } from '@/lib/api';
import { Wallet, CreditCard, ArrowUpRight, ArrowDownLeft, AlertCircle, History, RotateCcw } from 'lucide-react';
import Swal from 'sweetalert2';

export default function WalletPage() {
    const { user, isAuthenticated } = useAuth();
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState(true);
    const [topUpAmount, setTopUpAmount] = useState('');
    const [processingTopUp, setProcessingTopUp] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            fetchWalletData();
        }
    }, [isAuthenticated]);

    const fetchWalletData = async () => {
        setLoading(true);
        try {
            const data = await getWalletBalance();
            setWalletData(data);
        } catch (error) {
            console.error('Failed to fetch wallet data', error);
            Swal.fire('Error', 'Failed to load wallet information', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleTopUp = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(topUpAmount);
        if (isNaN(amount) || amount <= 0) {
            Swal.fire('Error', 'Please enter a valid amount', 'error');
            return;
        }


        const result = await Swal.fire({
            title: 'Confirm Top-up',
            text: `Are you sure you want to add ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to your wallet?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#16a34a',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, proceed',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) {
            return;
        }

        setProcessingTopUp(true);
        try {
            const result = await topUpWallet(amount);
            Swal.fire({
                icon: 'success',
                title: 'Top-up Successful',
                text: result.message,
                timer: 2000,
                showConfirmButton: false
            });
            setTopUpAmount('');
            fetchWalletData(); // Refresh data
        } catch (error: any) {
            Swal.fire('Error', error.message || 'Top-up failed', 'error');
        } finally {
            setProcessingTopUp(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 py-12 px-4">
                <div className="max-w-4xl mx-auto text-center pt-24">
                    <h1 className="text-3xl font-bold text-slate-800 mb-4">My Wallet</h1>
                    <p className="text-slate-600">Please log in to view your wallet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            {/* Hero Section */}
            <div className="bg-slate-900 py-10 px-4 text-center">
            </div>

            <div className="mx-auto px-4 md:px-12 pt-10 relative z-10 ms-2">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-700 mb-2">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Wallet</span>
                </h1>
                <p className="text-slate-400 text-lg leading-relaxed mb-2">
                    Manage your funds, credit limit, and transaction history in one secure place.
                </p>
            </div>

            <div className="mx-auto px-4 md:px-12 py-12 -mt-10 relative z-10">

                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading wallet details...</p>
                    </div>
                ) : !walletData ? (
                    <div className="text-center py-12 text-red-500">Failed to load wallet data.</div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Wallet Card */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Wallet className="w-64 h-64" />
                                </div>

                                <div className="relative z-10">
                                    <p className="text-gray-400 font-medium mb-1">Available Spending Power</p>
                                    <h2 className="text-5xl font-bold mb-8">
                                        ₹{walletData.available_spending_power.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </h2>

                                    <div className="grid grid-cols-3 gap-6 pt-6 border-t border-gray-700">
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Wallet Balance</p>
                                            <p className="text-2xl font-semibold text-green-400">
                                                ₹{parseFloat(walletData.wallet_balance.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Credit Limit</p>
                                            <p className="text-xl font-semibold text-blue-400">
                                                ₹{parseFloat(walletData.credit_limit.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-sm mb-1">Total Dues</p>
                                            <p className="text-xl font-semibold text-red-400">
                                                ₹{parseFloat(walletData.total_dues.toString()).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Recent Transactions */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                                        <History className="w-5 h-5 text-gray-500" />
                                        Recent Transactions
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {walletData.recent_transactions.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            No recent transactions found.
                                        </div>
                                    ) : (
                                        walletData.recent_transactions.map((tx) => (
                                            <div key={tx.id} className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                                <div className="flex items-start gap-4">
                                                    <div className={`p-3 rounded-full ${tx.description.toLowerCase().includes('refund')
                                                        ? 'bg-blue-100 text-blue-600'
                                                        : tx.transaction_type === 'CREDIT'
                                                            ? 'bg-green-100 text-green-600'
                                                            : 'bg-red-100 text-red-600'
                                                        }`}>
                                                        {tx.description.toLowerCase().includes('refund') ? (
                                                            <RotateCcw className="w-5 h-5" />
                                                        ) : tx.transaction_type === 'CREDIT' ? (
                                                            <ArrowDownLeft className="w-5 h-5" />
                                                        ) : (
                                                            <ArrowUpRight className="w-5 h-5" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{tx.description}</p>
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            {new Date(tx.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${tx.transaction_type === 'CREDIT' ? 'text-green-600' : 'text-slate-900'
                                                        }`}>
                                                        {tx.transaction_type === 'CREDIT' ? '+' : '-'} ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        Bal: ₹{parseFloat(tx.balance_after).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Top Up Section */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <CreditCard className="w-5 h-5 text-gray-500" />
                                    Top Up Wallet
                                </h3>

                                <form onSubmit={handleTopUp} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Amount to Add / Pay Dues
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg font-bold">₹</span>
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.01"
                                                required
                                                value={topUpAmount}
                                                onChange={(e) => setTopUpAmount(e.target.value)}
                                                placeholder="0.00"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-medium text-gray-900"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                                        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-blue-700">
                                            Top-ups will first clear any outstanding dues before adding to your wallet balance.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processingTopUp || !topUpAmount}
                                        className="cursor-pointer w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-green-200 flex justify-center items-center gap-2"
                                    >
                                        {processingTopUp ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Proceed to Payment
                                                <ArrowUpRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>

                            <div className="bg-gray-100 rounded-2xl p-6 text-center">
                                <p className="text-gray-500 text-sm">
                                    Need a higher credit limit?
                                    <br />
                                    <a href="/contact" className="text-green-600 font-bold hover:underline">Contact Support</a>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

    );
}
