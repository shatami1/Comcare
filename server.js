const express = require('express');
const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');

function loadDotEnv() {
    const envPath = path.join(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }

    const content = fs.readFileSync(envPath, 'utf8');
    content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return;
        }

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) {
            return;
        }

        const key = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (!process.env[key]) {
            process.env[key] = value;
        }
    });
}

loadDotEnv();

const app = express();
const stripeKey = process.env.STRIPE_SECRET_KEY;
const port = Number(process.env.PORT || 3000);

if (!stripeKey) {
    console.warn('STRIPE_SECRET_KEY is not set in environment or .env.');
}

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }
    return next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

function sanitizeStripeErrorMessage(rawMessage) {
    const message = String(rawMessage || '').trim();
    if (!message) {
        return 'Unable to connect to Stripe. Check your server configuration.';
    }

    if (message.includes('does not have the required permissions')) {
        return 'Restricted API key detected. Use a full secret key (sk_live_... or sk_test_...) instead of restricted key (rk_...).';
    }

    if (message.includes('Expired API Key provided')) {
        return 'Stripe API key is expired. Update STRIPE_SECRET_KEY in .env and restart the server.';
    }

    if (message.includes('Invalid API Key provided')) {
        return 'Stripe API key is invalid. Update STRIPE_SECRET_KEY in .env and restart the server.';
    }

    if (message.includes('No API key provided')) {
        return 'Stripe API key is missing. Set STRIPE_SECRET_KEY in .env and restart the server.';
    }

    return message;
}

async function createCheckoutSession(items, requestOrigin) {
    if (!stripeKey) {
        throw new Error('Missing STRIPE_SECRET_KEY.');
    }

    const validItems = (Array.isArray(items) ? items : []).filter((item) => {
        const price = Number(item?.price || 0);
        const quantity = Number(item?.quantity || 0);
        return item?.name && price > 0 && quantity > 0;
    });

    if (validItems.length === 0) {
        throw new Error('Cart is empty.');
    }

    const baseUrl = requestOrigin && requestOrigin !== 'null'
        ? requestOrigin
        : `http://localhost:${port}`;

    const form = new URLSearchParams();
    form.append('mode', 'payment');
    form.append('success_url', `${baseUrl}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`);
    form.append('cancel_url', `${baseUrl}/payment.html`);
    form.append('billing_address_collection', 'required');
    form.append('phone_number_collection[enabled]', 'true');

    validItems.forEach((item, index) => {
        const unitAmount = Math.round(Number(item.price) * 100);
        const quantity = Number(item.quantity);
        const description = `${item.model || ''} - ${item.rate || 'Daily'}`.trim();

        form.append(`line_items[${index}][price_data][currency]`, 'usd');
        form.append(`line_items[${index}][price_data][product_data][name]`, String(item.name));
        if (description && description !== '-') {
            form.append(`line_items[${index}][price_data][product_data][description]`, description);
        }
        form.append(`line_items[${index}][price_data][unit_amount]`, String(unitAmount));
        form.append(`line_items[${index}][quantity]`, String(quantity));
    });

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form.toString()
    });

    const data = await response.json();

    if (!response.ok) {
        const details = sanitizeStripeErrorMessage(data?.error?.message || 'Unable to create checkout session.');
        throw new Error(details);
    }

    return {
        sessionId: data.id,
        url: data.url
    };
}

async function getCheckoutHealthStatus() {
    if (!stripeKey) {
        return {
            status: 'error',
            message: 'Missing STRIPE_SECRET_KEY.'
        };
    }

    try {
        const response = await fetch('https://api.stripe.com/v1/account', {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${stripeKey}`
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                status: 'error',
                message: sanitizeStripeErrorMessage(data?.error?.message || 'Stripe key validation failed.')
            };
        }

        return {
            status: 'ok',
            message: 'Server connected and Stripe key is valid.'
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Unable to validate Stripe connection.'
        };
    }
}

app.post('/create-checkout-session', async (req, res) => {
    try {
        const result = await createCheckoutSession(req.body?.items, req.headers.origin);
        return res.status(200).json(result);
    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ error: error.message || 'Server error.' });
    }
});

app.get('/checkout-health', async (req, res) => {
    const status = await getCheckoutHealthStatus();
    return res.status(status.status === 'ok' ? 200 : 503).json(status);
});

// Preserve the previous server behavior where the root URL loads payment.html.
app.get('/', (req, res) => {
    return res.sendFile(path.join(process.cwd(), 'payment.html'));
});

app.use(express.static(process.cwd(), {
    extensions: ['html']
}));

app.use((req, res) => {
    return res.status(404).json({ error: 'Not found.' });
});

if (require.main === module) {
    app.listen(port, () => {
        console.log(`Checkout server running on http://localhost:${port}`);
    });
}

module.exports = app;
