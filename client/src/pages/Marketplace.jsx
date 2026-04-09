import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Star, MapPin, Loader2 } from 'lucide-react';

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const city = searchParams.get('city') || '';

  useEffect(() => {
    // CHANGE 1: Explicitly log the fetch for debugging connection errors
    fetch('http://localhost:5000/api/vendors')
      .then(res => {
        if (!res.ok) throw new Error("Server response was not ok");
        return res.json();
      })
      .then(data => {
        // CHANGE 2: Ensure data is an array before setting state
        setVendors(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Marketplace fetch error:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const result = vendors.filter((v) => {
      // CHANGE 3: Handle all possible column names from your database
      const vName = (v.name || v.full_name || '').toLowerCase();
      const vCat = (v.category || '').toLowerCase();
      const vCity = (v.city || '').toLowerCase();

      const matchesSearch = vName.includes(search.toLowerCase());
      const matchesCat = !category || vCat.includes(category.toLowerCase().replace(/s$/, ''));
      const matchesCity = !city || vCity.includes(city.toLowerCase());

      return matchesSearch && matchesCat && matchesCity;
    });
    setFilteredVendors(result);
  }, [search, category, city, vendors]);

  const updateFilters = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value); else params.delete(key);
    setSearchParams(params);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-[#c25e4c]" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-28 px-6 md:px-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Find your perfect vendor</h1>
        <p className="text-gray-500 mb-10">Showing {filteredVendors.length} professionals</p>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 mb-12 p-2 bg-gray-50 rounded-2xl border border-gray-100">
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={search}
            className="flex-1 min-w-[200px] bg-white border-none rounded-xl px-4 py-3 shadow-sm outline-none focus:ring-2 focus:ring-[#c25e4c]"
            onChange={(e) => updateFilters('search', e.target.value)}
          />
          <select 
            value={category} 
            className="bg-white border-none rounded-xl px-4 py-3 shadow-sm outline-none cursor-pointer"
            onChange={(e) => updateFilters('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Photographer">Photographers</option>
            <option value="Caterer">Caterers</option>
            <option value="Decorator">Decorators</option>
            <option value="DJ">DJs</option>
            <option value="Venue">Venues</option>
            <option value="Makeup Artist">Makeup Artists</option>
          </select>
          <select 
            value={city} 
            className="bg-white border-none rounded-xl px-4 py-3 shadow-sm outline-none cursor-pointer"
            onChange={(e) => updateFilters('city', e.target.value)}
          >
            <option value="">All Cities</option>
            <option value="Mumbai">Mumbai</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Delhi">Delhi</option>
            <option value="Jaipur">Jaipur</option>
          </select>
        </div>

        {/* Marketplace Grid */}
        {filteredVendors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-20">
            {filteredVendors.map((vendor) => (
              <div key={vendor.id || vendor.firebase_uid} className="group">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all">
                  {/* CHANGE 4: Improved image fallback for new vendors */}
                  <img 
                    src={vendor.image || vendor.image_url || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=800'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={vendor.name || "Vendor"}
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-bold">{vendor.rating || '4.9'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{vendor.name || vendor.full_name}</h3>
                    <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                      <MapPin size={14} /> <span>{vendor.city}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Starting at</p>
                    <p className="font-bold text-[#c25e4c]">${vendor.price || '1,500'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/vendor/${vendor.id || vendor.firebase_uid}`)}
                  className="w-full mt-4 py-3 rounded-xl border border-gray-200 font-bold text-sm hover:bg-gray-900 hover:text-white transition-all active:scale-95"
                >
                  View Profile
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl text-gray-500">No vendors found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}