import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── ADMIN KEY ────────────────────────────────────────────────────────────────
// FIX: Provide a hard fallback so the server never starts with an undefined key.
// On Render/Railway always set ADMIN_KEY in the dashboard Environment Variables.
const ADMIN_KEY = process.env.ADMIN_KEY || 'changeme123';

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// FIX: serve static files from the "public" sub-folder
app.use(express.static(path.join(__dirname, 'public')));

// ─── MongoDB ──────────────────────────────────────────────────────────────────
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitations';

mongoose.connect(MONGODB_URI).then(() => {
  console.log('✓ Connected to MongoDB');
  initializeDatabase();
}).catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// ─── Schemas ──────────────────────────────────────────────────────────────────
const invitationSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  description: String,
  image_url:   String,
  created_at:  { type: Date, default: Date.now }
});

const requestSchema = new mongoose.Schema({
  invitation_id:   { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' },
  invitation_name: { type: String, required: true },
  first_name:      { type: String, required: true },
  last_name:       { type: String, required: true },
  phone_number:    { type: String, required: true },
  wedding_date:    { type: String, required: true },
  notes:           String,
  status:          { type: String, default: 'pending' },
  created_at:      { type: Date, default: Date.now }
});

// FIX: add a virtual "id" field so _id is also accessible as id in JSON
invitationSchema.set('toJSON', { virtuals: true });
requestSchema.set('toJSON', { virtuals: true });

const Invitation = mongoose.model('Invitation', invitationSchema);
const Request    = mongoose.model('Request',    requestSchema);

// ─── Seed ─────────────────────────────────────────────────────────────────────
async function initializeDatabase() {
  try {
    const count = await Invitation.countDocuments();
    if (count === 0) {
      await Invitation.insertMany([
        {
          name: 'Classic Elegance',
          description: 'Timeless design with sophisticated typography',
          image_url: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop'
        },
        {
          name: 'Modern Minimalist',
          description: 'Clean lines and contemporary aesthetic',
          image_url: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=400&h=300&fit=crop'
        },
        {
          name: 'Romantic Florals',
          description: 'Beautiful floral patterns and soft colors',
          image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919abe?w=400&h=300&fit=crop'
        },
        {
          name: 'Gold Luxury',
          description: 'Premium design with gold accents',
          image_url: 'https://images.unsplash.com/photo-1514888286974-6c03bf1a7dba?w=400&h=300&fit=crop'
        },
        {
          name: 'Artistic Modern',
          description: 'Contemporary art-inspired design',
          image_url: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=400&h=300&fit=crop'
        }
      ]);
      console.log('✓ Sample invitations seeded');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function checkAdminKey(req, res) {
  const key = req.query.key;
  if (!key || key !== ADMIN_KEY) {
    res.status(401).json({ error: 'Unauthorized – wrong or missing admin key' });
    return false;
  }
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────
app.get('/api/invitations', async (req, res) => {
  try {
    const invitations = await Invitation.find().sort({ created_at: -1 });
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invitations/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) return res.status(404).json({ error: 'Invitation not found' });
    res.json(invitation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/requests', async (req, res) => {
  try {
    const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes } = req.body;

    if (!invitation_id || !first_name || !last_name || !phone_number || !wedding_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const saved = await new Request({
      invitation_id, invitation_name, first_name, last_name,
      phone_number, wedding_date, notes: notes || ''
    }).save();

    sendNotificationEmail({ id: saved._id, invitation_name, first_name, last_name, phone_number, wedding_date, notes });

    res.json({ success: true, id: saved._id, message: 'Request submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Admin API ────────────────────────────────────────────────────────────────
// FIX: export/csv route MUST come BEFORE /:id so Express doesn't treat
//      "export" as a Mongo ObjectId and throw a CastError.
app.get('/api/admin/requests/export/csv', async (req, res) => {
  if (!checkAdminKey(req, res)) return;
  try {
    const requests = await Request.find().sort({ created_at: -1 });
    let csv = 'ID,First Name,Last Name,Phone,Wedding Date,Invitation,Notes,Status,Created At\n';
    requests.forEach(r => {
      csv += `${r._id},"${r.first_name}","${r.last_name}","${r.phone_number}","${r.wedding_date}","${r.invitation_name}","${r.notes || ''}","${r.status}","${r.created_at}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/requests', async (req, res) => {
  if (!checkAdminKey(req, res)) return;
  try {
    const requests = await Request.find().sort({ created_at: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdminKey(req, res)) return;
  try {
    const updated = await Request.findByIdAndUpdate(
      req.params.id, { status: req.body.status }, { new: true }
    );
    res.json({ success: true, message: 'Request updated', data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/requests/:id', async (req, res) => {
  if (!checkAdminKey(req, res)) return;
  try {
    await Request.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SPA fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🎉 Wedding Invitations Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🔑 Admin Key: ${ADMIN_KEY}`);
  console.log(`📁 Static files: ${path.join(__dirname, 'public')}\n`);
});

// ─── Email (optional) ─────────────────────────────────────────────────────────
function sendNotificationEmail(data) {
  console.log(`📧 New request: ${data.first_name} ${data.last_name} | ${data.phone_number} | ${data.wedding_date}`);
  // Uncomment and configure to send real emails via nodemailer
}
