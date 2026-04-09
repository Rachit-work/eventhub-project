import { useEffect, useState } from 'react';
import { Star, MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorList() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Calling the main vendors endpoint
    fetch('http://localhost:5000/api/vendors')
      .then((res) => res.json())
      .then((data) => {
        // Limit to top 5 for the homepage row
        const featuredData = Array.isArray(data) ? data.slice(0, 5) : [];
        setVendors(featuredData);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching featured vendors:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="animate-spin text-[#c25e4c]" size={32} />
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {vendors.map((vendor) => {
        // Normalize ID and Name from DB columns
        const vendorId = vendor.id || vendor.firebase_uid;
        const displayName = vendor.full_name || vendor.name;

        return (
          <div 
            key={vendorId} 
            className="bg-white border border-gray-100 rounded-[2rem] p-3 shadow-sm hover:shadow-xl transition-all group flex flex-col"
          >
            {/* Image Container */}
            <div className="relative aspect-[4/5] bg-gray-50 rounded-3xl mb-4 overflow-hidden">
              <img 
                src={vendor.image || vendor.image_url || 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=400'} 
                alt={displayName} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              {/* Rating Badge */}
              <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow-sm border border-white/20">
                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                <span className="text-[10px] font-black text-gray-900">
                  {vendor.rating || '4.9'}
                </span>
              </div>
            </div>

            {/* Details */}
            <div className="px-2 flex-grow">
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className="font-bold text-gray-900 text-sm truncate flex-1">
                  {displayName}
                </h3>
                <div className="flex items-center text-[10px] text-gray-400 font-bold shrink-0">
                  <MapPin size={10} className="mr-0.5" /> {vendor.city}
                </div>
              </div>
              <p className="text-[#c25e4c] font-black text-[12px] mb-4">
                ${vendor.price || '1,500'} <span className="text-gray-400 font-normal text-[10px]">starting</span>
              </p>
            </div>
            
            {/* Action */}
            <button 
              onClick={() => vendorId && navigate(`/vendor/${vendorId}`)}
              className="w-full py-3 rounded-2xl bg-gray-50 text-gray-900 font-black text-[11px] uppercase tracking-wider hover:bg-gray-900 hover:text-white transition-all active:scale-95"
            >
              View Profile
            </button>
          </div>
        );
      })}
    </div>
  );
}