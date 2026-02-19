# Vercel Deployment Guide

## Prerequisites
- A Vercel account (free): https://vercel.com/signup
- Your Stripe secret key: `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`

## Deployment Steps

### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel**: https://vercel.com/new

2. **Import your GitHub repository** (or upload folder if not using git)

3. **Configure Environment Variables**:
   - Click "Environment Variables"
   - Add: `STRIPE_SECRET_KEY` = `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`

4. **Deploy**: Click "Deploy"

5. **Copy your Vercel URL**: Something like `https://comfortcare-xyz.vercel.app`

6. **Update script.js** (see below)

### Method 2: Vercel CLI

```powershell
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variable
vercel env add STRIPE_SECRET_KEY
# Paste: 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

# Redeploy with environment variable
vercel --prod
```

## After Deployment

Once you have your Vercel URL (e.g., `https://comfortcare-xyz.vercel.app`):

1. **Test the health endpoint**:
   ```powershell
   Invoke-RestMethod https://your-vercel-url.vercel.app/checkout-health
   ```
   
   Should return: `{"status":"ok","message":"Server connected and Stripe key is valid."}`

2. **Update script.js** to use your Vercel URL (I'll help you with this)

3. **Upload updated files to GitHub Pages**

## Troubleshooting

- **503 Error**: Check environment variable is set correctly in Vercel dashboard
- **CORS Error**: Vercel automatically handles CORS for your domain
- **404 on /create-checkout-session**: Make sure vercel.json is in the root directory

## Files Created

- `vercel.json` - Vercel configuration
- `.vercelignore` - Files to exclude from deployment
- `DEPLOYMENT.md` - This guide
