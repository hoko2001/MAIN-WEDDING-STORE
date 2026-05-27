# Wedding Invitations Website - Complete Standalone Version

A fully independent, production-ready wedding invitation website with backend, database, admin panel, and everything you need. **NO Manus dependencies - works anywhere.**

## Features

✨ **Modern Gallery-First Design**
- Beautiful pink color scheme with gradient accents
- Responsive grid layout (1-4 columns based on screen)
- Smooth hover animations and transitions
- Search and filter functionality

📝 **Client Request Form**
- Collects: First name, last name, phone, wedding date, invitation selection, notes
- Modal-based design with validation
- Success confirmation screen
- All data saved to database

🗄️ **Backend & Database**
- Node.js + Express.js server
- SQLite database (no external DB needed)
- RESTful API for all operations
- Automatic email notifications (configurable)

👨‍💼 **Admin Dashboard**
- Secure admin panel with key authentication
- View all client requests
- Update request status (pending, in progress, completed, archived)
- Delete requests
- Export all requests as CSV

📱 **Fully Responsive**
- Mobile, tablet, desktop optimized
- Touch-friendly interface
- Fast loading times

## File Structure

```
wedding-invitations-standalone/
├── server.js              # Express.js backend
├── package.json           # Node.js dependencies
├── data/                  # Database folder (created automatically)
│   └── invitations.db     # SQLite database
├── public/                # Frontend files
│   ├── index.html         # Main HTML
│   ├── styles.css         # All styling
│   ├── app.js             # Frontend JavaScript
│   └── favicon.ico        # Website icon
└── README.md              # This file
```

## Installation & Setup

### Option 1: Local Development (Recommended for Testing)

**Requirements:**
- Node.js 14+ installed
- npm or yarn

**Steps:**

1. **Extract the files** to a folder on your computer

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create data folder:**
   ```bash
   mkdir data
   ```

4. **Set environment variables** (optional):
   ```bash
   export ADMIN_KEY=your-secret-key-here
   export PORT=3000
   ```

5. **Start the server:**
   ```bash
   npm start
   ```

6. **Open in browser:**
   ```
   http://localhost:3000
   ```

### Option 2: Deploy to Cheapname (or Any Hosting)

**Requirements:**
- Node.js hosting (most providers support it)
- SSH/Terminal access or cPanel

**Steps:**

1. **Upload files via FTP/SFTP:**
   - Connect to your hosting via FTP
   - Upload all files to your hosting folder
   - Keep the folder structure intact

2. **Install dependencies on server:**
   ```bash
   cd /path/to/wedding-invitations-standalone
   npm install
   ```

3. **Set environment variables:**
   - Create `.env` file in root folder:
   ```
   ADMIN_KEY=your-secret-admin-key
   PORT=3000
   ADMIN_EMAIL=your-email@example.com
   ```

4. **Start the server:**
   ```bash
   npm start
   ```
   
   Or use a process manager (recommended):
   ```bash
   npm install -g pm2
   pm2 start server.js --name "wedding-invitations"
   pm2 save
   pm2 startup
   ```

5. **Point your domain:**
   - Update your DNS settings to point to your hosting IP
   - Wait 24 hours for DNS propagation

## Configuration

### Admin Key

Set a strong admin key for security:

**On your computer:**
```bash
export ADMIN_KEY="your-super-secret-key-12345"
npm start
```

**On hosting server:**
Edit `.env` file:
```
ADMIN_KEY=your-super-secret-key-12345
```

### Email Notifications

To enable email notifications when clients submit requests:

1. Edit `server.js` and uncomment the email section (around line 180)
2. Set up email credentials in `.env`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
ADMIN_EMAIL=admin@yourdomain.com
```

3. Restart the server

### Customize Invitations

Edit the invitations in `server.js` (line 50-70):

```javascript
const invitations = [
    {
        name: 'Your Template Name',
        description: 'Your description',
        image_url: 'https://your-image-url.jpg'
    },
    // Add more...
];
```

Or add them via database directly.

## Admin Access

### Login to Admin Panel

1. Click **Admin** link in navigation
2. Enter your admin key
3. View all requests, update status, export CSV

### Admin Functions

**View Requests:**
- See all client submissions
- Filter by status
- View client details

**Update Status:**
- Change request status (pending → in progress → completed → archived)
- Track progress

**Export Data:**
- Download all requests as CSV
- Import to Excel/Google Sheets
- Backup your data

**Delete Requests:**
- Remove old/test requests
- Keep database clean

## API Endpoints

### Public Endpoints

**Get all invitations:**
```
GET /api/invitations
```

**Get single invitation:**
```
GET /api/invitations/:id
```

**Submit new request:**
```
POST /api/requests
Content-Type: application/json

