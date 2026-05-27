# 🚀 COMPLETE DEPLOYMENT GUIDE
## Wedding Invitations Website - GitHub + Namecheap + Hosting

**This guide covers EVERYTHING from zero to live website. Follow each step exactly.**

---

## TABLE OF CONTENTS
1. [Prerequisites & Tools](#prerequisites--tools)
2. [Part 1: Setup GitHub Account](#part-1-setup-github-account)
3. [Part 2: Create GitHub Repository](#part-2-create-github-repository)
4. [Part 3: Upload Code to GitHub](#part-3-upload-code-to-github)
5. [Part 4: Buy Domain on Namecheap](#part-4-buy-domain-on-namecheap)
6. [Part 5: Choose & Setup Hosting](#part-5-choose--setup-hosting)
7. [Part 6: Deploy Website](#part-6-deploy-website)
8. [Part 7: Connect Domain](#part-7-connect-domain)
9. [Part 8: Test & Launch](#part-8-test--launch)
10. [Part 9: Use Admin Panel](#part-9-use-admin-panel)

---

# PREREQUISITES & TOOLS

## What You Need (Free)
- ✅ GitHub account (free)
- ✅ Namecheap account (for domain purchase)
- ✅ Hosting account (we'll use Railway or Render - free tier available)
- ✅ Git installed on your computer
- ✅ Text editor (VS Code recommended)

## Tools to Download

### 1. Git (Required)
**Windows:**
1. Go to: https://git-scm.com/download/win
2. Download the installer
3. Run it, click "Next" through all screens
4. Verify installation:
   - Open Command Prompt
   - Type: `git --version`
   - Should show version number

**Mac:**
1. Open Terminal
2. Type: `git --version`
3. If not installed, it will prompt you to install
4. Follow the prompts

**Linux:**
```bash
sudo apt-get install git
```

### 2. VS Code (Recommended)
1. Go to: https://code.visualstudio.com/
2. Download for your OS
3. Install normally

### 3. GitHub Desktop (Optional - Makes it Easier)
1. Go to: https://desktop.github.com/
2. Download and install
3. Sign in with GitHub account

---

# PART 1: SETUP GITHUB ACCOUNT

## Step 1.1: Create GitHub Account
1. Go to: https://github.com/
2. Click **"Sign up"** (top right)
3. Enter your email address
4. Create a password (make it strong!)
5. Choose a username (e.g., `your-name-invitations`)
6. Click **"Create account"**
7. Verify your email (check your inbox)
8. Complete the setup wizard

## Step 1.2: Verify Email
1. GitHub will send you an email
2. Click the verification link
3. Your account is now active

**✓ GitHub account ready!**

---

# PART 2: CREATE GITHUB REPOSITORY

## Step 2.1: Create New Repository
1. Log in to GitHub (https://github.com/)
2. Click the **"+"** icon (top right)
3. Select **"New repository"**
4. Fill in:
   - **Repository name:** `wedding-invitations` (or your preferred name)
   - **Description:** `Wedding invitation website with backend`
   - **Visibility:** Choose **"Public"** (free) or **"Private"** (if you have paid account)
   - **Initialize with:** Leave unchecked
5. Click **"Create repository"**

## Step 2.2: Copy Repository URL
1. You'll see a page with your repository
2. Click the green **"Code"** button
3. Copy the HTTPS URL (should look like: `https://github.com/your-username/wedding-invitations.git`)
4. Save this URL somewhere safe

**✓ Repository created!**

---

# PART 3: UPLOAD CODE TO GITHUB

## Step 3.1: Prepare Your Files

**On Windows:**
1. Download the `wedding-invitations-standalone.zip` file
2. Extract it to a folder on your computer (e.g., `C:\Users\YourName\Documents\wedding-invitations`)
3. Open that folder

**On Mac/Linux:**
1. Download the zip file
2. Extract it
3. Open Terminal and navigate to the folder:
```bash
cd ~/Documents/wedding-invitations
```

## Step 3.2: Initialize Git Repository

**Windows (Command Prompt):**
1. Open Command Prompt
2. Navigate to your folder:
```cmd
cd C:\Users\YourName\Documents\wedding-invitations
```
3. Initialize git:
```cmd
git init
```

**Mac/Linux (Terminal):**
```bash
cd ~/Documents/wedding-invitations
git init
```

## Step 3.3: Configure Git (First Time Only)

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

Replace with your actual name and email.

## Step 3.4: Add Files to Git

```bash
git add .
```

This stages all files for upload.

## Step 3.5: Create First Commit

```bash
git commit -m "Initial commit: Wedding invitations website"
```

## Step 3.6: Connect to GitHub

Replace `YOUR_USERNAME` and `REPO_NAME` with your actual values:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wedding-invitations.git
```

Example:
```bash
git remote add origin https://github.com/john-smith/wedding-invitations.git
```

## Step 3.7: Push to GitHub

```bash
git branch -M main
git push -u origin main
```

**First time only:** GitHub will ask for authentication
- Click the link that appears
- Authorize the connection
- Or use GitHub Desktop (easier)

## Step 3.8: Verify Upload

1. Go to your GitHub repository: `https://github.com/YOUR_USERNAME/wedding-invitations`
2. You should see all your files listed
3. Check that these files are there:
   - `server.js`
   - `package.json`
   - `public/` folder
   - `README.md`

**✓ Code uploaded to GitHub!**

---

# PART 4: BUY DOMAIN ON NAMECHEAP

## Step 4.1: Go to Namecheap
1. Open: https://www.namecheap.com/
2. Click **"Sign up"** (top right)
3. Create account with email and password

## Step 4.2: Search for Domain
1. In the search box at top, type your desired domain
   - Example: `myinvitations.com`
   - Example: `weddingcards.com`
2. Click **"Search"**
3. You'll see availability and prices

## Step 4.3: Choose Domain
1. Find a domain you like
2. Click **"Add to cart"**
3. Choose registration period (1 year minimum)
4. Click **"View cart"**

## Step 4.4: Add to Cart & Checkout
1. Review your order
2. Uncheck any extras you don't need (WhoisGuard, etc.)
3. Click **"Confirm order"**
4. Enter payment information
5. Complete purchase

## Step 4.5: Verify Domain Purchase
1. Check your email for confirmation
2. Go to your Namecheap account
3. Click **"Domain List"**
4. You should see your new domain

**✓ Domain purchased!**

---

# PART 5: CHOOSE & SETUP HOSTING

## Option A: Railway (Recommended - Easiest)

### Step 5A.1: Create Railway Account
1. Go to: https://railway.app/
2. Click **"Start Project"**
3. Sign up with GitHub (easiest)
4. Authorize Railway to access GitHub

### Step 5A.2: Create New Project
1. Click **"+ New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your `wedding-invitations` repository
4. Click **"Deploy"**

### Step 5A.3: Configure Environment Variables
1. In Railway dashboard, click your project
2. Click **"Variables"** tab
3. Add these variables:
   - **ADMIN_KEY:** `your-super-secret-key-12345` (change this!)
   - **PORT:** `3000`
   - **NODE_ENV:** `production`

### Step 5A.4: Get Your Railway URL
1. Click **"Deployments"** tab
2. Wait for deployment to finish (green checkmark)
3. Copy the URL (looks like: `https://your-project-abc123.railway.app`)
4. Save this URL

**✓ Website deployed on Railway!**

---

## Option B: Render (Alternative - Also Easy)

### Step 5B.1: Create Render Account
1. Go to: https://render.com/
2. Click **"Get Started"**
3. Sign up with GitHub

### Step 5B.2: Create New Web Service
1. Click **"+ New"**
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Select `wedding-invitations` repo

### Step 5B.3: Configure
1. **Name:** `wedding-invitations`
2. **Environment:** `Node`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Plan:** Free tier is fine

### Step 5B.4: Add Environment Variables
1. Scroll to **"Environment"**
2. Add:
   - **ADMIN_KEY:** `your-super-secret-key-12345`
   - **PORT:** `3000`
   - **NODE_ENV:** `production`

### Step 5B.5: Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Copy your URL from the dashboard

**✓ Website deployed on Render!**

---

# PART 6: DEPLOY WEBSITE

## If Using Railway:

### Step 6.1: Verify Deployment
1. Go to Railway dashboard
2. Click your project
3. Check **"Deployments"** tab
4. Should show "Deployed" with green checkmark

### Step 6.2: Test Website
1. Copy your Railway URL
2. Open in browser: `https://your-project-abc123.railway.app`
3. You should see your website!
4. Test:
   - Gallery loads
   - Search works
   - Form submission works
   - Admin panel accessible

### Step 6.3: Enable Auto-Deploy
1. In Railway, go to **"Settings"**
2. Enable **"Auto Deploy"** (optional but recommended)
3. Now every time you push to GitHub, it auto-deploys

---

## If Using Render:

### Step 6.1: Monitor Deployment
1. Go to Render dashboard
2. Click your service
3. Check **"Logs"** tab
4. Wait for "Build successful" message

### Step 6.2: Test Website
1. Copy your Render URL
2. Open in browser
3. Test all features

### Step 6.3: Enable Auto-Deploy
1. In Render, go to **"Settings"**
2. Under **"Auto-Deploy"**, select **"Yes"**

**✓ Website deployed and working!**

---

# PART 7: CONNECT DOMAIN

## Step 7.1: Get Hosting Nameservers

**If using Railway:**
1. Go to Railway dashboard
2. Click your project
3. Go to **"Settings"**
4. Look for **"Custom Domain"**
5. You'll see nameservers like:
   - `ns1.railway.app`
   - `ns2.railway.app`
   - `ns3.railway.app`
   - `ns4.railway.app`

**If using Render:**
1. Go to Render dashboard
2. Click your service
3. Go to **"Settings"**
4. Look for **"Custom Domain"**
5. You'll see nameservers

## Step 7.2: Update Namecheap Nameservers

1. Log in to Namecheap: https://www.namecheap.com/
2. Click **"Domain List"**
3. Click your domain name
4. On the left, click **"Nameservers"**
5. Select **"Custom DNS"**
6. Enter the nameservers from your hosting provider:
   - Nameserver 1: `ns1.railway.app` (or Render equivalent)
   - Nameserver 2: `ns2.railway.app`
   - Nameserver 3: `ns3.railway.app`
   - Nameserver 4: `ns4.railway.app`
7. Click **"Save"**

## Step 7.3: Add Domain to Hosting

**If using Railway:**
1. Go to Railway dashboard
2. Click your project
3. Go to **"Settings"**
4. Under **"Custom Domain"**, enter your domain: `yourdomain.com`
5. Click **"Add Domain"**
6. Railway will verify and configure SSL automatically

**If using Render:**
1. Go to Render dashboard
2. Click your service
3. Go to **"Settings"**
4. Under **"Custom Domains"**, enter: `yourdomain.com`
5. Click **"Add Custom Domain"**
6. SSL certificate will be created automatically

## Step 7.4: Wait for DNS Propagation

⏳ **This takes 24-48 hours** (sometimes faster)

During this time:
- Your domain might not work yet
- This is normal
- Check back in a few hours

## Step 7.5: Test Domain

After 24 hours:
1. Open your browser
2. Type: `https://yourdomain.com`
3. You should see your website!
4. If not working, wait a bit longer

**✓ Domain connected!**

---

# PART 8: TEST & LAUNCH

## Step 8.1: Full Website Test

**Test Gallery:**
- [ ] Homepage loads
- [ ] Hero section displays
- [ ] 5 invitation templates show
- [ ] Images load (if you added them)

**Test Search:**
- [ ] Type in search bar
- [ ] Results filter correctly
- [ ] Clear search shows all

**Test Form:**
- [ ] Click "Select" on a template
- [ ] Form modal opens
- [ ] Fill in all fields:
  - First name: `John`
  - Last name: `Doe`
  - Phone: `+1234567890`
  - Wedding date: Pick a date
  - Notes: `Test request`
- [ ] Click "Submit Request"
- [ ] Success message appears

**Test Admin Panel:**
- [ ] Click "Admin" in navigation
- [ ] Enter your ADMIN_KEY
- [ ] Dashboard loads
- [ ] Your test request appears in the list
- [ ] Update status works
- [ ] Export CSV works

## Step 8.2: Mobile Test

1. Open your domain on phone
2. Check:
   - [ ] Layout responsive
   - [ ] Gallery works
   - [ ] Form works
   - [ ] Admin accessible

## Step 8.3: Security Check

1. Check URL shows `https://` (not http)
2. Click the lock icon
3. Should show "Secure" or "Certificate valid"

**✓ Everything working!**

---

# PART 9: USE ADMIN PANEL

## Step 9.1: Access Admin Panel

1. Open your website: `https://yourdomain.com`
2. Click **"Admin"** link in top navigation
3. Enter your **ADMIN_KEY** (the one you set in environment variables)
4. Click **"Login"**

## Step 9.2: View Requests

You'll see a list of all client requests with:
- Client name
- Phone number
- Wedding date
- Selected invitation template
- Submission date
- Special notes

## Step 9.3: Update Request Status

For each request, you can change status:
- **Pending** - Just received
- **In Progress** - Working on it
- **Completed** - Ready for delivery
- **Archived** - Old/done requests

1. Click the status dropdown
2. Select new status
3. Click **"Update"**
4. Status changes immediately

## Step 9.4: Export Requests

1. Click **"Export as CSV"** button
2. A file downloads: `requests-2024-05-27.csv`
3. Open in Excel or Google Sheets
4. Use for your records

## Step 9.5: Delete Requests

1. Click **"Delete"** button on any request
2. Confirm deletion
3. Request is removed

## Step 9.6: Logout

1. Click **"Logout"** button
2. You're logged out

---

# CUSTOMIZATION

## Change Admin Key

1. Go to your hosting dashboard (Railway or Render)
2. Find **"Environment Variables"**
3. Change `ADMIN_KEY` to a new value
4. Save
5. Website redeploys automatically

## Add Your Invitation Images

### Option 1: Edit Code (Recommended)

1. Go to your GitHub repository
2. Click `server.js`
3. Click the pencil icon to edit
4. Find the `invitations` array (around line 50)
5. Replace image URLs with your own:
```javascript
{
    name: 'Your Template Name',
    description: 'Your description',
    image_url: 'https://your-image-url.jpg'
}
```
6. Click **"Commit changes"**
7. Website auto-updates in 1-2 minutes

### Option 2: Upload Images First

1. Upload your images to a free hosting service:
   - Imgur: https://imgur.com/
   - Cloudinary: https://cloudinary.com/ (free tier)
   - Or your own server
2. Get the image URL
3. Edit `server.js` as above
4. Paste the image URL

## Change Colors

1. Go to GitHub
2. Click `public/styles.css`
3. Edit the color variables at the top:
```css
:root {
    --primary: #ec4899;      /* Pink */
    --accent: #a855f7;       /* Purple */
    --tertiary: #22d3ee;     /* Cyan */
}
```
4. Change hex colors to your preference
5. Commit changes
6. Website updates automatically

## Change Business Name

1. Go to GitHub
2. Click `public/index.html`
3. Find `<title>` tag
4. Change "Wedding Invitations" to your business name
5. Find the logo section and update
6. Commit changes

---

# TROUBLESHOOTING

## Website Shows 404 Error

**Solution:**
1. Check domain is pointing to correct hosting
2. Wait 24-48 hours for DNS propagation
3. Clear browser cache (Ctrl+Shift+Delete)
4. Try different browser

## Admin Panel Won't Login

**Solution:**
1. Check ADMIN_KEY spelling (case-sensitive)
2. Check environment variables are set correctly
3. Restart hosting service
4. Clear browser cache

## Images Not Loading

**Solution:**
1. Check image URLs are HTTPS (not HTTP)
2. Verify URLs are correct
3. Try different image hosting service
4. Check image file size (under 5MB)

## Database Errors

**Solution:**
1. Go to hosting dashboard
2. Restart the application
3. Database will recreate automatically

## Website Slow

**Solution:**
1. Optimize images (compress them)
2. Use image hosting service (CDN)
3. Upgrade hosting plan if needed

## Email Not Sending

**Solution:**
1. Uncomment email code in `server.js`
2. Set EMAIL_USER and EMAIL_PASSWORD in environment variables
3. Use Gmail app password (not regular password)
4. Check email provider's requirements

---

# MAINTENANCE

## Regular Backups

Every week:
1. Go to admin panel
2. Click "Export as CSV"
3. Save the file
4. Store in safe location

## Monitor Requests

Check admin panel daily to:
- See new requests
- Update statuses
- Respond to clients

## Update Images

When adding new templates:
1. Upload image to hosting service
2. Edit `server.js` on GitHub
3. Add new invitation object
4. Commit changes
5. Website updates automatically

## Monitor Logs

Check hosting dashboard logs for errors:
- Railway: Deployments → Logs
- Render: Logs tab

---

# FINAL CHECKLIST

- [ ] GitHub account created
- [ ] Repository created and code uploaded
- [ ] Domain purchased on Namecheap
- [ ] Hosting account created (Railway or Render)
- [ ] Website deployed
- [ ] Domain connected to hosting
- [ ] DNS propagated (24-48 hours)
- [ ] Website accessible on domain
- [ ] Gallery works
- [ ] Form submission works
- [ ] Admin panel works
- [ ] Images added (optional)
- [ ] Colors customized (optional)
- [ ] Business name updated
- [ ] First backup created
- [ ] Ready to take orders!

---

# SUPPORT & RESOURCES

- **GitHub Help:** https://docs.github.com/
- **Railway Docs:** https://docs.railway.app/
- **Render Docs:** https://render.com/docs
- **Namecheap Support:** https://www.namecheap.com/support/
- **Node.js Docs:** https://nodejs.org/docs/

---

## 🎉 YOUR WEBSITE IS LIVE!

You now have a complete, professional wedding invitation website that:
- ✅ Takes client requests
- ✅ Stores data in database
- ✅ Has admin panel for management
- ✅ Works on custom domain
- ✅ Is fully customizable
- ✅ Requires no coding knowledge to maintain

**Start taking orders!**

---

**Questions? Check the troubleshooting section or contact your hosting provider support.**
