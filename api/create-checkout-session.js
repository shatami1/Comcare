// Vercel Serverless Function for Checkout Session Creation
const { URLSearchParams } = require('url');

function sanitizeStripeErrorMessage(message) {
    if (!message) {
        return 'An unknown error occurred.';
    }

    if (message.includes('Expired API Key')) {
        return 'Stripe API key is expired. Update your environment variable and redeploy.';
    }

    if (message.includes('does not have the required permissions')) {
        return 'Restricted API key detected. Use a full secret key (sk_live_... or sk_test_...) instead of restricted key (rk_...).';
    }

    if (message.toLowerCase().includes('invalid api key') || message.toLowerCase().includes('no such token')) {
        return 'Invalid Stripe API key. Check your STRIPE_SECRET_KEY environment variable.';
    }

    if (message.includes('No such customer') || message.includes('No such payment_method')) {
        return 'Payment setup error. Please try again.';
    }

    return message;
}

async function createCheckoutSession(items, origin) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        return {
            error: 'Server configuration error. Missing Stripe key.'
        };
    }

    if (!Array.isArray(items) || items.length === 0) {
        return {
            error: 'No items in cart.'
        };
    }

    try {
        const params = new URLSearchParams();
        params.append('mode', 'payment');
        params.append('success_url', `${origin || 'https://comcare-nine.vercel.app'}/thank-you.html`);
        params.append('cancel_url', `${origin || 'https://comcare-nine.vercel.app'}/payment.html`);

        items.forEach((item, idx) => {
            const priceInCents = Math.round(parseFloat(item.price || 0) * 100);
            const quantity = parseInt(item.quantity || 1, 10);
            const name = item.name || 'Item';
            const description = [item.model, item.rate]
                .filter(Boolean)
                .join(' - ') || 'Medical Equipment Rental';

            params.append(`line_items[${idx}][price_data][currency]`, 'usd');
            params.append(`line_items[${idx}][price_data][product_data][name]`, name);
            params.append(`line_items[${idx}][price_data][product_data][description]`, description);
            params.append(`line_items[${idx}][price_data][unit_amount]`, priceInCents.toString());
            params.append(`line_items[${idx}][quantity]`, quantity.toString());
        });

        const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: sanitizeStripeErrorMessage(data?.error?.message || 'Failed to create checkout session.')
            };
        }

        return {
            sessionId: data.id,
            url: data.url
        };
    } catch (error) {
        return {
            error: sanitizeStripeErrorMessage(error.message || 'Network error creating checkout session.')
        };
    }
}

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { items } = req.body;
        const origin = req.headers.origin || req.headers.referer;
        const result = await createCheckoutSession(items, origin);
        
        if (result.error) {
            res.status(400).json(result);
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
