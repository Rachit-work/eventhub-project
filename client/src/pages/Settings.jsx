import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Settings() {
  const [dbUser, setDbUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (userAuth) => {
      if (userAuth) {
        try {
          const res = await fetch(`http://localhost:5000/api/user/${userAuth.uid}`);
          const data = await res.json();
          // Ensure gallery_urls is always an array to prevent .join errors
          setDbUser({
            ...data,
            gallery_urls: data.gallery_urls || []
          });
        } catch (err) {
          console.error("Fetch error:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Handle case where user is logged out
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`http://localhost:5000/api/user/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dbUser)
      });
      if (res.ok) alert("Profile updated successfully!");
      else alert("Server error while updating.");
    } catch (err) {
      alert("Update failed.");
    } finally {
      setSaving(false);
    }
  };

  // 1. CRITICAL FIX: Don't render the form until dbUser is loaded
  if (loading) return <div className="p-20 text-center font-bold">Loading Settings...</div>;
  if (!dbUser) return <div className="p-20 text-center font-bold text-red-500">User not found. Please log in.</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-3xl mx-auto bg-white rounded-[2.5rem] p-10 shadow-sm border">
        <h1 className="text-3xl font-black mb-8">Account Settings</h1>
        
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2">Full Name</label>
              <input 
                className="w-full p-4 bg-gray-50 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-orange-200"
                value={dbUser.full_name || ''}
                onChange={(e) => setDbUser({...dbUser, full_name: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-gray-400 ml-2">City</label>
              <input 
                className="w-full p-4 bg-gray-50 rounded-2xl mt-1 outline-none focus:ring-2 focus:ring-orange-200"
                value={dbUser.city || ''}
                onChange={(e) => setDbUser({...dbUser, city: e.target.value})}
                required
              />
            </div>
          </div>

          {/* VENDOR ONLY FIELDS */}
          {dbUser.role === 'Vendor' && (
            <>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Service Description</label>
                <textarea 
                  className="w-full p-4 bg-gray-50 rounded-2xl mt-1 h-32 border-none focus:ring-2 focus:ring-orange-200"
                  value={dbUser.description || ''}
                  placeholder="Describe your services..."
                  onChange={(e) => setDbUser({...dbUser, description: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-gray-400 ml-2">Portfolio Image URLs (comma separated)</label>
                <input 
                  className="w-full p-4 bg-gray-50 rounded-2xl mt-1 border-none focus:ring-2 focus:ring-orange-200"
                  // 2. FIX: Cleaner way to handle the array-to-string conversion
                  value={dbUser.gallery_urls.join(', ')}
                  placeholder="https://image1.jpg, https://image2.jpg"
                  onChange={(e) => {
                    const urls = e.target.value.split(',').map(url => url.trim());
                    setDbUser({...dbUser, gallery_urls: urls});
                  }}
                />
              </div>
            </>
          )}

          <button 
            type="submit" 
            disabled={saving}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-bold hover:bg-[#c25e4c] transition-all disabled:opacity-50"
          >
            {saving ? "Saving Changes..." : "Save Settings"}
          </button>
        </form>
      </div>
    </div>
  );
}
