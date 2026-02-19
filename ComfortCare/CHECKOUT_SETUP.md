# ComfortCare Dynamic Checkout Setup

## ✅ What's Been Implemented

### Option 1: Pre-Checkout Review Page ✓
- **payment.html** now shows a complete cart review before checkout
- Features:
  - Full cart item display with quantities and prices
  - **Edit Cart** button (goes to order.html)
  - **Email Cart for Discounts** button (pre-populated email)
  - **Pay Now with Stripe** button (dynamic checkout)
  - Empty cart detection
  - Responsive mobile design

### Option 2: Dynamic Stripe Integration ✓
- **server.js** updated with `/create-checkout-session` endpoint
- Sends cart items dynamically to Stripe
- Creates custom checkout for each order
- Redirects to thank-you.html after successful payment
- Returns to payment.html if cancelled

## 🚀 How to Run the Server

### Step 1: Install Node.js
1. Download from: https://nodejs.org
2. Choose **LTS version** (recommended)
3. Run installer, keep default settings
4. Restart your computer after installation

### Step 2: Install Dependencies
Open PowerShell in the ComfortCare folder and run:
```powershell
npm install
```

### Step 3: Start the Server
```powershell
npm start
```
Server will run at: http://localhost:3000

### Step 4: Test the Checkout Flow
1. Open http://localhost:3000 in your browser
2. Go to **Order** page
3. Add items to cart
4. Click **Pay** button in header
5. Review items on checkout page
6. Click **Pay Now with Stripe**
7. Complete checkout on Stripe

## 🔧 Configuration

### Stripe API Key
Your Stripe secret key is already configured in `.env` file:
```
STRIPE_SECRET_KEY=sk_live_51SzHz...
```

**⚠️ Important:** This is a LIVE key - real charges will be processed!

### Test Mode (Recommended)
For testing, get a test key from Stripe Dashboard:
1. Go to https://dashboard.stripe.com/test/apikeys
2. Copy **Secret key** (starts with `sk_test_`)
3. Update `.env` file:
   ```
   STRIPE_SECRET_KEY=sk_test_YOUR_TEST_KEY_HERE
   ```

## 📂 Files Modified

| File | Changes |
|------|---------|
| **payment.html** | Complete checkout review page with cart display |
| **server.js** | Added `/create-checkout-session` endpoint |
| **script.js** | Added `initCheckoutPage()` function |
| **styles.css** | Added checkout grid and cart item styles |
| **.env** | Renamed from .env.txt (ready to use) |

## 🎨 Features on Checkout Page

✅ Cart items with model, rate type, and prices  
✅ Quantity display for each item  
✅ Item totals and grand total  
✅ Edit Cart button (returns to order page)  
✅ Email for Discounts (pre-populated with cart)  
✅ Pay Now with Stripe (dynamic checkout)  
✅ Empty cart detection and message  
✅ Mobile responsive design  
✅ Secure badge display  

## 🌐 Deployment Notes

### For Hosting
When deploying to a host (Netlify, Vercel, etc.):
1. The server.js must run (can't be static-only)
2. Host must support Node.js (Netlify Functions, Vercel, Heroku, Railway)
3. Set `STRIPE_SECRET_KEY` in host's environment variables
4. Update success/cancel URLs in server.js if needed

### Static Hosting Alternative
If you want static-only hosting (no server):
- Keep the static Stripe link: https://buy.stripe.com/6oU28t7f16xQdW12QP24001
- Users click "Pay" → goes directly to Stripe
- Cart review page still works (shows items before redirecting)

## 🔒 Security Notes

- Never commit `.env` file to Git (it's ignored by default)
- Keep Stripe secret key private
- Use test keys during development
- Switch to live keys only when ready for real payments

## 📞 Support

If you encounter issues:
1. Ensure Node.js is installed: `node --version`
2. Check dependencies installed: Look for `node_modules` folder
3. Verify .env file contains your Stripe key
4. Check server console for error messages

---

**Your checkout system is ready to use once Node.js is installed!**
