import Hero from '../components/Hero';
import CategoryBrowse from '../components/CategoryBrowse';
import VendorList from '../components/VendorList'; 
import Journey from '../components/Journey';

export default function Home() {
  return (
    <div className="bg-white">
      <Hero />
      <CategoryBrowse />
      
      <section className="py-20 px-10 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Top Rated Vendors</h2>
          <p className="text-gray-600">Hand-picked professionals with exceptional track records.</p>
        </div>
        {/* Shows 5 vendors and fixes the "undefined" navigation crash */}
        <VendorList /> 
      </section>

      <Journey />
    </div>
  );
}
