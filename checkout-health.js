// Vercel Serverless Function for Square Checkout Health Check
const SQUARE_API_VERSION = '2026-05-20';

function sanitizeSquareErrorMessage(payload, fallback = 'Square checkout validation failed.') {
    const error = Array.isArray(payload?.errors) && payload.errors.length ? payload.errors[0] : null;
    const detail = error?.detail || error?.code || payload?.message;
    return detail ? `Square checkout issue: ${detail}` : fallback;
}

async function getCheckoutHealthStatus() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!accessToken || !locationId) {
        return {
            status: 'error',
            message: 'Missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID environment variable.'
        };
    }

    try {
        const response = await fetch(`https://connect.squareup.com/v2/locations/${encodeURIComponent(locationId)}`, {
            method: 'GET',
            headers: {
                'Square-Version': SQUARE_API_VERSION,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                status: 'error',
                message: sanitizeSquareErrorMessage(data)
            };
        }

        return {
            status: 'ok',
            message: 'Square checkout connected.'
        };
    } catch (error) {
        return {
            status: 'error',
            message: 'Unable to validate Square connection.'
        };
    }
}

module.exports = async (req, res) => {
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