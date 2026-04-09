import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, BarChart, MessageSquare, Clock } from 'lucide-react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

const VendorDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [user, setUser] = useState(null);

    // 1. Memoized fetch function
    const fetchDashboardData = useCallback(async (uid) => {
        if (!uid) return;
        try {
            const response = await fetch(`http://localhost:5000/api/vendor/dashboard-overview/${uid}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error("Connection error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // 2. Manage Auth State
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchDashboardData(currentUser.uid);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [fetchDashboardData]);

    // 3. Update status and refresh data
    const updateStatus = async (bookingId, newStatus) => {
        try {
            const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (response.ok && user) {
                fetchDashboardData(user.uid);
            }
        } catch (err) {
            console.error("Update failed:", err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center font-black animate-pulse text-blue-600 tracking-tighter uppercase">
                    Syncing with Neon Database...
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-white p-12 rounded-[40px] shadow-xl text-center border border-gray-100">
                    <p className="text-gray-400 font-bold mb-6">Identity session expired.</p>
                    <button 
                        onClick={() => window.location.href = '/login'}
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black hover:scale-105 transition-transform"
                    >
                        Return to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] pt-24 px-8 pb-12">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tight">Vendor Dashboard</h1>
                        <p className="text-gray-400 text-sm font-medium mt-1">Managing: {user.email}</p>
                    </div>
                </div>

                {/* STATS OVERVIEW - Updated to 3 columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {/* Revenue Card */}
                    <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-100 relative overflow-hidden">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Total Revenue</p>
                        <p className="text-5xl font-black mt-2">₹{data?.stats?.revenue?.toLocaleString() || '0'}</p>
                        <DollarSign className="absolute right-[-10px] bottom-[-10px] opacity-10 w-32 h-32" />
                    </div>

                    {/* NEW: Active Events Card */}
                    <div className="bg-indigo-600 p-8 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Active Events</p>
                        <p className="text-5xl font-black mt-2">{data?.stats?.activeEvents || '0'}</p>
                        <Clock className="absolute right-[-10px] bottom-[-10px] opacity-10 w-32 h-32" />
                        <p className="text-[10px] font-bold mt-4 opacity-80 italic">
                            {data?.stats?.pendingApprovals || 0} requests awaiting response
                        </p>
                    </div>
                    
                    {/* Success Rate Card */}
                    <div className="bg-emerald-500 p-8 rounded-[32px] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                        <p className="text-[10px] uppercase font-black tracking-widest opacity-70">Success Rate</p>
                        <p className="text-5xl font-black mt-2">{data?.stats?.successRate || '0'}%</p>
                        <BarChart className="absolute right-[-10px] bottom-[-10px] opacity-10 w-32 h-32" />
                    </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex gap-4 mb-8 bg-gray-200/50 p-1.5 rounded-2xl w-fit">
                    <button 
                        onClick={() => setActiveTab('overview')} 
                        className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'overview' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Booking Requests
                    </button>
                    <button 
                        onClick={() => setActiveTab('inquiries')} 
                        className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'inquiries' ? 'bg-white shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Mailbox ({data?.inquiries?.length || 0})
                    </button>
                </div>

                {/* DYNAMIC CONTENT */}
                <div className="bg-white border border-gray-100 rounded-[40px] p-10 shadow-sm min-h-[400px]">
                    {activeTab === 'overview' ? (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800">
                                <Clock className="text-blue-600" size={24}/> Action Required
                            </h2>
                            <div className="grid gap-4">
                                {data?.bookings?.filter(b => b.status === 'pending').map(booking => (
                                    <div key={booking.booking_id} className="flex flex-col md:flex-row justify-between items-center p-8 border border-gray-50 rounded-[32px] hover:bg-blue-50/30 transition-all">
                                        <div>
                                            <p className="font-black text-2xl text-gray-900">{booking.package_name || "Custom Event"}</p>
                                            <p className="text-sm text-gray-400 font-bold mt-1">
                                                Event Date: {new Date(booking.event_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-3 mt-6 md:mt-0 w-full md:w-auto">
                                            <button 
                                                onClick={() => updateStatus(booking.booking_id, 'confirmed')} 
                                                className="flex-1 md:flex-none bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase hover:scale-105 transition-transform"
                                            >
                                                Accept
                                            </button>
                                            <button 
                                                onClick={() => updateStatus(booking.booking_id, 'rejected')} 
                                                className="flex-1 md:flex-none bg-gray-100 text-gray-400 px-8 py-3 rounded-2xl text-xs font-black uppercase hover:bg-red-50 hover:text-red-400 transition-all"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {data?.bookings?.filter(b => b.status === 'pending').length === 0 && (
                                    <div className="text-center py-20 opacity-30 font-bold">
                                        <Clock size={48} className="mx-auto mb-4" />
                                        No pending requests.
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <h2 className="text-xl font-black mb-8 flex items-center gap-3 text-gray-800">
                                <MessageSquare className="text-blue-600" size={24}/> Client Messages
                            </h2>
                            {data?.inquiries?.map(iq => (
                                <div key={iq.inquiry_id} className="p-8 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">From: {iq.customer_name}</span>
                                    </div>
                                    <p className="text-gray-700 font-medium leading-relaxed italic border-l-4 border-blue-200 pl-4">
                                        "{iq.message}"
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;