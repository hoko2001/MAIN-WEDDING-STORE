# Deployment Guide - Wedding Invitations Website

Complete step-by-step guide to deploy your website on Cheapname or any hosting provider.

## Table of Contents
1. [Local Testing](#local-testing)
2. [Cheapname Deployment](#cheapname-deployment)
3. [Other Hosting Providers](#other-hosting-providers)
4. [Domain Setup](#domain-setup)
5. [Post-Deployment](#post-deployment)

---

## Local Testing

### Step 1: Install Node.js
- Download from: https://nodejs.org/
- Choose LTS (Long Term Support) version
- Install and verify: `node --version`

### Step 2: Extract Files
- Extract `wedding-invitations-standalone.zip`
- Open terminal/command prompt in the extracted folder

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Create Data Folder
```bash
mkdir data
```

### Step 5: Set Admin Key
**Windows (Command Prompt):**
```cmd
set ADMIN_KEY=your-secret-key-12345
npm start
```

**Windows (PowerShell):**
```powershell
$env:ADMIN_KEY="your-secret-key-12345"
npm start
```

**Mac/Linux:**
```bash
export ADMIN_KEY=your-secret-key-12345
npm start
```

### Step 6: Test Website
- Open: http://localhost:3000
- Try submitting a request
- Click "Admin" and login with your key
- Verify everything works

---

## Cheapname Deployment

### Step 1: Purchase Hosting
1. Go to https://www.cheapname.com/
2. Choose a hosting plan (basic is fine)
3. Complete purchase
4. You'll get:
   - FTP credentials
   - Control panel access
   - Domain name

### Step 2: Access Control Panel
1. Log in to Cheapname
2. Find "cPanel" or "Control Panel"
3. Look for "File Manager" or "FTP"

### Step 3: Upload Files via File Manager

**Method A: Using File Manager (Easier)**
1. In cPanel, click "File Manager"
2. Navigate to `public_html` folder
3. Click "Upload" button
4. Select all files from `wedding-invitations-standalone/` folder:
   - `server.js`
   - `package.json`
   - `public/` folder (with index.html, styles.css, app.js)
   - `.env.example`
   - `README.md`
5. Upload all files

**Method B: Using FTP (More Reliable)**
1. Get FTP credentials from Cheapname
2. Download FTP client: FileZilla (free)
3. Connect with FTP credentials:
   - Host: your-ftp-address
   - Username: your-ftp-username
   - Password: your-ftp-password
4. Navigate to `public_html` folder
5. Drag and drop all files from your computer

### Step 4: Create Data Folder
1. In File Manager, right-click in `public_html`
2. Create new folder named `data`
3. Make sure it's writable (permissions 755)

### Step 5: Install Node.js Dependencies
1. In cPanel, find "Terminal" or "SSH"
2. Connect via SSH (you'll get credentials)
3. Navigate to your folder:
   ```bash
   cd public_html
   ```
4. Install dependencies:
   ```bash
   npm install
   ```

### Step 6: Configure Environment
1. Create `.env` file in `public_html`:
   ```bash
   nano .env
   ```
2. Add your configuration:
   ```
   PORT=3000
   ADMIN_KEY=your-super-secret-key-change-this
   ADMIN_EMAIL=your-email@example.com
   ```
3. Save (Ctrl+X, then Y, then Enter)

### Step 7: Start the Server
**Option A: Direct Start (Simple)**
```bash
npm start
```

**Option B: Using PM2 (Recommended - Keeps Running)**
```bash
npm install -g pm2
pm2 start server.js --name "wedding-invitations"
pm2 save
pm2 startup
```

### Step 8: Verify It's Running
1. Open your browser
2. Go to: `https://your-domain.com:3000`
3. You should see your website

---

## Other Hosting Providers

### Heroku
1. Create account at https://www.heroku.com/
2. Install Heroku CLI
3. In terminal:
   ```bash
   heroku login
   heroku create your-app-name
   git push heroku main
   ```
4. Set environment variables:
   ```bash
   heroku config:set ADMIN_KEY=your-secret-key
   ```

### Railway
1. Go to https://railway.app/
2. Connect GitHub account
3. Create new project from GitHub
4. Deploy
5. Set environment variables in dashboard

### DigitalOcean
1. Create account at https://www.digitalocean.com/
2. Create Droplet (Ubuntu 22.04)
3. SSH into droplet
4. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```
5. Upload files via SCP or Git
6. Install and run

### AWS/Google Cloud/Azure
1. Create account
2. Set up VM instance
3. SSH into instance
4. Install Node.js
5. Upload files
6. Run with PM2

---

## Domain Setup

### Connect Your Cheapname Domain

**Step 1: Get Nameservers**
1. In Cheapname, find "Nameservers" or "DNS"
2. You'll see nameservers like:
   - ns1.cheapname.com
   - ns2.cheapname.com

**Step 2: Point Domain**
1. In your domain registrar (if different from Cheapname)
2. Update nameservers to Cheapname's nameservers
3. Wait 24-48 hours for propagation

**Step 3: Verify Domain
1. Open terminal
2. Run: `nslookup your-domain.com`
3. Should show Cheapname nameservers

**Step 4: Access Website**
1. Open: `https://your-domain.com`
2. Should load your website

### Enable SSL (HTTPS)

**Cheapname with cPanel:**
1. In cPanel, find "AutoSSL" or "SSL/TLS"
2. Click "Issue" or "Install"
3. Select your domain
4. Wait for certificate (usually instant)
5. Your site is now HTTPS

---

## Post-Deployment

### Step 1: Test Everything
- [ ] Website loads on your domain
- [ ] Gallery displays invitations
- [ ] Search works
- [ ] Form submission works
- [ ] Admin panel accessible
- [ ] Can update request status
- [ ] Can export CSV

### Step 2: Customize
- [ ] Update invitation templates
- [ ] Add your images
- [ ] Change colors if desired
- [ ] Update business name
- [ ] Add contact email

### Step 3: Backup
```bash
# Backup database
cp data/invitations.db data/invitations.db.backup

# Download backup to your computer via FTP
```

### Step 4: Monitor
- Check logs regularly
- Monitor database size
- Archive old requests
- Keep backups current

### Step 5: Security
- [ ] Change ADMIN_KEY to strong password
- [ ] Enable SSL/HTTPS
- [ ] Set file permissions correctly
- [ ] Regular backups
- [ ] Monitor for errors

---

## Troubleshooting

### Website Shows 404 Error
- Check files are in correct folder
- Verify `public/index.html` exists
- Restart server

### Port Already in Use
```bash
# Change PORT in .env to 3001 or 3002
PORT=3001
```

### Database Errors
```bash
# Delete and recreate database
rm data/invitations.db
npm start
```

### Can't Connect via SSH
- Check SSH credentials from Cheapname
- Use SSH client like PuTTY (Windows) or Terminal (Mac)
- Verify IP address is correct

### Admin Panel Not Working
- Verify ADMIN_KEY is set in .env
- Check browser console (F12) for errors
- Clear browser cache
- Try different browser

### Email Not Sending
- Uncomment email code in server.js
- Set EMAIL_USER and EMAIL_PASSWORD in .env
- Use app-specific password for Gmail
- Check email provider's requirements

---

## Quick Deployment Checklist

- [ ] Extract files
- [ ] Install Node.js locally
- [ ] Test locally with `npm start`
- [ ] Upload files to hosting
- [ ] Create `data/` folder
- [ ] Create `.env` file with ADMIN_KEY
- [ ] Run `npm install` on server
- [ ] Start server with `npm start` or PM2
- [ ] Test website on domain
- [ ] Customize invitations
- [ ] Add your images
- [ ] Test admin panel
- [ ] Set up backups
- [ ] Monitor logs
- [ ] Launch!

---

## Support Resources

- Node.js Docs: https://nodejs.org/docs/
- Express Docs: https://expressjs.com/
- SQLite Docs: https://www.sqlite.org/docs.html
- Cheapname Support: https://www.cheapname.com/support/

---

**Your website is now live and ready to take orders!**
