import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sqlite3 from 'sqlite3';
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

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, 'data', 'invitations.db'), (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('✓ Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    // Create invitations table
    db.run(`
      CREATE TABLE IF NOT EXISTS invitations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        image_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create requests table
    db.run(`
      CREATE TABLE IF NOT EXISTS requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invitation_id INTEGER NOT NULL,
        invitation_name TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        wedding_date TEXT NOT NULL,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(invitation_id) REFERENCES invitations(id)
      )
    `);

    // Seed invitations if empty
    db.get('SELECT COUNT(*) as count FROM invitations', (err, row) => {
      if (row.count === 0) {
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

        invitations.forEach(inv => {
          db.run(
            'INSERT INTO invitations (name, description, image_url) VALUES (?, ?, ?)',
            [inv.name, inv.description, inv.image_url]
          );
        });
        console.log('✓ Sample invitations seeded');
      }
    });
  });
}

// API Routes

// Get all invitations
app.get('/api/invitations', (req, res) => {
  db.all('SELECT * FROM invitations ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Get single invitation
app.get('/api/invitations/:id', (req, res) => {
  db.get('SELECT * FROM invitations WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: 'Invitation not found' });
    } else {
      res.json(row);
    }
  });
});

// Create new request
app.post('/api/requests', (req, res) => {
  const { invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes } = req.body;

  // Validation
  if (!invitation_id || !first_name || !last_name || !phone_number || !wedding_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  db.run(
    'INSERT INTO requests (invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [invitation_id, invitation_name, first_name, last_name, phone_number, wedding_date, notes || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Send notification email
        sendNotificationEmail({
          id: this.lastID,
          invitation_name,
          first_name,
          last_name,
          phone_number,
          wedding_date,
          notes
        });

        res.json({
          success: true,
          id: this.lastID,
          message: 'Request submitted successfully'
        });
      }
    }
  );
});

// Get all requests (admin)
app.get('/api/admin/requests', (req, res) => {
  const adminKey = req.query.key;
  
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Update request status (admin)
app.put('/api/admin/requests/:id', (req, res) => {
  const adminKey = req.query.key;
  const { status } = req.body;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.run(
    'UPDATE requests SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ success: true, message: 'Request updated' });
      }
    }
  );
});

// Delete request (admin)
app.delete('/api/admin/requests/:id', (req, res) => {
  const adminKey = req.query.key;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.run('DELETE FROM requests WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true, message: 'Request deleted' });
    }
  });
});

// Export requests as CSV (admin)
app.get('/api/admin/requests/export/csv', (req, res) => {
  const adminKey = req.query.key;

  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  db.all('SELECT * FROM requests ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      let csv = 'ID,First Name,Last Name,Phone,Wedding Date,Invitation,Notes,Status,Created At\n';
      rows.forEach(row => {
        csv += `${row.id},"${row.first_name}","${row.last_name}","${row.phone_number}","${row.wedding_date}","${row.invitation_name}","${row.notes}","${row.status}","${row.created_at}"\n`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=requests.csv');
      res.send(csv);
    }
  });
});

// Email notification function
function sendNotificationEmail(requestData) {
  // Configure your email settings here
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  
  // You can use any email service (Gmail, SendGrid, etc.)
  // For now, we'll just log it
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
  console.log(`📁 Database: ${path.join(__dirname, 'data', 'invitations.db')}`);
  console.log(`\n✨ Admin Key: ${process.env.ADMIN_KEY || 'Set ADMIN_KEY environment variable'}`);
  console.log('\n');
});
