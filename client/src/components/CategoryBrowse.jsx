import { useNavigate } from 'react-router-dom';
import { Camera, Utensils, Flower, Music, UserCheck, MapPin, ChevronRight } from 'lucide-react';

const categories = [
  { name: 'Photographer', icon: <Camera size={24} />, color: 'bg-purple-100 text-purple-600' },
  { name: 'Caterer', icon: <Utensils size={24} />, color: 'bg-blue-100 text-blue-600' },
  { name: 'Decorator', icon: <Flower size={24} />, color: 'bg-pink-100 text-pink-600' },
  { name: 'DJ', icon: <Music size={24} />, color: 'bg-indigo-100 text-indigo-600' },
  { name: 'Makeup Artist', icon: <UserCheck size={24} />, color: 'bg-orange-100 text-orange-600' },
  { name: 'Event Venue', icon: <MapPin size={24} />, color: 'bg-red-100 text-red-600' },
];

export default function CategoryBrowse() {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName) => {
    // Navigates to marketplace with the category as a URL parameter
    // Ensure your Marketplace component uses useSearchParams() to catch this
    navigate(`/marketplace?category=${encodeURIComponent(categoryName)}`);
  };

  return (
    <section className="py-24 px-6 md:px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-12 gap-4 text-center md:text-left">
          <div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Browse by Category</h2>
            <p className="text-gray-500 mt-2 font-medium">Find the perfect experts for your specific event needs.</p>
          </div>
          <button 
            onClick={() => navigate('/marketplace')}
            className="group flex items-center gap-2 text-[#c25e4c] font-black text-sm uppercase tracking-wider hover:text-[#a64a39] transition-colors"
          >
            Explore All 
            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {categories.map((cat) => (
            <button 
              key={cat.name} 
              onClick={() => handleCategoryClick(cat.name)}
              className="bg-gray-50 border border-gray-100 rounded-[2rem] p-8 text-center hover:bg-white hover:shadow-2xl hover:shadow-[#c25e4c]/10 transition-all group cursor-pointer active:scale-95 flex flex-col items-center"
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-all duration-500 group-hover:rotate-6 group-hover:scale-110 shadow-sm ${cat.color}`}>
                {cat.icon}
              </div>
              <h3 className="font-black text-gray-900 text-xs uppercase tracking-widest leading-tight">
                {cat.name}
              </h3>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}