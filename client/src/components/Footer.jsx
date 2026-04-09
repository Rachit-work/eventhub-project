import { Send } from 'lucide-react';

export default function Footer() {
  const quickLinks = ['About Us', 'Contact', 'Help Center'];
  const legalLinks = ['Privacy Policy', 'Terms of Service'];

  return (
    <footer className="bg-white border-t border-gray-100 px-10 pt-20 pb-10 text-gray-600">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          
          {/* Column 1: Brand and Mission */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">EventHub</h2>
            <p className="text-sm leading-relaxed max-w-sm">
              Connecting event visionaries with world-class vendors to create moments that last a lifetime.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wider">
              Quick Links
            </h3>
            <ul className="space-y-3.5 text-sm">
              {quickLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-black transition">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-5 uppercase tracking-wider">
              Legal
            </h3>
            <ul className="space-y-3.5 text-sm">
              {legalLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="hover:text-black transition">{link}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Newsletter
            </h3>
            <p className="text-sm leading-relaxed">
              Get the latest event inspiration and vendor news.
            </p>
            
            {/* Newsletter Input */}
            <div className="bg-white p-2 rounded-full border border-gray-200 flex items-center shadow-inner gap-3">
              <input 
                type="email" 
                placeholder="Email address..." 
                className="w-full text-sm outline-none px-3"
              />
              <button className="bg-[#111827] text-white p-3 rounded-full hover:bg-black transition-colors flex-shrink-0">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-100 pt-8 text-center text-xs text-gray-400">
          © 2026 EventHub Marketplace. Built for excellence.
        </div>
      </div>
    </footer>
  );
}
