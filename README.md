# ComfortCare - Medical Equipment Rental Website

A complete, professional multi-page website for ComfortCare, a medical equipment rental service in Atlanta, Georgia.

## 📋 Project Overview

This is a fully responsive, mobile-optimized HTML/CSS/JavaScript website featuring:

- **5 Main Pages**: Home, Services, How It Works, Pricing, Contact
- **Professional Design**: Blue/green medical theme with modern styling
- **Mobile Responsive**: Fully optimized for all device sizes
- **Working Contact Form**: Client-side form with validation and local storage
- **Equipment Booking System**: Integrated booking form with date selection
- **No Backend Required**: All forms use local storage (ready for backend integration)

## 🗂️ File Structure

```
ComfortCare/
├── index.html              # Home page with hero section
├── services.html           # Equipment & services catalog
├── how-it-works.html      # Process & equipment booking form
├── pricing.html            # Pricing details & packages
├── contact.html            # Contact form & information
├── styles.css              # Main stylesheet (1000+ lines)
├── script.js              # JavaScript functionality
└── README.md              # This file
```

## 🎨 Design Features

### Color Scheme
- **Primary Blue**: #0066cc
- **Secondary Blue**: #0052a3
- **Accent Green**: #10b981
- **Light Green**: #d1fae5
- **Professional Medical Theme**

### Key Sections
1. **Navigation Bar**: Sticky header with mobile hamburger menu
2. **Hero Section**: Eye-catching gradient background with CTA buttons
3. **Features Grid**: 6 key benefits with icons
4. **Equipment Catalog**: Detailed service categories with pricing
5. **Process Steps**: 6-step booking process visualization
6. **Contact Section**: Dual layout with info + form
7. **Footer**: Comprehensive footer with links and contact info

## 📄 Pages Breakdown

### 1. Home (index.html)
- Hero section with main CTA
- 6 feature cards
- Featured equipment showcase
- Call-to-action section
- Footer with business info

### 2. Services (services.html)
- 4 equipment categories:
  - Mobility & Accessibility
  - Bedroom & Bathroom
  - Health Monitoring
  - Specialized Equipment
- 12+ individual equipment types with descriptions
- Pricing tags
- Booking CTA

### 3. How It Works (how-it-works.html)
- 6-step process visualization
- **Equipment Rental Booking System**:
  - Equipment type selection
  - Rental duration
  - Date scheduling
  - Customer information
  - Special requests field
  - Terms agreement
- Live form validation
- FAQ section with 6 questions
- Call-to-action

### 4. Pricing (pricing.html)
- 6 equipment categories with rates
- Daily/Weekly/Monthly pricing breakdown
- Discount information (10-15% discounts)
- What's included vs. optional services
- Payment methods (Credit Card, ACH, Insurance)
- Insurance & Medicare information

### 5. Contact (contact.html)
- **Working Contact Form** with:
  - Name, email, phone, subject, message
  - Newsletter subscription option
  - Privacy agreement checkbox
  - Live validation
  - Success/error messages
- Contact information panel
- Business hours
- Service area map placeholder
- Testimonials
- FAQ section
- Testimonial cards

## ⚙️ Features & Functionality

### Forms (Client-Side)
Both forms include:
- Real-time HTML5 validation
- Email format verification
- Phone number validation
- Zip code validation
- Form data stored in browser localStorage
- Success/error message display
- Auto-focus on errors
- Form auto-fill from previous visits

### Navigation
- Sticky header
- Mobile responsive hamburger menu
- Active page indicator
- Smooth scrolling

### Responsive Design
- Mobile-first approach
- Breakpoints: 768px and 530px
- Flexible grid layouts
- Optimized touch targets
- Readable font sizes on all devices

### Form Data Storage
Forms save data to browser localStorage:
- `contactSubmissions`: Contact form submissions
- `bookingSubmissions`: Equipment booking requests
- `pageViews`: Page visit tracking
- `userInfo`: Auto-fill user information

**Note**: Data is stored locally in client's browser. For production, integrate with backend service (Firebase, Node.js, etc.)

## 🚀 How to Deploy to Netlify

