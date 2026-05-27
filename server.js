import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wedding-invitations';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✓ Connected to MongoDB');
  initializeDatabase();
}).catch((err) => {
  console.error('Database connection error:', err);
  process.exit(1);
});

// Define Schemas
const invitationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  image_url: String,
  created_at: { type: Date, default: Date.now }
});

const requestSchema = new mongoose.Schema({
  invitation_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Invitation' },
  invitation_name: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  phone_number: { type: String, required: true },
  wedding_date: { type: String, required: true },
  notes: String,
  status: { type: String, default: 'pending' },
  created_at: { type: Date, default: Date.now }
});

const Invitation = mongoose.model('Invitation', invitationSchema);
const Request = mongoose.model('Request', requestSchema);

// Initialize database with sample data
async function initializeDatabase() {
  try {
    const count = await Invitation.countDocuments();
    
    if (count === 0) {
      const invitations = [
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
      ];

      await Invitation.insertMany(invitations);
      console.log('✓ Sample invitations seeded');
    }
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

// API Routes

// Get all invitations
app.get('/api/invitations', async (req, res) => {
  try {
    const invitations = await Invitation.find().sort({ created_at: -1 });
    res.json(invitations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single invitation
app.get('/api/invitations/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    if (!invitation) {
      return res.status(404).json({ error: 'Invitation not found' });
    }
    res.json(invitation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new request
app.post('/api/requests', async (req, res) => {
  try {
    const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes } = req.body;

    // Validation
    if (!invitation_id || !first_name || !last_name || !phone_number || !wedding_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newRequest = new Request({
      invitation_id,
      invitation_name,
      first_name,
      last_name,
      phone_number,
      wedding_date,
      notes: notes || ''
    });

    const savedRequest = await newRequest.save();

    // Send notification email
    sendNotificationEmail({
      id: savedRequest._id,
      invitation_name,
      first_name,
      last_name,
      phone_number,
      wedding_date,
      notes
    });

    res.json({
      success: true,
      id: savedRequest._id,
      message: 'Request submitted successfully'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all requests (admin)
app.get('/api/admin/requests', async (req, res) => {
  try {
    const adminKey = req.query.key;
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requests = await Request.find().sort({ created_at: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update request status (admin)
app.put('/api/admin/requests/:id', async (req, res) => {
  try {
    const adminKey = req.query.key;
    const { status } = req.body;

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    res.json({ success: true, message: 'Request updated', data: updatedRequest });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete request (admin)
app.delete('/api/admin/requests/:id', async (req, res) => {
  try {
    const adminKey = req.query.key;

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await Request.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Request deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export requests as CSV (admin)
app.get('/api/admin/requests/export/csv', async (req, res) => {
  try {
    const adminKey = req.query.key;

    if (adminKey !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const requests = await Request.find().sort({ created_at: -1 });
    
    let csv = 'ID,First Name,Last Name,Phone,Wedding Date,Invitation,Notes,Status,Created At\n';
    requests.forEach(row => {
      csv += `${row._id},"${row.first_name}","${row.last_name}","${row.phone_number}","${row.wedding_date}","${row.invitation_name}","${row.notes || ''}","${row.status}","${row.created_at}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Email notification function
function sendNotificationEmail(requestData) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  
  console.log('📧 New request notification:');
  console.log(`   From: ${requestData.first_name} ${requestData.last_name}`);
  console.log(`   Phone: ${requestData.phone_number}`);
  console.log(`   Wedding Date: ${requestData.wedding_date}`);
  console.log(`   Template: ${requestData.invitation_name}`);
  console.log(`   Notes: ${requestData.notes}`);
  
  // Optional: Uncomment to send actual emails
  /*
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: adminEmail,
    subject: `New Invitation Request from ${requestData.first_name} ${requestData.last_name}`,
    html: `
      <h2>New Request Submitted</h2>
      <p><strong>Name:</strong> ${requestData.first_name} ${requestData.last_name}</p>
      <p><strong>Phone:</strong> ${requestData.phone_number}</p>
      <p><strong>Wedding Date:</strong> ${requestData.wedding_date}</p>
      <p><strong>Template:</strong> ${requestData.invitation_name}</p>
      <p><strong>Notes:</strong> ${requestData.notes}</p>
    `
  };

  transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
      console.error('Email error:', err);
    } else {
      console.log('Email sent:', info.response);
    }
  });
  */
}

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🎉 Wedding Invitations Server Running`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`📁 Database: MongoDB`);
  console.log(`\n✨ Admin Key: ${process.env.ADMIN_KEY || 'Set ADMIN_KEY environment variable'}`);
  console.log('\n');
});
