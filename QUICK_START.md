# ComfortCare Website - Quick Start Guide

## ✅ What You Have

A complete, professional 5-page mobility equipment rental website including:

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

### Step 1: Push to GitHub
Push the ComfortCare folder to your GitHub repository.

### Step 2: Enable GitHub Pages
Open the repository settings and enable GitHub Pages for the main branch.

### Step 3: Done!
Your site is live with a GitHub Pages URL and can use `comcare.store` as the custom domain.

**Total Time: 2 minutes**

## 📝 Before You Deploy

### Quick Customizations (5 minutes)

**1. Update Business Information**
Search & replace in all HTML files:
- `678-242-9309` → Your phone number
- `admin@comcare.store` → Your email
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
<form class="contact-form" action="https://formsubmit.co/admin@comcare.store" method="POST">
```
3. Do the same for booking form in how-it-works.html
4. Push the update so GitHub Pages redeploys

### Option B: Hosted form endpoint
After you deploy to GitHub Pages:
1. Keep the FormSubmit action or use your own form endpoint
2. Test a submission
3. Confirm messages arrive at admin@comcare.store

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
2. In GitHub Pages settings: add your custom domain
3. Point your DNS records to GitHub Pages
4. Takes 24-48 hours to activate

## 📊 Track Visitors (Optional)

Add Google Analytics in every page:
1. Sign up at https://analytics.google.com
2. Copy your tracking code
3. Paste before `</head>` in all HTML files

## 🔧 Need to Edit Later?

### Option 1: Online Editor
Edit directly in VS Code, then push changes to GitHub Pages

### Option 2: Git-based content workflow
For non-technical team members, use GitHub edits or a lightweight CMS that publishes to GitHub

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

- **GitHub Pages Docs**: https://docs.github.com/pages
- **HTML Guide**: https://developer.mozilla.org/en-US/docs/Web/HTML
- **CSS Guide**: https://developer.mozilla.org/en-US/docs/Web/CSS
- **Form Submission**: https://formsubmit.co

## 🎉 Ready to Launch?

1. Customize your info (5 min)
2. Publish with GitHub Pages (2 min)
3. Set up form emails (5 min)
4. Test everything (10 min)

**Total: ~22 minutes to a live, professional website!**

## 📞 Support

All files are well-commented and follow standard web practices. If you need help:
1. Check the full README.md for detailed documentation
2. Refer to browser console (F12) for any errors
3. Check GitHub Pages docs for deployment issues

---

**Your Professional Medical Equipment Rental Website is Ready to Go!** 🎉
