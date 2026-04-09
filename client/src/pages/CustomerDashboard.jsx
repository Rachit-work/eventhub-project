import { useEffect, useState, useCallback } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  User, Calendar, MessageSquare, Clock, 
  ChevronRight, ShoppingBag, Search
} from 'lucide-react';

export default function CustomerDashboard() {
  const [dbUser, setDbUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  
  const navigate = useNavigate();

  // --- DATA LOADING ---
  const loadCustomerData = useCallback(async (uid) => {
    try {
      // 1. Fetch User Profile
      const userRes = await fetch(`https://eventhub-project-w814.onrender.com/api/user/${uid}`);
      if (!userRes.ok) throw new Error("Profile not found");
      const userData = await userRes.json();
      setDbUser(userData);

      // 2. Fetch Bookings & Inquiries using UID (Matches updated index.js)
      const [bkRes, iqRes] = await Promise.all([
        fetch(`https://eventhub-project-w814.onrender.com/api/customer/bookings/${uid}`),
        fetch(`https://eventhub-project-w814.onrender.com/api/inquiries/customer/${uid}`)
      ]);

      if (bkRes.ok) setBookings(await bkRes.json());
      if (iqRes.ok) setInquiries(await iqRes.json());

    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (userAuth) => {
      if (userAuth) {
        loadCustomerData(userAuth.uid);
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, loadCustomerData]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black text-gray-400 uppercase tracking-widest">
      Loading Your Workspace...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-10 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black tracking-tight">
              Hello, {dbUser?.full_name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-500 font-medium">Tracking your planned events and conversations.</p>
          </div>
          <button 
            onClick={() => navigate('/marketplace')} // Fixed: Navigates to marketplace
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-blue-100 hover:scale-105 transition-all"
          >
            <Search size={18} /> Browse Vendors
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* LEFT SIDEBAR */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-4 flex items-center justify-center text-gray-400">
                <User size={40} />
              </div>
              <h3 className="font-black text-xl">{dbUser?.full_name}</h3>
              <p className="text-gray-400 text-sm mb-6">{dbUser?.email}</p>
              
              <div className="flex flex-col gap-2">
                <button className="w-full py-3 bg-gray-50 rounded-2xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition-all">
                  Edit Profile
                </button>
                <button 
                  onClick={() => auth.signOut()}
                  className="w-full py-3 text-red-500 font-bold text-sm"
                >
                  Logout
                </button>
              </div>
            </div>

            <div className="bg-blue-600 p-8 rounded-[40px] text-white">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Active Events</span>
              <div className="text-4xl font-black mt-2">{bookings.length}</div>
              <p className="text-xs mt-4 opacity-80 font-bold">
                You have {bookings.filter(b => b.status === 'pending').length} pending approvals.
              </p>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex gap-4 p-1.5 bg-gray-200/50 rounded-2xl w-fit">
              <button 
                onClick={() => setActiveTab('bookings')}
                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'bookings' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                My Bookings
              </button>
              <button 
                onClick={() => setActiveTab('inquiries')}
                className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${activeTab === 'inquiries' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
              >
                Inquiries
              </button>
            </div>

            {/* BOOKINGS LIST */}
            {activeTab === 'bookings' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bookings.length > 0 ? bookings.map((bk) => (
                  <div key={bk.booking_id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:border-blue-200 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-xl ${bk.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                        <Calendar size={20} />
                      </div>
                      <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                        bk.status === 'confirmed' ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'
                      }`}>
                        {bk.status}
                      </span>
                    </div>
                    <h4 className="font-black text-lg">{bk.vendor_name}</h4>
                    <p className="text-xs text-gray-400 font-bold mb-1 uppercase tracking-wider">{bk.package_name}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm font-bold mb-4">
                      <Clock size={14} /> {new Date(bk.event_date).toDateString()}
                    </div>
                    <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                      <span className="font-black text-blue-600">₹{bk.price || bk.package_price}</span>
                      <button className="text-gray-300 group-hover:text-blue-600 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 p-20 bg-white rounded-[40px] border border-dashed text-center">
                    <ShoppingBag className="mx-auto text-gray-200 mb-4" size={48} />
                    <p className="font-black text-gray-400">No bookings yet. Start planning!</p>
                  </div>
                )}
              </div>
            )}

            {/* INQUIRIES LIST */}
            {activeTab === 'inquiries' && (
              <div className="space-y-4">
                {inquiries.length > 0 ? inquiries.map((iq) => (
                  <div key={iq.inquiry_id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600">
                          <MessageSquare size={18} />
                        </div>
                        <h4 className="font-black">Sent to: {iq.vendor_name}</h4>
                      </div>
                      <span className="text-[10px] font-black text-gray-300 uppercase">
                        {new Date(iq.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-2xl italic text-sm">
                      "{iq.message}"
                    </p>
                  </div>
                )) : (
                  <div className="p-20 bg-white rounded-[40px] border border-dashed text-center text-gray-400 font-bold">
                    No active inquiries.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}