{
  "invitation_id": 1,
  "invitation_name": "Classic Elegance",
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+1234567890",
  "wedding_date": "2025-06-15",
  "notes": "Optional special requests"
}
```

### Admin Endpoints (Requires Admin Key)

**Get all requests:**
```
GET /api/admin/requests?key=YOUR_ADMIN_KEY
```

**Update request status:**
```
PUT /api/admin/requests/:id?key=YOUR_ADMIN_KEY
Content-Type: application/json

{
  "status": "in_progress"
}
```

**Delete request:**
```
DELETE /api/admin/requests/:id?key=YOUR_ADMIN_KEY
```

**Export as CSV:**
```
GET /api/admin/requests/export/csv?key=YOUR_ADMIN_KEY
```

## Database

### SQLite Database Structure

**invitations table:**
```
id (INTEGER PRIMARY KEY)
name (TEXT)
description (TEXT)
image_url (TEXT)
created_at (DATETIME)
```

**requests table:**
```
id (INTEGER PRIMARY KEY)
invitation_id (INTEGER)
invitation_name (TEXT)
first_name (TEXT)
last_name (TEXT)
phone_number (TEXT)
wedding_date (TEXT)
notes (TEXT)
status (TEXT) - pending, in_progress, completed, archived
created_at (DATETIME)
```

### Backup Database

The database file is at: `data/invitations.db`

**To backup:**
```bash
cp data/invitations.db data/invitations.db.backup
```

**To restore:**
```bash
cp data/invitations.db.backup data/invitations.db
```

## Troubleshooting

**Server won't start:**
- Check if port 3000 is available
- Make sure Node.js is installed: `node --version`
- Check error messages in console

**Database errors:**
- Delete `data/invitations.db` and restart (it will recreate)
- Make sure `data/` folder exists and is writable

**Images not loading:**
- Use HTTPS URLs only
- Check image URLs are correct
- Try different image hosting services

**Admin panel not working:**
- Verify admin key is correct
- Check browser console for errors (F12)
- Clear browser cache and try again

**Email not sending:**
- Uncomment email code in `server.js`
- Set correct email credentials in `.env`
- Check email provider's app password requirements

## Security Tips

1. **Change admin key** - Use a strong, unique key
2. **Use HTTPS** - Enable SSL on your domain
3. **Backup database** - Regularly backup `data/invitations.db`
4. **Update Node.js** - Keep dependencies current
5. **Monitor logs** - Check server logs for issues

## Performance Tips

1. **Optimize images** - Use compressed images (under 500KB)
2. **Use CDN** - Host images on CDN for faster loading
3. **Enable caching** - Set cache headers in Express
4. **Monitor database** - Archive old requests regularly

## Support & Customization

This is a complete, standalone system. You can:

- Modify HTML/CSS/JavaScript as needed
- Add more invitation templates
- Customize colors and branding
- Add additional form fields
- Integrate with email services
- Deploy to any Node.js hosting

## License

MIT - Use freely for your business

## Quick Start Checklist

- [ ] Extract files
- [ ] Install Node.js if needed
- [ ] Run `npm install`
- [ ] Create `data/` folder
- [ ] Set `ADMIN_KEY` environment variable
- [ ] Run `npm start`
- [ ] Open http://localhost:3000
- [ ] Test form submission
- [ ] Login to admin panel
- [ ] Export test data
- [ ] Deploy to hosting
- [ ] Update domain DNS
- [ ] Test on live domain
- [ ] Customize invitations
- [ ] Add your images
- [ ] Launch!

---

**Ready to go!** Your complete wedding invitations website is ready to deploy and start taking orders.
