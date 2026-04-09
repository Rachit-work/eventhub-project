require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

// --- MIDDLEWARE ---
app.use(cors({
  origin: ['http://localhost:5173', 'https://eventhub-72dce.web.app'], 
  methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// --- DATABASE HEALTH CHECK ---
const checkConnection = async () => {
  try {
    await sql`SELECT 1`;
    console.log("✅ Master Server Connected to Neon Database");
  } catch (err) {
    console.error("❌ Database Connection Failed:", err.message);
  }
};
checkConnection();

// --- 1. USER & AUTH ---
app.get('/api/user/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    // Add email to the SELECT
    const result = await sql`SELECT role, full_name, email FROM users WHERE firebase_uid = ${uid}`;
    if (result.length > 0) res.json(result[0]);
    else res.status(404).json({ error: "User not found" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/register', async (req, res) => {
  const { uid, role, name, email, phone, city } = req.body;
  try {
    const result = await sql`
      INSERT INTO users (firebase_uid, role, full_name, email, phone, city) 
      VALUES (${uid}, ${role.toLowerCase()}, ${name}, ${email}, ${phone}, ${city})
      ON CONFLICT (firebase_uid) 
      DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) { 
    res.status(500).json({ error: "Registration failed" }); 
  }
});

// --- 2. MARKETPLACE & VENDORS ---
app.get('/api/vendors', async (req, res) => {
  try {
    const result = await sql`
      SELECT 
        u.firebase_uid as id, u.full_name as name, u.category, u.city, u.price, u.image_url as image, 
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as rating,
        COUNT(r.review_id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.firebase_uid = r.vendor_id
      WHERE LOWER(u.role) = 'vendor'
      GROUP BY u.firebase_uid, u.full_name, u.category, u.city, u.price, u.image_url
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

app.get('/api/vendors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await sql`
      SELECT u.*, u.firebase_uid as id, u.full_name as name,
        COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0) as avg_rating,
        COUNT(r.review_id) as review_count
      FROM users u
      LEFT JOIN reviews r ON u.firebase_uid = r.vendor_id
      WHERE u.firebase_uid = ${id}
      GROUP BY u.id, u.firebase_uid
    `;
    if (result.length > 0) res.json(result[0]);
    else res.status(404).json({ error: "Vendor not found" });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// --- 3. UNIFIED VENDOR DASHBOARD OVERVIEW ---
// This single route handles bookings, inquiries, and stats calculation.
app.get('/api/vendor/dashboard-overview/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
// A. Fetch Bookings with Package AND Customer Details
const bookings = await sql`
  SELECT
    b.*,
    p.title as package_name,
    p.price as package_price,
    u.full_name as customer_name, -- Added: Get customer name
    u.email as customer_email     -- Added: Get customer email
  FROM bookings b
  LEFT JOIN packages p ON b.package_id = p.package_id
  LEFT JOIN users u ON b.user_id = u.firebase_uid -- Added: Join user table
  WHERE b.vendor_id = ${uid}
  ORDER BY b.created_at DESC
`;

// B. Fetch Inquiries with Customer Names
const inquiries = await sql`
  SELECT i.*,
         COALESCE(u.full_name, 'Guest User') as customer_name,
         COALESCE(u.email, 'No email') as customer_email
  FROM inquiries i
  LEFT JOIN users u ON i.user_id = u.firebase_uid
  WHERE i.vendor_id = ${uid}
  ORDER BY i.created_at DESC
`;

    // C. Calculate Stats for Dashboard Cards
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const revenue = confirmed.reduce((sum, b) => sum + Number(b.package_price || 0), 0);
    const successRate = total > 0 ? Math.round((confirmed.length / total) * 100) : 0;
    

    res.json({
      stats: { revenue, successRate, totalInquiries: inquiries.length, totalBookings: total },
      bookings,
      inquiries 
    });
  } catch (err) {
    console.error("Dashboard Sync Error:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// --- 4. BOOKINGS ---

// --- 4. BOOKINGS (FIXED) ---
app.post('/api/bookings', async (req, res) => {
  const { vendor_id, user_id, event_date, message, package_id } = req.body;
  
  // Validation: Ensure we don't send nulls to the DB
  if (!vendor_id || !user_id || !package_id) {
    return res.status(400).json({ error: "Missing required booking details" });
  }

  try {
    const result = await sql`
      INSERT INTO bookings (vendor_id, user_id, event_date, message, status, package_id, created_at)
      VALUES (
        ${vendor_id}, 
        ${user_id}, 
        ${event_date}, 
        ${message}, 
        'pending', 
        ${Number(package_id)}, -- Fix: Ensure package_id is a number
        NOW()
      )
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    console.error("Booking POST Error:", err);
    res.status(500).json({ error: "Booking failed. Ensure all fields are valid." });
  }
});

app.patch('/api/bookings/:bookingId/status', async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  try {
    const result = await sql`
      UPDATE bookings SET status = ${status} WHERE booking_id = ${bookingId} RETURNING *
    `;
    res.json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// --- 5. INQUIRIES & REVIEWS ---
app.post('/api/inquiries', async (req, res) => {
  const { vendor_id, user_id, message } = req.body;
  try {
    const result = await sql`
      INSERT INTO inquiries (vendor_id, user_id, message, created_at)
      VALUES (${vendor_id}, ${user_id}, ${message}, NOW())
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to send inquiry" });
  }
});

app.post('/api/reviews', async (req, res) => {
  const { vendor_id, user_id, rating, comment } = req.body;
  try {
    const result = await sql`
      INSERT INTO reviews (vendor_id, user_id, rating, comment, created_at)
      VALUES (${vendor_id}, ${user_id}, ${rating}, ${comment}, NOW())
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to post review" });
  }
});
// Add this to index.js (Section 5)
app.get('/api/inquiries/customer/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await sql`
      SELECT i.*, u.full_name as vendor_name 
      FROM inquiries i
      JOIN users u ON i.vendor_id = u.firebase_uid
      WHERE i.user_id = ${uid}
      ORDER BY i.created_at DESC
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inquiries" });
  }
});

// --- 6. PACKAGES & FETCH REVIEWS ---
app.get('/api/packages/:vendor_id', async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const result = await sql`SELECT * FROM packages WHERE vendor_id = ${vendor_id} ORDER BY price ASC`;
    const sanitized = result.map(pkg => ({
      ...pkg,
      features: Array.isArray(pkg.features) ? pkg.features : []
    }));
    res.json(sanitized);
  } catch (err) {
    res.status(500).json({ error: "Packages failed" });
  }
});

app.get('/api/reviews/:vendor_id', async (req, res) => {
  const { vendor_id } = req.params;
  try {
    const result = await sql`
      SELECT r.*, u.full_name as reviewer_name 
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.firebase_uid
      WHERE r.vendor_id = ${vendor_id}
      ORDER BY r.created_at DESC
    `;
    res.json(result);
  } catch (err) {
    res.json([]);
  }
});
// --- GET CUSTOMER HISTORY ---
app.get('/api/customer/bookings/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await sql`
      SELECT b.*, u.full_name as vendor_name, p.title as package_name
      FROM bookings b
      JOIN users u ON b.vendor_id = u.firebase_uid
      JOIN packages p ON b.package_id = p.package_id
      WHERE b.user_id = ${uid}
      ORDER BY b.event_date ASC
    `;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch booking history" });
  }
});
app.get('/api/admin/stats', async (req, res) => {
  try {
    const usersCount = await sql`SELECT COUNT(*) FROM users`;
    const vendorsCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'vendor'`;
    const platformVolume = await sql`SELECT SUM(p.price) FROM bookings b JOIN packages p ON b.package_id = p.package_id WHERE b.status = 'confirmed'`;
    const pendingVendors = await sql`SELECT full_name, city, email FROM users WHERE role = 'vendor' AND firebase_uid NOT IN (SELECT vendor_id FROM bookings)`; // Adjust logic for your approval process

    res.json({
      totalUsers: parseInt(usersCount[0].count),
      activeVendors: parseInt(vendorsCount[0].count),
      platformVolume: parseFloat(platformVolume[0].sum || 0),
      pendingVendors
    });
  } catch (err) {
    res.status(500).json({ error: "Admin stats failed" });
  }
});
// --- ADMIN ROUTES ---

// 1. GET Overview Stats & Pending Vendors
app.get('/api/admin/overview', async (req, res) => {
  try {
    // Get Counts
    const usersCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'customer'`;
    const vendorsCount = await sql`SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_approved = true`;
    
    // Get Platform Volume (Sum of confirmed booking package prices)
    const revenueResult = await sql`
      SELECT SUM(p.price) as total 
      FROM bookings b 
      JOIN packages p ON b.package_id = p.package_id 
      WHERE b.status = 'confirmed'
    `;

    // Get Pending Vendors (Assuming you add an 'is_approved' column)
    const pendingVendors = await sql`
      SELECT firebase_uid, full_name, email, city 
      FROM users 
      WHERE role = 'vendor' AND is_approved = false
      ORDER BY created_at DESC
    `;

    res.json({
      stats: {
        users: parseInt(usersCount[0].count),
        vendors: parseInt(vendorsCount[0].count),
        revenue: parseFloat(revenueResult[0].total || 0)
      },
      pending: pendingVendors
    });
  } catch (err) {
    console.error("Admin Overview Error:", err);
    res.status(500).json({ error: "Failed to fetch admin data" });
  }
});

// 2. POST Approve Vendor
app.post('/api/admin/approve-vendor', async (req, res) => {
  const { firebase_uid } = req.body;
  try {
    const result = await sql`
      UPDATE users 
      SET is_approved = true 
      WHERE firebase_uid = ${firebase_uid} 
      RETURNING *
    `;
    res.json({ message: "Vendor approved successfully", vendor: result[0] });
  } catch (err) {
    res.status(500).json({ error: "Approval failed" });
  }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000; // Use Render's port or default to 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))