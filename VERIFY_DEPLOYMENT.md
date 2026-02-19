# Test Commands After Vercel Redeployment

Run these commands after redeploying to verify everything works:

## 1. Test Health Endpoint
```powershell
Invoke-RestMethod -Uri "https://comcare-nine.vercel.app/checkout-health"
```

**Expected**:
```
status  : ok
message : Server connected and Stripe key is valid.
```

## 2. Test Checkout Session Creation
```powershell
$body = @{ items = @(@{ name='Test Item'; model='Demo'; rate='daily'; price=25; quantity=1 }) } | ConvertTo-Json -Depth 5
Invoke-RestMethod -Method Post -Uri "https://comcare-nine.vercel.app/create-checkout-session" -ContentType "application/json" -Body $body
```

**Expected**:
```
sessionId : cs_test_...
url       : https://checkout.stripe.com/c/pay/cs_test_...
```

## 3. Test on GitHub Pages

Once both tests pass, your GitHub Pages site should work perfectly!
The payment page will show correct totals (not $0.00) and redirect to Stripe properly.
