import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer'; 
import Home from './pages/Home'; 
import VendorDashboard from './pages/VendorDashboard';// Ensure 'export default' in this file
import Marketplace from './pages/Marketplace'; 
import VendorDetails from './pages/VendorDetails'; 
import Settings from './pages/Settings';
import Login from './pages/Login'; 
import Register from './pages/Register'; 
import CustomerDashboard from './pages/CustomerDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen"> 
        <Navbar />
        
        <main className="flex-grow"> 
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} /> 
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Dashboard Routes */}
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/vendor-dashboard" element={<VendorDashboard />} />
            <Route path="/customer-dashboard" element={<CustomerDashboard />} /> 

            {/* Feature Routes */}
            <Route path="/vendor/:id" element={<VendorDetails />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>

        <Footer /> 
      </div>
    </Router>
  );
}

export default App;