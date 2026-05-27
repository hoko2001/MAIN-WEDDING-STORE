# ⚡ QUICK REFERENCE - Wedding Invitations Website

## 🚀 DEPLOYMENT IN 5 STEPS

### Step 1: GitHub (5 minutes)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/wedding-invitations.git
git push -u origin main
```

### Step 2: Create Hosting Account (5 minutes)
- Go to https://railway.app/ OR https://render.com/
- Sign up with GitHub
- Connect your repository

### Step 3: Deploy (2 minutes)
- Click "Deploy"
- Add environment variables:
  - `ADMIN_KEY=your-secret-key`
  - `PORT=3000`
  - `NODE_ENV=production`
- Wait for deployment (5-10 minutes)

### Step 4: Buy Domain (5 minutes)
- Go to https://www.namecheap.com/
- Search domain
- Buy it

### Step 5: Connect Domain (5 minutes)
- Copy nameservers from hosting
- Paste into Namecheap DNS settings
- Wait 24-48 hours

**Total Time: ~30 minutes + 24-48 hours DNS**

---

## 📋 IMPORTANT CREDENTIALS

Save these somewhere safe:

| Item | Value |
|------|-------|
| GitHub Username | _____________ |
| GitHub Repository | _____________ |
| Hosting Provider | Railway / Render |
| Hosting URL | _____________ |
| Namecheap Email | _____________ |
| Domain Name | _____________ |
| Admin Key | _____________ |

---

## 🔗 IMPORTANT LINKS

| Service | URL |
|---------|-----|
| GitHub | https://github.com/ |
| Railway | https://railway.app/ |
| Render | https://render.com/ |
| Namecheap | https://www.namecheap.com/ |
| Git Download | https://git-scm.com/ |
| VS Code | https://code.visualstudio.com/ |

---

## 📝 ENVIRONMENT VARIABLES

Set these in your hosting dashboard:

```
ADMIN_KEY=your-super-secret-key-12345
PORT=3000
NODE_ENV=production
ADMIN_EMAIL=your-email@example.com
```

---

## 🔑 ADMIN PANEL

**Access:** `https://yourdomain.com` → Click "Admin"

**Login:** Enter your ADMIN_KEY

**Functions:**
- View all client requests
- Update request status
- Export as CSV
- Delete requests

---

## 📧 FORM FIELDS

Clients submit:
1. First Name
2. Last Name
3. Phone Number
4. Wedding Date
5. Invitation Template (dropdown)
6. Special Notes (optional)

---

## 🎨 CUSTOMIZE

### Change Colors
Edit `public/styles.css`:
```css
:root {
    --primary: #ec4899;      /* Main color */
    --accent: #a855f7;       /* Accent color */
    --tertiary: #22d3ee;     /* Tertiary color */
}
```

### Add Images
Edit `server.js` - Find `invitations` array:
```javascript
{
    name: 'Template Name',
    description: 'Description',
    image_url: 'https://your-image.jpg'
}
```

### Change Business Name
Edit `public/index.html` - Find `<title>` tag

---

## 🐛 TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| Website won't load | Wait 24 hours for DNS, clear cache |
| Admin won't login | Check ADMIN_KEY spelling (case-sensitive) |
| Images not showing | Use HTTPS URLs only |
| Slow website | Compress images, use CDN |
| Database error | Restart hosting service |

---

## 📊 MONITORING

**Check these regularly:**
- Admin panel for new requests
- Hosting logs for errors
- Domain SSL certificate status
- Database backups

---

## 💾 BACKUP

Every week:
1. Go to admin panel
2. Click "Export as CSV"
3. Save file to computer
4. Store in safe location

---

## 🔐 SECURITY

- [ ] Change ADMIN_KEY to strong password
- [ ] Enable HTTPS (automatic on Railway/Render)
- [ ] Regular backups
- [ ] Monitor logs
- [ ] Don't share ADMIN_KEY

---

## 📞 SUPPORT

- **GitHub Issues:** https://github.com/YOUR_USERNAME/wedding-invitations/issues
- **Railway Support:** https://railway.app/support
- **Render Support:** https://render.com/support
- **Namecheap Support:** https://www.namecheap.com/support/

---

## ✅ LAUNCH CHECKLIST

- [ ] Code on GitHub
- [ ] Website deployed
- [ ] Domain purchased
- [ ] Domain connected
- [ ] DNS propagated
- [ ] Website accessible
- [ ] Gallery works
- [ ] Form works
- [ ] Admin works
- [ ] Images added
- [ ] Colors customized
- [ ] Business name updated
- [ ] First backup created
- [ ] Ready to take orders!

---

## 🎯 NEXT STEPS

1. **Customize** - Add your images and colors
2. **Test** - Submit test requests
3. **Share** - Give domain to clients
4. **Monitor** - Check admin panel daily
5. **Respond** - Reply to client requests
6. **Deliver** - Update status when done

---

## 💡 TIPS

- Use free image hosting (Imgur, Cloudinary) for images
- Compress images before uploading (reduce file size)
- Keep ADMIN_KEY secret
- Regular backups are important
- Test on mobile before launching
- Respond to requests quickly

---

**Your website is ready! Start taking orders!** 🎉
