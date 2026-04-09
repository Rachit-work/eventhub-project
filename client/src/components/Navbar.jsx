import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase'; 
import { onAuthStateChanged, signOut } from 'firebase/auth';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        setLoadingRole(true);
        try {
          // Fetching fresh role data from your backend
          const res = await fetch(`https://eventhub-project-w814.onrender.com/api/user/${currentUser.uid}`);
          
          if (!res.ok) throw new Error("User not found in database");
          
          const data = await res.json();
          // Normalize role to lowercase to match the conditional checks below
          if (data && data.role) {
            setRole(data.role.toLowerCase()); 
          } else {
            setRole('customer'); 
          }
        } catch (err) {
          console.error("Navbar Role Fetch Error:", err);
          setRole('customer'); // Default to customer on error instead of Guest
        } finally {
          setLoadingRole(false);
        }
      } else {
        setRole(null);
        setLoadingRole(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setRole(null);
      setUser(null); 
      navigate('/'); 
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  return (
    <nav className="flex justify-between items-center px-10 py-4 bg-white shadow-sm border-b sticky top-0 z-50">
      <Link to="/" className="text-2xl font-bold text-[#c25e4c] tracking-tight hover:opacity-80 transition-opacity">
        EventHub
      </Link>

      {/* Center Links */}
      <div className="hidden md:flex items-center space-x-8 text-gray-600 font-medium">
        <Link to="/" className="hover:text-[#c25e4c] transition-colors">Home</Link>
        <Link to="/marketplace" className="hover:text-[#c25e4c] transition-colors">Marketplace</Link>
        <Link to="/about" className="hover:text-[#c25e4c] transition-colors">About</Link>
        
        {/* FIX: Changed /dashboard to /vendor-dashboard to match App.js */}
        {user && role === 'vendor' && (
          <Link to="/vendor-dashboard" className="text-[#c25e4c] font-bold border-l pl-8 hover:opacity-80">
            Vendor Dashboard
          </Link>
        )}

        {user && role === 'customer' && (
          <Link to="/customer-dashboard" className="text-blue-600 font-bold border-l pl-8 hover:opacity-80">
            My Bookings
          </Link>
        )}

        {user && role === 'admin' && (
          <Link to="/admin" className="text-red-600 font-black border-l pl-8 hover:bg-red-50 px-4 py-2 rounded-xl transition-all">
            System Admin
          </Link>
        )}
      </div>

      {/* Right Side: Auth Buttons */}
      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest leading-none mb-1">
                {loadingRole ? '...' : role}
              </p>
              <p className="text-sm text-gray-900 font-bold max-w-[120px] truncate">
                {user.email?.split('@')[0]}
              </p>
            </div>
            <button 
              onClick={handleLogout} 
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-50 hover:text-red-600 transition-all active:scale-95"
            >
              Logout
            </button>
          </div>
        ) : (
          !loadingRole && ( // Only show auth buttons if we aren't waiting for a role check
            <div className="flex items-center gap-4">
              <Link to="/login" className="text-gray-700 font-bold hover:text-[#c25e4c] transition-colors">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-[#c25e4c] text-white px-6 py-2 rounded-full font-bold hover:shadow-lg hover:scale-105 transition-all active:scale-95"
              >
                Get Started
              </Link>
            </div>
          )
        )}
      </div>
    </nav>
  );
}