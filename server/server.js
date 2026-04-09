require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
const sql = neon(process.env.DATABASE_URL);

// --- MIDDLEWARE ---
app.use(cors({
  origin: ['http://localhost:5173', 'https://eventhub-72dce.web.app'], // Added your Firebase URL
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

// --- VENDOR DASHBOARD & INBOX (Unified) ---
app.get('/api/vendor/dashboard-overview/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    // 1. Fetch Bookings (for Revenue and Success Rate)
    const bookings = await sql`
      SELECT b.*, p.title as package_name, p.price as package_price 
      FROM bookings b
      LEFT JOIN packages p ON b.package_id = p.package_id
      WHERE b.vendor_id = ${uid}
      ORDER BY b.created_at DESC
    `;

    // 2. Fetch Inquiries (The missing data)
    const inquiries = await sql`
      SELECT i.*, u.full_name as customer_name, u.email as customer_email
      FROM inquiries i
      LEFT JOIN users u ON i.user_id = u.firebase_uid
      WHERE i.vendor_id = ${uid}
      ORDER BY i.created_at DESC
    `;

    // 3. Calculate Stats for the Blue/Green cards
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed');
    const revenue = confirmed.reduce((sum, b) => sum + Number(b.package_price || 0), 0);
    const successRate = total > 0 ? Math.round((confirmed.length / total) * 100) : 0;

    // 4. Send everything in one response
    res.json({
      stats: { 
        revenue, 
        successRate, 
        totalInquiries: inquiries.length, 
        totalBookings: total 
      },
      bookings,
      inquiries // This ensures {data.inquiries} in your React code is populated
    });
  } catch (err) {
    console.error("Dashboard Sync Error:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});

// --- 4. BOOKING STATUS UPDATES ---
// ... (Lines 1-110: Auth and Marketplace routes)

// --- 4. BOOKING STATUS UPDATES ---
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

// --- NEW ROUTE ADDED HERE ---
app.get('/api/customer/bookings/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const result = await sql`
      SELECT 
        b.*, 
        u.full_name as vendor_name, 
        u.image_url as vendor_image,
        p.title as package_title,
        p.price as price
      FROM bookings b
      LEFT JOIN users u ON b.vendor_id = u.firebase_uid
      LEFT JOIN packages p ON b.package_id = p.package_id
      WHERE b.user_id = ${uid}
      ORDER BY b.event_date ASC
    `;
    res.json(result);
  } catch (err) {
    console.error("Customer Booking Error:", err);
    res.status(500).json({ error: "Could not fetch history" });
  }
});

// --- 5. PACKAGES & REVIEWS ---
// ... (Rest of your code follows)

// --- 5. PACKAGES & REVIEWS ---
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

// --- 6. INQUIRIES & BOOKINGS ---
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
    res.status(500).json({ error: "Inquiry failed" });
  }
});

app.post('/api/bookings', async (req, res) => {
  const { vendor_id, user_id, event_date, message, package_id } = req.body;
  try {
    const result = await sql`
      INSERT INTO bookings (vendor_id, user_id, event_date, message, status, package_id, created_at)
      VALUES (${vendor_id}, ${user_id}, ${event_date}, ${message}, 'pending', ${package_id}, NOW())
      RETURNING *
    `;
    res.status(201).json(result[0]);
  } catch (err) {
    res.status(500).json({ error: "Booking failed" });
  }
});

// --- SERVER START ---
const PORT = process.env.PORT || 5000; // Use Render's port or default to 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));