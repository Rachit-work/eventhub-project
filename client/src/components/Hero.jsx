import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Hero() {
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSearch = () => {
    // Navigates to marketplace with query parameters
    navigate(`/marketplace?search=${query}&city=${location}`);
  };

  return (
    <section className="pt-32 pb-20 px-10 bg-gradient-to-b from-[#fff5f3] to-white text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-extrabold text-gray-900 mb-6">
          Find the Perfect <span className="text-[#c25e4c]">Vendors</span> for Your Event
        </h1>
        <div className="bg-white p-2 rounded-full shadow-xl flex items-center max-w-2xl mx-auto border">
          <div className="flex-1 px-6 border-r flex items-center gap-2">
            <span className="text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="What are you looking for?" 
              className="w-full outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex-1 px-6 flex items-center gap-2">
            <span className="text-gray-400">📍</span>
            <input 
              type="text" 
              placeholder="Which city?" 
              className="w-full outline-none"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <button 
            onClick={handleSearch}
            className="bg-[#c25e4c] text-white px-8 py-3 rounded-full font-bold hover:bg-[#a64a39] transition"
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}