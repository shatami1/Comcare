// Vercel Serverless Function for Square Checkout Health Check
const SQUARE_API_VERSION = '2026-05-20';

function sanitizeSquareErrorMessage(payload, fallback = 'Square checkout validation failed.') {
    const error = Array.isArray(payload?.errors) && payload.errors.length ? payload.errors[0] : null;
    const detail = error?.detail || error?.code || payload?.message;
    return detail ? `Square checkout issue: ${detail}` : fallback;
}

function getSquareConfigIssue({ accessToken, locationId }) {
    const tokenLooksPlaceholder = !accessToken
        || /your_|placeholder|access_token_here/i.test(accessToken);
    if (tokenLooksPlaceholder) {
        return 'Square access token is missing or still a placeholder. Add a real Square Production Access Token as SQUARE_ACCESS_TOKEN in Vercel.';
    }

    const locationLooksPlaceholder = !locationId
        || /your_|placeholder|location_id_here/i.test(locationId);
    if (locationLooksPlaceholder) {
        return 'Square location ID is missing or still a placeholder. Add the matching Square Production Location ID as SQUARE_LOCATION_ID in Vercel.';
    }

    return '';
}

async function getCheckoutHealthStatus() {
    const accessToken = process.env.SQUARE_ACCESS_TOKEN;
    const locationId = process.env.SQUARE_LOCATION_ID;
    const configIssue = getSquareConfigIssue({ accessToken, locationId });

    if (configIssue) {
        return {
            status: 'error',
            message: configIssue
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
