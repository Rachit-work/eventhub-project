import { useEffect, useState } from 'react';
import { Users, Store, IndianRupee, CheckCircle, XCircle, ShieldAlert, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, vendors: 0, revenue: 0 });
  const [pendingVendors, setPendingVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/admin/overview');
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setPendingVendors(data.pending || []);
        }
      } catch (err) {
        console.error("Admin fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminData();
  }, []);

  const handleApprove = async (firebase_uid) => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/approve-vendor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebase_uid })
      });

      if (res.ok) {
        // Optimistic UI update
        setPendingVendors(prev => prev.filter(v => v.firebase_uid !== firebase_uid));
        setStats(prev => ({ ...prev, vendors: prev.vendors + 1 }));
      }
    } catch (err) {
      console.error("Approval error:", err);
    }
  };

  // Optional: Simple rejection logic to clear the queue
  const handleReject = (firebase_uid) => {
    // Usually, you'd call a DELETE route here, but for now, we'll just hide it
    setPendingVendors(prev => prev.filter(v => v.firebase_uid !== firebase_uid));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
            <ShieldAlert className="text-[#c25e4c]" /> Admin Control Center
          </h1>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StatCard icon={<Users />} label="Total Users" value={stats.users} color="bg-blue-500" />
          <StatCard icon={<Store />} label="Active Vendors" value={stats.vendors} color="bg-purple-500" />
          <StatCard icon={<IndianRupee />} label="Platform Volume" value={`₹${stats.revenue.toLocaleString()}`} color="bg-green-500" />
        </div>

        {/* Approval Queue */}
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
          <h2 className="text-xl font-black mb-6">Pending Vendor Approvals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-widest font-black">
                  <th className="pb-4">Vendor Name</th>
                  <th className="pb-4">City</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {pendingVendors.map((vendor) => (
                  <tr key={vendor.firebase_uid} className="group">
                    <td className="py-4 font-bold text-gray-900">{vendor.full_name}</td>
                    <td className="py-4 text-gray-500">{vendor.city || 'Not Provided'}</td>
                    <td className="py-4 text-gray-500">{vendor.email}</td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleApprove(vendor.firebase_uid)}
                          className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-all active:scale-90"
                          title="Approve Vendor"
                        >
                          <CheckCircle size={20} />
                        </button>
                        <button 
                          onClick={() => handleReject(vendor.firebase_uid)}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-all active:scale-90"
                          title="Reject Vendor"
                        >
                          <XCircle size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendingVendors.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 font-medium text-lg">All vendors are verified! 🤘</p>
                <p className="text-sm text-gray-300">New registration requests will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center gap-5 transition-transform hover:translate-y-[-4px]">
      <div className={`p-4 rounded-2xl text-white ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-400 uppercase tracking-tight">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}