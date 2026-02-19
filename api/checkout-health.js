// Vercel Serverless Function for Health Check
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

    return message;
}

async function getCheckoutHealthStatus() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeKey) {
        return {
            status: 'error',
            message: 'STRIPE_SECRET_KEY environment variable is not set.'
        };
    }

    if (stripeKey.startsWith('rk_')) {
        return {
            status: 'error',
            message: 'Restricted API key detected. Use a full secret key (sk_live_... or sk_test_...) instead of restricted key (rk_...).'
        };
    }

    try {
        const response = await fetch('https://api.stripe.com/v1/account', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${stripeKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
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

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).end();
        return;
    }

    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const status = await getCheckoutHealthStatus();
        const statusCode = status.status === 'ok' ? 200 : 503;
        res.status(statusCode).json(status);
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};
