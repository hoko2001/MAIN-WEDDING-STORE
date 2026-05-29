import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme123';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Multer ───────────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitations';
mongoose.connect(MONGODB_URI).then(() => {
  console.log('✓ Connected to MongoDB');
  initializeDatabase();
}).catch(err => { console.error('Database connection error:', err); process.exit(1); });

// ─── Schemas ──────────────────────────────────────────────────────────────────
const invitationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  image_url:   String,
  price:       { type: Number, default: 0 },
  package:     { type: String, default: 'Basic', enum: ['Basic', 'Premium', 'Luxury'] },
  order_count: { type: Number, default: 0 },
  created_at:  { type: Date, default: Date.now }
});
invitationSchema.set('toJSON', { virtuals: true });

const requestSchema = new mongoose.Schema({
  invitation_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' },
  invitation_name: { type: String, required: true },
  first_name:      { type: String, required: true },
  last_name:       { type: String, required: true },
  phone_number:    { type: String, required: true },
  wedding_date:    { type: String, required: true },
  notes:           String,
  admin_notes:     { type: String, default: '' },
  status:          { type: String, default: 'pending', enum: ['pending','in_progress','completed','archived'] },
  price:           { type: Number, default: 0 },
  tracking_id:     { type: String, unique: true, sparse: true },
  created_at:      { type: Date, default: Date.now }
});
requestSchema.set('toJSON', { virtuals: true });

