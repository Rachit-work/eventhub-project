import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Clear old session data to prevent the 'Guest' bug
    localStorage.removeItem('user');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // 1. Fetch user role from your Node.js backend
      const res = await fetch(`https://eventhub-backend.onrender.com/api/user/${uid}`);
      
      if (!res.ok) {
        throw new Error("User record not found in database. Please register first.");
      }

      const userData = await res.json();

      // 2. Normalize the role (ensures 'admin', 'vendor', or 'customer')
      const userRole = userData.role?.toLowerCase();

      // 3. Store the full user object in localStorage
      const userToStore = {
        uid: uid,
        email: userData.email,
        full_name: userData.full_name,
        role: userRole 
      };
      localStorage.setItem('user', JSON.stringify(userToStore));

      // 4. FIX: Added Admin Navigation Logic
      if (userRole === 'admin') {
        navigate('/admin'); // Redirect to your new Admin Dashboard
      } else if (userRole === 'vendor') {
        navigate('/vendor-dashboard');
      } else {
        navigate('/marketplace'); // Or your customer dashboard
      }

      alert("Login Successful!");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Login Error: " + error.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f8f9fc] p-4 font-sans">
      <div className="bg-white p-10 rounded-[32px] shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-black text-center mb-8 text-gray-900 tracking-tight">Welcome Back</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
            <input 
              type="email" 
              className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
              placeholder="name@company.com"
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
            <input 
              type="password" 
              className="w-full border-2 border-gray-50 p-4 rounded-2xl outline-none focus:border-blue-500 transition-all bg-gray-50/50" 
              placeholder="••••••••"
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all mt-4 active:scale-95"
          >
            Login to Dashboard
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-gray-500 font-medium">
          Don't have an account? <span className="text-blue-600 font-bold cursor-pointer hover:underline" onClick={() => navigate('/register')}>Register</span>
        </p>
      </div>
    </div>
  );
}