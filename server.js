import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app      = express();
const PORT     = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme123';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── Cloudinary ──────────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqbm6n7wn',
  api_key:    process.env.CLOUDINARY_API_KEY    || '544564824583954',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rB81Ptekmw0nTFkVKpFz2hg0ntU',
});
const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'wedding-invitations',
    allowed_formats: ['jpg','jpeg','png','webp'],
    transformation: [{ width: 800, crop: 'limit', quality: 'auto' }]
  }
});
const upload = multer({ storage: cloudStorage, limits: { fileSize: 5 * 1024 * 1024 } });

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitations';
mongoose.connect(MONGODB_URI)
  .then(() => { console.log('✓ Connected to MongoDB'); initializeDatabase(); })
  .catch(err => { console.error('DB error:', err); process.exit(1); });

// ─── Schemas ──────────────────────────────────────────────────────────────────
const invitationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  image_url:   String,
  price:       { type: Number, default: 0 },
  package:     { type: String, default: 'Basic', enum: ['Basic','Premium','Luxury'] },
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
  status_note:     { type: String, default: '' },   // admin note shown in tracker
  price:           { type: Number, default: 0 },
  tracking_code:   { type: String, unique: true },  // Feature 6 — 6-digit code
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
function checkAdmin(req, res) {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  return true;
}

