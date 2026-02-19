# Test Your Vercel Deployment

After deploying to Vercel, run these tests:

## 1. Test Health Endpoint

Replace `YOUR-URL-HERE` with your actual Vercel URL:

```powershell
Invoke-RestMethod -Uri "https://YOUR-URL-HERE.vercel.app/checkout-health"
```

**Expected Result**:
```json
{
  "status": "ok",
  "message": "Server connected and Stripe key is valid."
}
```

If you see an error, check:
- Environment variable is set correctly in Vercel dashboard
- You copied the full secret key (starts with `sk_live_`)
- You redeployed after adding the environment variable

## 2. Copy Your Vercel URL

Once the health check passes, copy your full Vercel URL (e.g., `https://comfortcare-abc123.vercel.app`)

## 3. Next Steps

Reply with your Vercel URL and I'll update script.js to use it!

Example: "My URL is https://comfortcare-abc123.vercel.app"