const reviewSchema = new mongoose.Schema({
  invitation_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' },
  invitation_name: String,
  client_name:     { type: String, required: true },
  rating:          { type: Number, required: true, min: 1, max: 5 },
  comment:         String,
  approved:        { type: Boolean, default: false },
  created_at:      { type: Date, default: Date.now }
});
reviewSchema.set('toJSON', { virtuals: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
const Request    = mongoose.model('Request',    requestSchema);
const Review     = mongoose.model('Review',     reviewSchema);

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function initializeDatabase() {
  try {
    const count = await Invitation.countDocuments();
    if (count === 0) {
      await Invitation.insertMany([
        { name: 'Classic Elegance',   description: 'Timeless design with sophisticated typography', price: 2500, package: 'Basic',   order_count: 0, image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
        { name: 'Modern Minimalist',  description: 'Clean lines and contemporary aesthetic',         price: 3500, package: 'Premium', order_count: 0, image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop' },
        { name: 'Romantic Florals',   description: 'Beautiful floral patterns and soft colors',      price: 3000, package: 'Basic',   order_count: 0, image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=400&h=300&fit=crop' },
        { name: 'Gold Luxury',        description: 'Premium design with gold accents',               price: 6000, package: 'Luxury',  order_count: 0, image_url: 'https://images.unsplash.com/photo-1514888286974-6c03bf1a7dba?w=400&h=300&fit=crop' },
        { name: 'Artistic Modern',    description: 'Contemporary art-inspired design',               price: 4500, package: 'Premium', order_count: 0, image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop' }
      ]);
      console.log('✓ Sample invitations seeded');
    }
  } catch (err) { console.error('Seed error:', err); }
}

// ─── Auth helper — checks Authorization header OR x-admin-key header ONLY ────
// NEVER accept key via query string (prevents URL history leaks & server logs)
function checkAdmin(req, res) {
  const key = req.headers['x-admin-key'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!key || key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function generateTrackingId() {
  return crypto.randomBytes(5).toString('hex').toUpperCase();
}

// ─── Public API ───────────────────────────────────────────────────────────────

app.get('/api/invitations', async (req, res) => {
  try {
    const sort = req.query.sort === 'popular' ? { order_count: -1 } : { created_at: -1 };
    const invitations = await Invitation.find().sort(sort);
    res.json(invitations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/invitations/:id', async (req, res) => {
  try {
    const inv = await Invitation.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/invitations/:id/sample', async (req, res) => {
  try {
    const inv = await Invitation.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    res.json({ sample_url: inv.image_url, name: inv.name, watermark: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Public order tracking — returns ONLY safe public fields (no business data)
app.get('/api/track/:trackingId', async (req, res) => {
  try {
    const order = await Request.findOne({ tracking_id: req.params.trackingId });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
      tracking_id:     order.tracking_id,
      first_name:      order.first_name,
      invitation_name: order.invitation_name,
      wedding_date:    order.wedding_date,
      status:          order.status,
      created_at:      order.created_at
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes, price } = req.body;
    if (!invitation_id || !first_name || !last_name || !phone_number || !wedding_date)
      return res.status(400).json({ error: 'Missing required fields' });

    let tracking_id, attempts = 0;
    do {
      tracking_id = generateTrackingId();
      attempts++;
    } while (attempts < 10 && await Request.findOne({ tracking_id }));

    const saved = await new Request({
      invitation_id, invitation_name, first_name, last_name,
      phone_number, wedding_date, notes, price: price || 0, tracking_id
    }).save();

    // Increment order count on template
    await Invitation.findByIdAndUpdate(invitation_id, { $inc: { order_count: 1 } });

    const siteUrl = `${req.protocol}://${req.get('host')}`;
    const trackUrl = `${siteUrl}/track/${tracking_id}`;
    console.log('✓ New request saved:', saved._id);
    res.json({ success: true, id: saved._id, tracking_id, track_url: trackUrl, message: 'Request submitted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews — public (approved only)
app.get('/api/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({ approved: true }).sort({ created_at: -1 }).limit(20);
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { invitation_id, invitation_name, client_name, rating, comment } = req.body;
    if (!client_name || !rating) return res.status(400).json({ error: 'Name and rating required' });
    const saved = await new Review({ invitation_id, invitation_name, client_name, rating, comment }).save();
    res.json({ success: true, id: saved._id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PUBLIC stats — SAFE for customers to see (no revenue, no pending counts) ─
// Shows only what builds social proof: completed orders, template count
app.get('/api/public/stats', async (req, res) => {
  try {
    const completed   = await Request.countDocuments({ status: 'completed' });
    const templates   = await Invitation.countDocuments();
    const reviews     = await Review.countDocuments({ approved: true });
    res.json({ completed, templates, reviews });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin API (all require x-admin-key header) ───────────────────────────────

app.get('/api/admin/requests/export/csv', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const requests = await Request.find().sort({ created_at: -1 });
    let csv = 'ID,Tracking ID,First Name,Last Name,Phone,Wedding Date,Invitation,Price,Notes,Admin Notes,Status,Created At\n';
    requests.forEach(r => {
      csv += `${r._id},"${r.tracking_id||''}","${r.first_name}","${r.last_name}","${r.phone_number}","${r.wedding_date}","${r.invitation_name}","${r.price||0}","${(r.notes||'').replace(/"/g,'""')}","${(r.admin_notes||'').replace(/"/g,'""')}","${r.status}","${r.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/requests', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
    const requests = await Request.find(filter).sort({ created_at: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bulk status update
app.put('/api/admin/requests/bulk', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { ids, status } = req.body;
    if (!ids?.length || !status) return res.status(400).json({ error: 'ids and status required' });
    await Request.updateMany({ _id: { $in: ids } }, { status });
    res.json({ success: true, updated: ids.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Bulk DELETE — new endpoint
app.delete('/api/admin/requests/bulk', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'ids required' });
    const result = await Request.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const update = { status: req.body.status };
    if (req.body.admin_notes !== undefined) update.admin_notes = req.body.admin_notes;
    const updated = await Request.findByIdAndUpdate(req.params.id, update, { new: true });
    res.json({ success: true, data: updated });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin analytics — full data, admin-only
app.get('/api/admin/analytics', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const total      = await Request.countDocuments();
    const pending    = await Request.countDocuments({ status: 'pending' });
    const inProgress = await Request.countDocuments({ status: 'in_progress' });
    const completed  = await Request.countDocuments({ status: 'completed' });

    const revenueAgg = await Request.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]);
    const revenue = revenueAgg[0]?.total || 0;

    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await Request.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const topTemplates = await Request.aggregate([
      { $group: { _id: '$invitation_name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({ total, pending, inProgress, completed, revenue, monthly, topTemplates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Admin — invitations CRUD
app.post('/api/admin/invitations', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { name, description, image_url, price, package: pkg } = req.body;
    const inv = await new Invitation({ name, description, image_url, price: price||0, package: pkg||'Basic' }).save();
    res.json({ success: true, data: inv });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/invitations/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { name, description, image_url, price, package: pkg } = req.body;
    const inv = await Invitation.findByIdAndUpdate(req.params.id, { name, description, image_url, price, package: pkg }, { new: true });
    res.json({ success: true, data: inv });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/invitations/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    await Invitation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Image upload
app.post('/api/admin/upload', (req, res) => {
  if (!checkAdmin(req, res)) return;
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: imageUrl });
  });
});

// Admin — reviews moderation
app.get('/api/admin/reviews', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const reviews = await Review.find().sort({ created_at: -1 });
    res.json(reviews);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/reviews/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const r = await Review.findByIdAndUpdate(req.params.id, { approved: req.body.approved }, { new: true });
    res.json({ success: true, data: r });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/admin/reviews/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const idx = path.join(__dirname, 'public', 'index.html');
  const idx2 = path.join(__dirname, 'index.html');
  if (fs.existsSync(idx)) res.sendFile(idx);
  else res.sendFile(idx2);
});

app.listen(PORT, () => {
  console.log(`\n🎉 Wedding Invitations Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 Admin Key: ${ADMIN_KEY}`);
  console.log(`📁 Static: ${path.join(__dirname, 'public')}\n`);
});