### Option 1: Drag & Drop (Easiest)
1. Go to [netlify.com](https://netlify.com)
2. Sign up for a free account
3. Drag and drop the ComfortCare folder into Netlify
4. Your site is live!

### Option 2: GitHub Integration (Recommended)
1. Push files to GitHub repository
2. Sign in to Netlify with GitHub
3. Click "New site from Git"
4. Select your GitHub repository
5. Click Deploy
6. Custom domain setup in Site Settings

### Option 3: Command Line (with Netlify CLI)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to project folder
cd ComfortCare

# Deploy
netlify deploy --prod
```

### Deployment Checklist
- ✓ All HTML files present
- ✓ styles.css in root directory
- ✓ script.js in root directory
- ✓ All internal links use relative paths
- ✓ Contact information updated (phone, email, address)
- ✓ Logo placeholder ready for custom logo

## ✏️ Customization Guide

### Update Business Information
**Files to edit**: All HTML files

Replace these with your actual information:
```
Phone: 678-362-2345
Email: AccentGV@gmail.com
Location: Atlanta, Georgia
```

### Add Your Logo
Replace the logo placeholder (CC):
```html
<div class="logo-placeholder">CC</div>
```

With your actual logo:
```html
<img src="your-logo.png" alt="ComfortCare Logo" class="logo">
```

Update CSS in styles.css:
```css
.logo {
    width: 45px;
    height: 45px;
    object-fit: contain;
}
```

### Update Colors
Edit CSS variables in styles.css:
```css
:root {
    --primary-blue: #0066cc;      /* Change primary color */
    --accent-green: #10b981;      /* Change accent color */
    /* ...other variables */
}
```

### Update Equipment List
Edit the equipment sections in:
- services.html (equipment details)
- pricing.html (pricing information)
- how-it-works.html (booking dropdown)

### Add More Pages
1. Create new HTML file (example: blog.html)
2. Copy header/footer from existing page
3. Add main content section
4. Link from navigation menu

## 📱 Mobile Responsiveness

Tested breakpoints:
- **Desktop**: 1200px+
- **Tablet**: 768px - 1199px
- **Mobile**: 530px - 767px
- **Small Mobile**: Below 530px

All images and text scale appropriately on each device.

## 🔄 Form Integration (Backend Setup)

### Ready for Integration With:
- **Firebase**: Real-time database, easy setup
- **FormSubmit.co**: Free form submissions to email
- **Node.js/Express**: Custom backend
- **Netlify Functions**: Serverless functions
- **EmailJS**: Direct email from browser

### Example: Using FormSubmit.co (Free)
1. Add `action="https://formsubmit.co/AccentGV@gmail.com"` to form
2. Change form method to `POST`
3. Add hidden input: `<input type="hidden" name="_captcha" value="false">`

### Example: Using Netlify Forms
1. Add `netlify` attribute to form: `<form netlify>`
2. Deploy to Netlify
3. Form submissions appear in Netlify admin panel

## 🔍 Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## 📊 Performance

- **Fully Static**: No server needed
- **Fast Loading**: Pure HTML/CSS/JS
- **No Dependencies**: No frameworks required
- **Small Footprint**: All files combined < 500KB
- **SEO Ready**: Semantic HTML, meta tags

## 🎯 SEO Features

- Semantic HTML structure
- Meta descriptions (add to head)
- Header hierarchy (H1, H2, H3)
- Alt text ready (add to images)
- Mobile-responsive design
- Fast loading time

### Recommended: Add Meta Tags
Add to each page's `<head>`:
```html
<meta name="description" content="Professional medical equipment rental services in Atlanta, Georgia">
<meta name="keywords" content="medical equipment rental, wheelchairs, hospital beds, Atlanta">
<meta name="author" content="ComfortCare">
<meta property="og:title" content="ComfortCare - Medical Equipment Rental">
<meta property="og:description" content="Quality medical equipment rental in Atlanta">
```

## 🛠️ Maintenance

### Regular Updates
- Update equipment prices in pricing.html
- Refresh service areas as you expand
- Update testimonials/reviews
- Keep contact information current

### Adding New Equipment
1. Add to services.html category
2. Update pricing.html
3. Update how-it-works.html booking form
4. Update pricing calculator in script.js

### Monitoring Form Submissions
Open browser console (F12) and check:
- `localStorage.getItem('contactSubmissions')`
- `localStorage.getItem('bookingSubmissions')`

## 📧 Contact Form Integration (Next Steps)

To receive form submissions by email:

### Option 1: FormSubmit.co (Recommended for Beginners)
```html
<form action="https://formsubmit.co/AccentGV@gmail.com" method="POST">
    <!-- form fields -->
    <input type="hidden" name="_captcha" value="false">
</form>
```

### Option 2: Netlify Forms (Best for Netlify Hosting)
```html
<form name="contact" method="POST" netlify>
    <!-- form fields -->
</form>
```

### Option 3: EmailJS (Client-Side Email)
```javascript
emailjs.init("YOUR_PUBLIC_KEY");
emailjs.send("SERVICE_ID", "TEMPLATE_ID", formData);
```

## 🎓 Learning Resources

- **HTML/CSS**: [MDN Web Docs](https://developer.mozilla.org)
- **Netlify Docs**: [Netlify Documentation](https://docs.netlify.com)
- **Web Design**: [CSS-Tricks](https://css-tricks.com)
- **Responsive Design**: [Web.dev](https://web.dev)

## 📝 Changelog

### Version 1.0 (February 2026)
- Initial website launch
- 5 main pages
- Mobile responsive design
- Contact & booking forms
- Professional medical theme
- Complete CSS styling
- JavaScript functionality

## 💡 Future Enhancements

Consider adding:
- Testimonials/review carousel
- Equipment availability calendar
- User account system
- Online payment processing
- Live chat support
- Blog section
- Photo gallery
- Video demonstrations

## ⚠️ Important Notes

1. **Forms are client-side only**: Forms store data locally. Set up backend/email service for production use.
2. **No email sending**: Contact forms don't send emails by default. Integrate with FormSubmit, Netlify Forms, or custom backend.
3. **Placeholder Logo**: Create or upload your actual logo
4. **Update Contact Info**: Replace all business information with your actual details
5. **Test on Mobile**: Always test on actual mobile devices before going live

## 📞 Support & Next Steps

1. **Customize** with your business information
2. **Add logo** and any custom branding
3. **Set up form submissions** (FormSubmit.co or Netlify Forms)
4. **Deploy to Netlify** following deployment instructions
5. **Test thoroughly** on all devices
6. **Monitor analytics** with Google Analytics (optional)

## 🎉 You're Ready!

Your professional medical equipment rental website is ready to deploy. Follow the customization guide, set up form submissions, and deploy to Netlify in minutes!

---

**ComfortCare Website** | Built with HTML, CSS & JavaScript | Perfect for Equipment Rental Business
