const http = require('http');
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

const stripeKey = process.env.STRIPE_SECRET_KEY;
const port = Number(process.env.PORT || 3000);

if (!stripeKey) {
    console.warn('STRIPE_SECRET_KEY is not set in environment or .env.');
}

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8'
};

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

function sendJson(res, statusCode, payload) {
    const body = JSON.stringify(payload);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': Buffer.byteLength(body),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(body);
}

function collectRequestBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => {
            data += chunk;
            if (data.length > 1024 * 1024) {
                reject(new Error('Request body too large.'));
                req.destroy();
            }
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function getSafeFilePath(urlPathname) {
    const normalizedPath = decodeURIComponent(urlPathname.split('?')[0] || '/');
    const relativePath = normalizedPath === '/' ? '/payment.html' : normalizedPath;
    const resolved = path.normalize(path.join(process.cwd(), relativePath));

    if (!resolved.startsWith(process.cwd())) {
        return null;
    }

    return resolved;
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

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            res.end();
            return;
        }

        if (req.method === 'POST' && req.url === '/create-checkout-session') {
            const body = await collectRequestBody(req);
            const parsed = body ? JSON.parse(body) : {};
            const result = await createCheckoutSession(parsed.items, req.headers.origin);
            sendJson(res, 200, result);
            return;
        }

        if (req.method === 'GET' && (req.url === '/checkout-health' || req.url.startsWith('/checkout-health?'))) {
            const status = await getCheckoutHealthStatus();
            sendJson(res, status.status === 'ok' ? 200 : 503, status);
            return;
        }

        const filePath = getSafeFilePath(req.url || '/');
        if (!filePath) {
            sendJson(res, 403, { error: 'Forbidden path.' });
            return;
        }

        if (!fs.existsSync(filePath)) {
            sendJson(res, 404, { error: 'Not found.' });
            return;
        }

        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            sendJson(res, 404, { error: 'Not found.' });
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        const content = fs.readFileSync(filePath);

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': content.length
        });
        res.end(content);
    } catch (error) {
        console.error('Server error:', error);
        sendJson(res, 500, { error: error.message || 'Server error.' });
    }
});

server.listen(port, () => {
    console.log(`Checkout server running on http://localhost:${port}`);
});
