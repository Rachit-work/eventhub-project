import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, MessageCircle, ChevronRight, Loader2, Package } from 'lucide-react';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Mock User - Replace with your Auth Context
  const loggedInUser = { uid: "1ORma3Vyl3fXmZU5eIXYjFYVMg1" }; 

 // Inside MyBookings.jsx
useEffect(() => {
  const fetchMyBookings = async () => {
    try {
      // FIX: Changed 'user-bookings' to 'customer/bookings' to match index.js
      const res = await fetch(`http://localhost:5000/api/customer/bookings/${loggedInUser.uid}`);
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error("Error fetching bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchMyBookings();
}, []);

  const getStatusStyles = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'declined': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700'; // Pending
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-[#c25e4c]" size={48} />
    </div>
  );

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-gray-900">My Bookings</h1>
          <p className="text-gray-500 font-medium mt-2">Track your event reservations and vendor responses.</p>
        </div>

        {bookings.length > 0 ? (
          <div className="space-y-6">
            {bookings.map((booking) => (
              <div 
                key={booking.booking_id}
                className="group bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-[#c25e4c]/20 transition-all cursor-pointer"
                onClick={() => navigate(`/vendor/${booking.vendor_id}`)}
              >
                <div className="flex flex-col md:flex-row gap-8 items-center">
                  {/* Vendor Image */}
                  <img 
                    src={booking.vendor_image} 
                    className="w-24 h-24 rounded-2xl object-cover shadow-inner" 
                    alt="Vendor"
                  />

                  {/* Booking Details */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-xl font-black text-gray-900">{booking.vendor_name}</h3>
                      <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyles(booking.status)}`}>
                        {booking.status || 'Pending'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                          <Calendar size={16} className="text-[#c25e4c]" />
                          {new Date(booking.event_date).toLocaleDateString('en-IN', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
                          <Package size={16} className="text-[#c25e4c]" />
                          {booking.package_title} — <span className="text-gray-900">{formatINR(booking.price)}</span>
                        </div>
                      </div>

                      <div className="flex items-center md:justify-end gap-3">
                        <button className="p-3 rounded-xl bg-gray-50 text-gray-400 hover:text-[#c25e4c] hover:bg-[#fffaf9] transition-all">
                          <MessageCircle size={20} />
                        </button>
                        <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-900 text-white font-black text-sm group-hover:bg-[#c25e4c] transition-all">
                          View Details <ChevronRight size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
            <Clock className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-xl font-black text-gray-400">No bookings yet</h3>
            <button 
              onClick={() => navigate('/vendors')}
              className="mt-6 bg-gray-900 text-white px-8 py-3 rounded-xl font-black hover:bg-[#c25e4c] transition-all"
            >
              Explore Vendors
            </button>
          </div>
        )}
      </div>
    </div>
  );
}