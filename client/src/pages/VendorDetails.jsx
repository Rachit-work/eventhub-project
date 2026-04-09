import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Added useNavigate
import { 
  Star, MapPin, ShieldCheck, Mail, Loader2, 
  Calendar, Send, CheckCircle2, MessageSquare, ArrowLeft 
} from 'lucide-react';

const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function VendorDetails() {
  const { id } = useParams();
  const navigate = useNavigate(); // For the back button
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  
  const [userReview, setUserReview] = useState({ rating: 5, comment: '' });
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [bookingData, setBookingData] = useState({ event_date: '', message: '' });

  const inquirySectionRef = useRef(null);
 // This pulls the actual logged-in user that your Login/Register files saved
const loggedInUser = JSON.parse(localStorage.getItem('user')) || { uid: null };

  const handleInquiryClick = () => {
    inquirySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // --- DATA FETCHING ---
  const fetchVendorData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/vendors/${id}`);
      if (res.ok) setVendor(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/reviews/${id}`);
      if (res.ok) setReviews(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchPackages = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/packages/${id}`);
      if (res.ok) setPackages(await res.json());
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const loadPageData = async () => {
      setLoading(true);
      await Promise.all([fetchVendorData(), fetchReviews(), fetchPackages()]);
      setLoading(false);
    };
    loadPageData();
  }, [id]);

  // --- HANDLERS ---
  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmittingInquiry(true);
    try {
      const res = await fetch(`http://localhost:5000/api/inquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vendor_id: id, 
          user_id: loggedInUser.uid, 
          message: inquiryMessage 
        })
      });
      if (res.ok) {
        alert("Inquiry sent successfully!");
        setInquiryMessage('');
      }
    } finally { setSubmittingInquiry(false); }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPackage) return alert("Please select a service package first!");
    
    setSubmittingBooking(true);
    try {
      const res = await fetch(`http://localhost:5000/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vendor_id: id, 
          user_id: loggedInUser.uid, 
          event_date: bookingData.event_date,
          message: bookingData.message,
          package_id: selectedPackage.package_id
        })
      });
      if (res.ok) {
        alert("Booking request sent!");
        setBookingData({ event_date: '', message: '' });
      }
    } finally { setSubmittingBooking(false); }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          vendor_id: id, 
          user_id: loggedInUser.uid, 
          rating: Number(userReview.rating), 
          comment: userReview.comment 
        })
      });
      if (res.ok) {
        setUserReview({ rating: 5, comment: '' });
        await Promise.all([fetchVendorData(), fetchReviews()]);
      }
    } catch (err) { alert("Error posting review"); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#c25e4c]" size={48} /></div>;
  if (!vendor) return <div className="text-center py-20 font-bold text-gray-400">Vendor Not Found</div>;

  return (
    <div className="bg-white min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* BACK BUTTON */}
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 font-bold mb-8 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" /> 
          Back to Explorations
        </button>

        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start mb-12 gap-6">
          <div className="flex items-center gap-6">
            <img src={vendor.image} className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-md" alt="Vendor" />
            <div>
              <h1 className="text-4xl font-black text-gray-900 flex items-center gap-2">
                {vendor.name} <ShieldCheck className="text-blue-500 fill-blue-50" size={28} />
              </h1>
              <div className="flex items-center gap-5 text-sm font-bold text-gray-500 mt-2">
                <span className="flex items-center gap-1.5 bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full">
                  <Star className="fill-yellow-400 text-yellow-400" size={16} /> 
                  {vendor.avg_rating || '0.0'} ({vendor.review_count || 0} reviews)
                </span>
                <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full">
                  <MapPin size={16} className="text-[#c25e4c]" /> {vendor.city}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleInquiryClick}
            className="bg-white border-2 border-gray-900 text-gray-900 px-10 py-4 rounded-2xl font-black text-lg hover:bg-gray-50 transition-all flex items-center gap-2 shadow-lg shadow-gray-100"
          >
            <Mail size={20} /> Inquiry / Contact Now
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-16">
            
            {/* 1. WORK PORTFOLIO (Dynamic parsing) */}
            <section>
              <h2 className="text-2xl font-black mb-6">Work Portfolio</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <img src={vendor.image} className="col-span-2 row-span-2 rounded-3xl w-full h-[500px] object-cover shadow-lg" alt="Main Work" />
                {vendor.gallery?.split(',').slice(0, 2).map((imgUrl, i) => (
                  <img 
                    key={i} 
                    src={imgUrl.trim()} 
                    className="rounded-3xl h-[240px] w-full object-cover shadow-md hover:scale-[1.02] transition-transform" 
                    alt={`Work ${i + 1}`} 
                  />
                ))}
                {/* Fallback Unsplash images if gallery is empty */}
                {!vendor.gallery && (
                  <>
                    <img src="https://images.unsplash.com/photo-1519741497674-611481863552" className="rounded-3xl h-[240px] w-full object-cover shadow-md" alt="Work 1" />
                    <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b" className="rounded-3xl h-[240px] w-full object-cover shadow-md" alt="Work 2" />
                  </>
                )}
              </div>
            </section>

            {/* 2. SERVICE PACKAGES */}
            <section>
              <h2 className="text-2xl font-black mb-8 text-gray-900">Service Packages</h2>
              <div className="grid grid-cols-1 gap-6">
                {packages.length > 0 ? (
                  packages.map((pkg) => {
                    // Safe parsing for features
                    const featureList = Array.isArray(pkg.features) 
                      ? pkg.features 
                      : (typeof pkg.features === 'string' ? JSON.parse(pkg.features) : []);

                    return (
                      <div 
                        key={pkg.package_id} 
                        onClick={() => setSelectedPackage(pkg)}
                        className={`p-8 rounded-[2.5rem] border-2 transition-all cursor-pointer relative shadow-sm hover:shadow-md ${
                          selectedPackage?.package_id === pkg.package_id 
                          ? 'border-[#c25e4c] bg-[#fffaf9]' 
                          : 'border-gray-100 bg-white hover:border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="pr-10">
                            <h3 className="text-xl font-black text-gray-900">{pkg.title}</h3>
                            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{pkg.description}</p>
                          </div>
                          <span className="text-3xl font-black text-[#c25e4c]">
                            {formatINR(pkg.price)}
                          </span>
                        </div>
                        
                        {featureList.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-8 mt-6 pt-6 border-t border-gray-50">
                            {featureList.map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-12 border-2 border-dashed border-gray-100 rounded-[2.5rem] text-center">
                    <p className="text-gray-400 font-bold">No packages found for this vendor.</p>
                  </div>
                )}
              </div>
            </section>

            {/* 3. SEND AN INQUIRY */}
            <section ref={inquirySectionRef} className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100">
              <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-gray-900">
                <MessageSquare className="text-[#c25e4c]" /> Send an Inquiry
              </h2>
              <p className="text-gray-500 mb-8 font-medium italic">Ask {vendor.name} about availability, customization, or general questions.</p>
              
              <form onSubmit={handleInquirySubmit}>
                <textarea 
                  required
                  placeholder="Type your message here..."
                  className="w-full p-6 bg-white rounded-2xl border-none outline-none min-h-[150px] focus:ring-2 focus:ring-[#c25e4c] shadow-sm mb-4"
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                />
                <button 
                  disabled={submittingInquiry}
                  type="submit" 
                  className="bg-gray-900 text-white px-12 py-4 rounded-2xl font-black hover:bg-black transition-all flex items-center gap-2"
                >
                  {submittingInquiry ? <Loader2 className="animate-spin" /> : 'Send Inquiry'}
                </button>
              </form>
            </section>

            {/* 4. TESTIMONIALS */}
            <section>
              <h2 className="text-2xl font-black mb-8">Client Testimonials ({reviews.length})</h2>
              <form onSubmit={handleSubmitReview} className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 mb-12">
                <div className="flex gap-2 mb-4">
                  {[1,2,3,4,5].map(n => (
                    <Star 
                      key={n} 
                      size={24} 
                      className={`cursor-pointer transition-all ${n <= userReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      onClick={() => setUserReview({...userReview, rating: n})}
                    />
                  ))}
                </div>
                <textarea 
                  required 
                  placeholder="Tell us about your experience..." 
                  className="w-full p-6 bg-white rounded-2xl border-none outline-none min-h-[120px] focus:ring-2 focus:ring-[#c25e4c] shadow-sm" 
                  value={userReview.comment} 
                  onChange={(e) => setUserReview({...userReview, comment: e.target.value})} 
                />
                <button type="submit" className="mt-4 bg-[#c25e4c] text-white px-10 py-3 rounded-xl font-black shadow-lg shadow-red-100 hover:scale-105 transition-transform">Post Review</button>
              </form>

              <div className="space-y-8">
                {reviews.map((rev) => (
                  <div key={rev.review_id} className="p-6 rounded-3xl bg-white border border-gray-50 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <Star size={14} className="fill-yellow-500 text-yellow-500" />
                        <div>
                          <p className="font-black text-gray-900">{rev.reviewer_name || 'Verified Client'}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-black">{new Date(rev.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT SIDEBAR: BOOKING FOCUS */}
          <div className="lg:col-span-1">
            <div className="sticky top-32 bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-2xl">
              <h3 className="text-2xl font-black mb-2">Book Service</h3>
              <p className="text-gray-400 text-sm mb-8">Official reservation request.</p>

              <form onSubmit={handleBookingSubmit} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                    <Calendar size={12} /> Event Date
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full mt-2 p-4 bg-gray-800 rounded-2xl border-none outline-none text-white focus:ring-2 focus:ring-[#c25e4c]"
                    value={bookingData.event_date}
                    onChange={(e) => setBookingData({...bookingData, event_date: e.target.value})}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Event Details</label>
                  <textarea 
                    required
                    placeholder="Location, guest count, etc..." 
                    className="w-full mt-2 p-4 bg-gray-800 rounded-2xl border-none outline-none h-32 text-white resize-none focus:ring-2 focus:ring-[#c25e4c]"
                    value={bookingData.message}
                    onChange={(e) => setBookingData({...bookingData, message: e.target.value})}
                  />
                </div>

                {selectedPackage ? (
                  <div className="space-y-2 py-4 border-t border-gray-800">
                    <div className="flex justify-between text-xs font-bold text-gray-400">
                      <span>Package: {selectedPackage.title}</span>
                      <span>{formatINR(selectedPackage.price)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm font-black uppercase">Estimated Total</span>
                      <span className="text-2xl font-black text-[#c25e4c]">
                        {formatINR(Number(selectedPackage.price))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="py-4 border-t border-gray-800 text-center">
                    <p className="text-xs font-bold text-gray-500 italic">Please select a package from the left to see pricing.</p>
                  </div>
                )}

                <button 
                  disabled={submittingBooking}
                  className="w-full bg-[#c25e4c] text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-[#c25e4c]/20 hover:scale-[1.02] transition-transform"
                >
                  {submittingBooking ? <Loader2 className="animate-spin" /> : <>Confirm Request <Send size={20} /></>}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}