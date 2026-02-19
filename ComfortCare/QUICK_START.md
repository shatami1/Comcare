# ComfortCare Website - Quick Start Guide

## ✅ What You Have

A complete, professional 5-page medical equipment rental website including:

- ✅ **Home Page** - Hero section with features
- ✅ **Services Page** - Complete equipment catalog
- ✅ **How It Works Page** - Process + Equipment Booking Form
- ✅ **Pricing Page** - Detailed pricing by equipment
- ✅ **Contact Page** - Contact form + Information
- ✅ **Mobile Responsive** - Works perfectly on all devices
- ✅ **Professional Design** - Blue/Green medical theme
- ✅ **Working Forms** - Contact & booking forms with validation
- ✅ **No Server Needed** - Pure HTML/CSS/JS

## 🚀 Deploy in 3 Steps

### Step 1: Go to Netlify.com
Visit https://netlify.com and create a free account.

### Step 2: Drag & Drop
Drag the entire ComfortCare folder onto Netlify's drop zone.

### Step 3: Done!
Your site is live with a free URL like: `https://comfortcare-abc123.netlify.app`

**Total Time: 2 minutes**

## 📝 Before You Deploy

### Quick Customizations (5 minutes)

**1. Update Business Information**
Search & replace in all HTML files:
- `678-362-2345` → Your phone number
- `AccentGV@gmail.com` → Your email
- `Atlanta, Georgia` → Your location

**2. Update Logo**
In navigation bar, replace:
```html
<div class="logo-placeholder">CC</div>
```
With your actual logo image.

**3. Update Service Areas**
In contact.html, update the cities list to match your actual service area.

## 🎨 Color Customization (Optional)

Want different colors? Edit the top of styles.css:

```css
:root {
    --primary-blue: #0066cc;    /* Your primary color */
    --accent-green: #10b981;    /* Your accent color */
    /* Leave the rest unchanged */
}
```

## 📧 Setup Form Emails

Your forms currently save data locally. To receive emails:

### Option A: FormSubmit.co (Easiest)
1. Search for `<form class="contact-form"` in contact.html
2. Change it to:
```html
<form class="contact-form" action="https://formsubmit.co/AccentGV@gmail.com" method="POST">
```
3. Do the same for booking form in how-it-works.html
4. Deploy to Netlify

### Option B: Netlify Forms (Recommended)
After you deploy to Netlify:
1. Add `netlify` to both forms: `<form netlify>`
2. Go to your Netlify dashboard
3. Forms > See submissions in admin

## 📱 Before Going Live: Checklist

- [ ] Update all contact information (phone, email, address)
- [ ] Add your business logo
- [ ] Update service areas
- [ ] Set up form email notifications
- [ ] Test on mobile phone
- [ ] Test all links work
- [ ] Get a custom domain (comfortcare.com, etc.)

## 🎯 Custom Domain (Optional)

1. Buy a domain (GoDaddy, Namecheap, Google Domains)
2. In Netlify: Domain Settings > Connect Domain
3. Follow Netlify's nameserver instructions
4. Takes 24-48 hours to activate

## 📊 Track Visitors (Optional)

Add Google Analytics in every page:
1. Sign up at https://analytics.google.com
2. Copy your tracking code
3. Paste before `</head>` in all HTML files

## 🔧 Need to Edit Later?

### Option 1: Online Editor
Edit directly in VS Code, then re-deploy to Netlify

### Option 2: Netlify CMS
For non-technical team members, set up Netlify CMS for content editing

## 💬 FAQ

**Q: Can I add more pages?**
A: Yes! Copy an existing page, change content, add link to navigation.

**Q: Can I change the colors?**
A: Yes! Edit CSS variables at top of styles.css.

**Q: Will forms send email automatically?**
A: Not yet. Follow "Setup Form Emails" section above.

**Q: How do I update prices?**
A: Edit pricing.html - search for the equipment and update the numbers.

**Q: Can I add a blog?**
A: Create blog.html, style it with existing CSS, link from nav menu.

## 🎓 Resources

- **Netlify Docs**: https://docs.netlify.com
- **HTML Guide**: https://developer.mozilla.org/en-US/docs/Web/HTML
- **CSS Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS
- **Form Submission**: https://formsubmit.co

## 🎉 Ready to Launch?

1. Customize your info (5 min)
2. Deploy to Netlify (2 min)
3. Set up form emails (5 min)
4. Test everything (10 min)

**Total: ~22 minutes to a live, professional website!**

## 📞 Support

All files are well-commented and follow standard web practices. If you need help:
1. Check the full README.md for detailed documentation
2. Refer to browser console (F12) for any errors
3. Check Netlify docs for deployment issues

---

**Your Professional Medical Equipment Rental Website is Ready to Go!** 🎉
