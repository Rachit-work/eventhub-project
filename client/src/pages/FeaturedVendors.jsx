import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function FeaturedVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/vendors');
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        
        // FIX: Limit to 5 vendors and ensure they are valid
        const limitedData = Array.isArray(data) ? data.slice(0, 5) : [];
        setVendors(limitedData);
      } catch (err) {
        console.error("Error fetching featured vendors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading) return <div className="text-center py-10">Loading Featured...</div>;

  return (
    <section className="py-16 px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-gray-900 mb-12">Featured Vendors</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {vendors.map((vendor) => (
            <div 
              key={vendor.id || vendor.firebase_uid} 
              className="border rounded-2xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="aspect-square bg-gray-100 rounded-xl mb-4 overflow-hidden">
                <img 
                  src={vendor.image || vendor.image_url || 'https://via.placeholder.com/300'} 
                  alt={vendor.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#c25e4c] bg-[#fff5f3] px-2 py-1 rounded">
                {vendor.city || 'Location'}
              </span>
              <h3 className="font-bold text-lg mt-2 truncate">
                {vendor.name || vendor.full_name}
              </h3>
              <p className="text-gray-500 text-sm mb-4">Professional in {vendor.city}</p>
              
              <button 
                onClick={() => navigate(`/vendor/${vendor.id || vendor.firebase_uid}`)}
                className="w-full bg-[#1a202c] text-white py-2 rounded-lg font-bold text-sm hover:bg-black transition"
              >
                View Profile
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
