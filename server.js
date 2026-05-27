import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

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
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Multer (image uploads) ───────────────────────────────────────────────────
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
  status:          { type: String, default: 'pending', enum: ['pending','in_progress','completed','archived'] },
  price:           { type: Number, default: 0 },
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
        { name: 'Classic Elegance',   description: 'Timeless design with sophisticated typography', price: 2500, package: 'Basic',   image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
        { name: 'Modern Minimalist',  description: 'Clean lines and contemporary aesthetic',         price: 3500, package: 'Premium', image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop' },
        { name: 'Romantic Florals',   description: 'Beautiful floral patterns and soft colors',      price: 3000, package: 'Basic',   image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=400&h=300&fit=crop' },
        { name: 'Gold Luxury',        description: 'Premium design with gold accents',               price: 6000, package: 'Luxury',  image_url: 'https://images.unsplash.com/photo-1514888286974-6c03bf1a7dba?w=400&h=300&fit=crop' },
        { name: 'Artistic Modern',    description: 'Contemporary art-inspired design',               price: 4500, package: 'Premium', image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop' }
      ]);
      console.log('✓ Sample invitations seeded');
    }
  } catch (err) { console.error('Seed error:', err); }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function checkAdmin(req, res) {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

// ─── WhatsApp Notification (CallMeBot) ────────────────────────────────────────
async function sendWhatsApp(message) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apiKey) return;
  try {
    const encoded = encodeURIComponent(message);
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encoded}&apikey=${apiKey}`;
    await fetch(url);
    console.log('✓ WhatsApp notification sent');
  } catch (err) { console.error('WhatsApp error:', err.message); }
}

// ─── SMS / Email status update ────────────────────────────────────────────────
async function sendStatusUpdate(requestData) {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASSWORD;
  if (!emailUser || !emailPass) return;
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: emailUser, pass: emailPass }
    });
    const statusLabel = { pending: 'Pending', in_progress: 'In Progress', completed: '✅ Completed & Ready!', archived: 'Archived' };
    await transporter.sendMail({
      from: emailUser,
      to: requestData.client_email || process.env.ADMIN_EMAIL,
      subject: `Your Invitation Request Update — ${statusLabel[requestData.status] || requestData.status}`,
      html: `
        <h2>Invitation Request Update</h2>
        <p>Dear ${requestData.first_name},</p>
        <p>Your request for <strong>${requestData.invitation_name}</strong> has been updated to: <strong>${statusLabel[requestData.status]}</strong></p>
        ${requestData.status === 'completed' ? '<p>Your invitation is ready! We will contact you shortly.</p>' : ''}
        <p>Thank you for choosing us!</p>
      `
    });
    console.log('✓ Status email sent');
  } catch (err) { console.error('Email error:', err.message); }
}

// ─── Public API ───────────────────────────────────────────────────────────────
app.get('/api/invitations', async (req, res) => {
  try {
    const invitations = await Invitation.find().sort({ created_at: -1 });
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

app.post('/api/requests', async (req, res) => {
  try {
    const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes, price } = req.body;
    if (!invitation_id || !first_name || !last_name || !phone_number || !wedding_date)
      return res.status(400).json({ error: 'Missing required fields' });

    const saved = await new Request({ invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes: notes||'', price: price||0 }).save();

    await sendWhatsApp(
      `🌸 New Wedding Invitation Request!\n👤 ${first_name} ${last_name}\n📱 ${phone_number}\n💍 Wedding: ${wedding_date}\n🎨 Template: ${invitation_name}\n💰 Price: ${price||0} DA\n📝 Notes: ${notes||'None'}`
    );

    res.json({ success: true, id: saved._id, message: 'Request submitted successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Reviews — public
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

// Analytics — public summary (no sensitive data)
app.get('/api/analytics/summary', async (req, res) => {
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

    // Requests per month (last 6 months)
    const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthly = await Request.aggregate([
      { $match: { created_at: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Top templates
    const topTemplates = await Request.aggregate([
      { $group: { _id: '$invitation_name', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    res.json({ total, pending, inProgress, completed, revenue, monthly, topTemplates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admin API ────────────────────────────────────────────────────────────────
// IMPORTANT: export/csv MUST be before /:id
app.get('/api/admin/requests/export/csv', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const requests = await Request.find().sort({ created_at: -1 });
    let csv = 'ID,First Name,Last Name,Phone,Wedding Date,Invitation,Price,Notes,Status,Created At\n';
    requests.forEach(r => {
      csv += `${r._id},"${r.first_name}","${r.last_name}","${r.phone_number}","${r.wedding_date}","${r.invitation_name}","${r.price||0}","${r.notes||''}","${r.status}","${r.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
    res.send(csv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/requests', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const requests = await Request.find().sort({ created_at: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const updated = await Request.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (updated && req.body.notify) await sendStatusUpdate(updated);
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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🎉 Wedding Invitations Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 Admin Key: ${ADMIN_KEY}`);
  console.log(`📁 Static: ${path.join(__dirname, 'public')}\n`);
});