// Generate unique 6-digit tracking code
async function generateTrackingCode() {
  let code, exists;
  do {
    code   = String(Math.floor(100000 + Math.random() * 900000));
    exists = await Request.findOne({ tracking_code: code });
  } while (exists);
  return code;
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────
async function sendWhatsApp(message) {
  const phone  = process.env.WHATSAPP_PHONE;
  const apiKey = process.env.WHATSAPP_APIKEY;
  if (!phone || !apiKey) return;
  try {
    await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodeURIComponent(message)}&apikey=${apiKey}`);
    console.log('✓ WhatsApp sent');
  } catch (e) { console.error('WhatsApp error:', e.message); }
}

// ─── Email status update ──────────────────────────────────────────────────────
async function sendStatusUpdate(req) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) return;
  try {
    const t = nodemailer.createTransport({ service:'gmail', auth:{ user:process.env.EMAIL_USER, pass:process.env.EMAIL_PASSWORD }});
    const labels = { pending:'Pending', in_progress:'In Progress 🔧', completed:'✅ Ready!', archived:'Archived' };
    await t.sendMail({
      from: process.env.EMAIL_USER,
      to:   process.env.ADMIN_EMAIL,
      subject: `Invitation Update — ${labels[req.status]||req.status}`,
      html: `<h2>Request Update</h2><p>Dear ${req.first_name},</p><p>Your <strong>${req.invitation_name}</strong> request is now: <strong>${labels[req.status]}</strong></p>${req.status_note?`<p>Note: ${req.status_note}</p>`:''}<p>Track your order with code: <strong>${req.tracking_code}</strong></p>`
    });
    console.log('✓ Status email sent');
  } catch (e) { console.error('Email error:', e.message); }
}

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function initializeDatabase() {
  try {
    if (await Invitation.countDocuments() === 0) {
      await Invitation.insertMany([
        { name:'Classic Elegance',  description:'Timeless design with sophisticated typography', price:2500, package:'Basic',   image_url:'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop' },
        { name:'Modern Minimalist', description:'Clean lines and contemporary aesthetic',         price:3500, package:'Premium', image_url:'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop' },
        { name:'Romantic Florals',  description:'Beautiful floral patterns and soft colors',      price:3000, package:'Basic',   image_url:'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=400&h=300&fit=crop' },
        { name:'Gold Luxury',       description:'Premium design with gold accents',               price:6000, package:'Luxury',  image_url:'https://images.unsplash.com/photo-1514888286974-6c03bf1a7dba?w=400&h=300&fit=crop' },
        { name:'Artistic Modern',   description:'Contemporary art-inspired design',               price:4500, package:'Premium', image_url:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop' }
      ]);
      console.log('✓ Seeded invitations');
    }
  } catch (e) { console.error('Seed error:', e); }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════
app.get('/api/invitations', async (req, res) => {
  try { res.json(await Invitation.find().sort({ created_at:-1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/invitations/:id', async (req, res) => {
  try {
    const inv = await Invitation.findById(req.params.id);
    if (!inv) return res.status(404).json({ error:'Not found' });
    res.json(inv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Submit request — returns tracking_code
app.post('/api/requests', async (req, res) => {
  try {
    const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes, price } = req.body;
    if (!invitation_id||!first_name||!last_name||!phone_number||!wedding_date)
      return res.status(400).json({ error:'Missing required fields' });

    const tracking_code = await generateTrackingCode();
    const saved = await new Request({
      invitation_id, invitation_name, first_name, last_name,
      phone_number, wedding_date, notes:notes||'', price:price||0, tracking_code
    }).save();

    await sendWhatsApp(`🌸 New Request!\n👤 ${first_name} ${last_name}\n📱 ${phone_number}\n💍 ${wedding_date}\n🎨 ${invitation_name}\n💰 ${price||0} DA\n🔖 Code: ${tracking_code}`);

    res.json({ success:true, id:saved._id, tracking_code, message:'Request submitted successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Feature 6: Order tracking (public) ────────────────────────────────────────
app.get('/api/track/:code', async (req, res) => {
  try {
    const req2 = await Request.findOne({ tracking_code: req.params.code });
    if (!req2) return res.status(404).json({ error:'Tracking code not found' });
    // Return only safe fields — no phone/notes
    res.json({
      tracking_code:   req2.tracking_code,
      first_name:      req2.first_name,
      invitation_name: req2.invitation_name,
      wedding_date:    req2.wedding_date,
      status:          req2.status,
      status_note:     req2.status_note,
      price:           req2.price,
      created_at:      req2.created_at
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Reviews
app.get('/api/reviews', async (req, res) => {
  try { res.json(await Review.find({ approved:true }).sort({ created_at:-1 }).limit(20)); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/reviews', async (req, res) => {
  try {
    const { invitation_id, invitation_name, client_name, rating, comment } = req.body;
    if (!client_name||!rating) return res.status(400).json({ error:'Name and rating required' });
    const saved = await new Review({ invitation_id, invitation_name, client_name, rating, comment }).save();
    res.json({ success:true, id:saved._id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Analytics summary
app.get('/api/analytics/summary', async (req, res) => {
  try {
    const [total, pending, inProgress, completed, revenueAgg, monthly, topTemplates] = await Promise.all([
      Request.countDocuments(),
      Request.countDocuments({ status:'pending' }),
      Request.countDocuments({ status:'in_progress' }),
      Request.countDocuments({ status:'completed' }),
      Request.aggregate([{ $match:{ status:'completed' }},{ $group:{ _id:null, total:{ $sum:'$price' }}}]),
      Request.aggregate([
        { $match:{ created_at:{ $gte: new Date(Date.now()-6*30*24*60*60*1000) }}},
        { $group:{ _id:{ year:{ $year:'$created_at' }, month:{ $month:'$created_at' }}, count:{ $sum:1 }}},
        { $sort:{ '_id.year':1,'_id.month':1 }}
      ]),
      Request.aggregate([{ $group:{ _id:'$invitation_name', count:{ $sum:1 }}},{ $sort:{ count:-1 }},{ $limit:5 }])
    ]);
    res.json({ total, pending, inProgress, completed, revenue:revenueAgg[0]?.total||0, monthly, topTemplates });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN API
// ═══════════════════════════════════════════════════════════════════════════════
// CSV export MUST be before /:id
app.get('/api/admin/requests/export/csv', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const reqs = await Request.find().sort({ created_at:-1 });
    let csv = 'ID,Tracking,First,Last,Phone,Wedding,Template,Price,Notes,Status,Created\n';
    reqs.forEach(r => { csv += `${r._id},"${r.tracking_code}","${r.first_name}","${r.last_name}","${r.phone_number}","${r.wedding_date}","${r.invitation_name}","${r.price||0}","${r.notes||''}","${r.status}","${r.created_at}"\n`; });
    res.setHeader('Content-Type','text/csv');
    res.setHeader('Content-Disposition','attachment; filename=requests.csv');
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/requests', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json(await Request.find().sort({ created_at:-1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const update = { status: req.body.status };
    if (req.body.status_note !== undefined) update.status_note = req.body.status_note;
    const updated = await Request.findByIdAndUpdate(req.params.id, update, { new:true });
    if (updated && req.body.notify) await sendStatusUpdate(updated);
    res.json({ success:true, data:updated });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await Request.findByIdAndDelete(req.params.id); res.json({ success:true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Invitations CRUD
app.post('/api/admin/invitations', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { name, description, image_url, price, package:pkg } = req.body;
    res.json({ success:true, data: await new Invitation({ name, description, image_url, price:price||0, package:pkg||'Basic' }).save() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/admin/invitations/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try {
    const { name, description, image_url, price, package:pkg } = req.body;
    res.json({ success:true, data: await Invitation.findByIdAndUpdate(req.params.id, { name, description, image_url, price, package:pkg },{ new:true }) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/admin/invitations/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await Invitation.findByIdAndDelete(req.params.id); res.json({ success:true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// Image upload
app.post('/api/admin/upload', (req, res) => {
  if (!checkAdmin(req, res)) return;
  upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error:'No file' });
    res.json({ success:true, url: req.file.path });
  });
});

// Reviews moderation
app.get('/api/admin/reviews', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json(await Review.find().sort({ created_at:-1 })); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/admin/reviews/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { res.json({ success:true, data: await Review.findByIdAndUpdate(req.params.id,{ approved:req.body.approved },{ new:true }) }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/admin/reviews/:id', async (req, res) => {
  if (!checkAdmin(req, res)) return;
  try { await Review.findByIdAndDelete(req.params.id); res.json({ success:true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

// SPA fallback
app.get('*', (req, res) => res.sendFile(path.join(__dirname,'public','index.html')));

app.listen(PORT, () => {
  console.log(`\n🎉 Wedding Invitations v3`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🔑 Admin Key: ${ADMIN_KEY}\n`);
});
