import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [role, setRole] = useState('customer'); // Use lowercase by default
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', city: '', password: '' });
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      // 1. Create user in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Sync with Node.js Backend
      const registrationData = {
        uid: uid, 
        role: role, // Already lowercase
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        description: '', 
        event_type: role === 'vendor' ? 'General Vendor' : '' 
      };

      await axios.post('http://localhost:5000/api/register', registrationData);

      // 3. Save to localStorage to avoid "Guest" bug
      const userToStore = {
        uid: uid,
        email: formData.email,
        full_name: formData.name,
        role: role // Critical: ensures Navbar shows 'vendor'
      };
      localStorage.setItem('user', JSON.stringify(userToStore));

      alert("Registration Successful!");
      
      // 4. Case-sensitive redirect fix
      if (role === 'vendor') {
        navigate('/vendor-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
      
    } catch (error) {
      console.error("Registration Error:", error);
      alert("Error: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f8f9fc] p-4 font-sans">
      <div className="bg-white p-10 rounded-[32px] shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-4xl font-black text-center mb-8 text-gray-900 tracking-tight">Join EventHub</h2>
        
        {/* Role Toggle Switch */}
        <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-8">
          <button 
            type="button"
            className={`flex-1 py-3 rounded-xl transition-all font-bold text-sm ${role === 'customer' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            onClick={() => setRole('customer')}
          >Customer</button>
          <button 
            type="button"
            className={`flex-1 py-3 rounded-xl transition-all font-bold text-sm ${role === 'vendor' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
            onClick={() => setRole('vendor')}
          >Vendor</button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <input type="text" placeholder="Full Name" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          
          <input type="email" placeholder="Email Address" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
            onChange={(e) => setFormData({...formData, email: e.target.value})} required />
          
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Phone" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
              onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
            <input type="text" placeholder="City" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
              onChange={(e) => setFormData({...formData, city: e.target.value})} required />
          </div>

          <input type="password" placeholder="Create Password" className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
            onChange={(e) => setFormData({...formData, password: e.target.value})} required />
          
          <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all mt-4 capitalize">
            Register as {role}
          </button>
        </form>
      </div>
    </div>
  );
}
