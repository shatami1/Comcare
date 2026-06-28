# Recovery Package Checkout Setup

The recovery-support package buttons are currently set up as normal one-time cart items.

## Current behavior

1. Customer clicks a package button on `recovery-support.html`.
2. `script.js` adds one package item to the normal cart:
   - Essential Recovery Support Package - $49
   - Comfort Recovery Support Package - $149
   - Comfort Extend Support Package - $249
   - Comfort Plus Support Package - $399
3. The customer goes to `pricing.html`.
4. The normal Square checkout charges the selected package as a first-month package charge.
5. Future monthly renewals are handled manually by Comfort Care.

## Required Vercel environment variables

Only the standard Square checkout variables are required:

```env
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_APPLICATION_ID=your_square_application_id_here
SQUARE_LOCATION_ID=your_square_location_id_here
```

Square subscription plan variation IDs are not required while packages are handled as manual-renewal cart items.
