// Vercel Serverless Function for Square Checkout Payment Link Creation
const crypto = require('crypto');

const SQUARE_API_VERSION = '2026-05-20';
const SQUARE_CHECKOUT_URL = 'https://connect.squareup.com/v2/online-checkout/payment-links';

const RECOVERY_PACKAGE_SUBSCRIPTIONS = {
    essential: {
        code: 'essential',
        name: 'Essential Recovery',
        amountCents: 4900,
        planVariationEnv: 'SQUARE_RECOVERY_ESSENTIAL_PLAN_VARIATION_ID'
    },
    comfort: {
        code: 'comfort',
        name: 'Comfort Recovery',
        amountCents: 14900,
        planVariationEnv: 'SQUARE_RECOVERY_COMFORT_PLAN_VARIATION_ID'
    },
    extend: {
        code: 'extend',
        name: 'Comfort Extend',
        amountCents: 24900,
        planVariationEnv: 'SQUARE_RECOVERY_EXTEND_PLAN_VARIATION_ID'
    },
    plus: {
        code: 'plus',
        name: 'Comfort Plus',
        amountCents: 39900,
        planVariationEnv: 'SQUARE_RECOVERY_PLUS_PLAN_VARIATION_ID'
    }
};

function createIdempotencyKey() {
    if (typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }

    return crypto.randomBytes(16).toString('hex');
}

function getRequestBody(req) {
    const body = req.body || {};

    if (Buffer.isBuffer(body)) {
        return JSON.parse(body.toString('utf8') || '{}');
    }

    if (typeof body === 'string') {
        return JSON.parse(body || '{}');
    }

    return body;
}

function getBaseUrl(req, origin) {
    const candidate = origin || req?.headers?.origin || req?.headers?.referer || 'https://comcare.store';
    try {
        const url = new URL(candidate);
        return `${url.protocol}//${url.host}`;
    } catch (error) {
        return 'https://comcare.store';
    }
}

function sanitizeSquareErrorMessage(payload, fallback = 'Unable to create Square checkout link.') {
    const error = Array.isArray(payload?.errors) && payload.errors.length ? payload.errors[0] : null;
    const detail = error?.detail || error?.code || payload?.message;
    if (!detail) {
        return fallback;
    }
    return `Square checkout issue: ${detail}`;
}

function getSquareConfig() {
    return {
        accessToken: process.env.SQUARE_ACCESS_TOKEN,
        locationId: process.env.SQUARE_LOCATION_ID,
        applicationId: process.env.SQUARE_APPLICATION_ID
    };
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

function buildSquareLineItems(items) {
    return (Array.isArray(items) ? items : [])
        .map((item) => {
            const quantity = Math.max(1, Number(item?.quantity || 1));
            const unitAmount = Math.round(Number(item?.price || 0) * 100);
            const name = String(item?.name || 'Mobility equipment rental').slice(0, 512);
            const variation = [item?.model, item?.rate]
                .filter(Boolean)
                .join(' - ')
                .slice(0, 255);

            return {
                name,
                quantity: String(quantity),
                base_price_money: {
                    amount: unitAmount,
                    currency: 'USD'
                },
                note: variation || undefined
            };
        })
        .filter((item) => item.name && item.base_price_money.amount > 0 && Number(item.quantity) > 0);
}

function getRecoveryPackage(packageCode) {
    const normalizedCode = String(packageCode || '').trim().toLowerCase();
    return RECOVERY_PACKAGE_SUBSCRIPTIONS[normalizedCode] || null;
}

function buildSubscriptionCheckoutBody(subscription, req, locationId) {
    const recoveryPackage = getRecoveryPackage(subscription?.packageCode);
    if (!recoveryPackage) {
        return {
            error: 'Unknown recovery support package.'
        };
    }

    const planVariationId = process.env[recoveryPackage.planVariationEnv];
    if (!planVariationId) {
        return {
            error: `Square monthly billing is not configured for ${recoveryPackage.name}. Add ${recoveryPackage.planVariationEnv} in Vercel after creating the monthly Square subscription plan variation.`
        };
    }

    const baseUrl = getBaseUrl(req);
    return {
        body: {
            idempotency_key: createIdempotencyKey(),
            quick_pay: {
                name: `${recoveryPackage.name} Monthly Recovery Support`,
                price_money: {
                    amount: recoveryPackage.amountCents,
                    currency: 'USD'
                },
                location_id: locationId
            },
            subscription_plan_id: planVariationId,
            checkout_options: {
                redirect_url: `${baseUrl}/home.html?checkout=subscription-success&package=${encodeURIComponent(recoveryPackage.code)}`,
                ask_for_shipping_address: true,
                merchant_support_email: 'admin@comcare.store'
            },
            payment_note: `ComCare ${recoveryPackage.name} monthly recovery support subscription`
        },
        package: recoveryPackage
    };
}

async function createRecoverySubscriptionCheckout(subscription, req) {
    const { accessToken, locationId } = getSquareConfig();
    const configIssue = getSquareConfigIssue({ accessToken, locationId });

    if (configIssue) {
        return {
            error: configIssue
        };
    }

    const built = buildSubscriptionCheckoutBody(subscription, req, locationId);
    if (built.error) {
        return {
            error: built.error
        };
    }

    try {
        const response = await fetch(SQUARE_CHECKOUT_URL, {
            method: 'POST',
            headers: {
                'Square-Version': SQUARE_API_VERSION,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(built.body)
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                error: sanitizeSquareErrorMessage(data)
            };
        }

        return {
            mode: 'subscription',
            packageCode: built.package.code,
            packageName: built.package.name,
            monthlyAmount: built.package.amountCents / 100,
            sessionId: data?.payment_link?.id,
            url: data?.payment_link?.url || data?.payment_link?.long_url
        };
    } catch (error) {
        return {
            error: error.message || 'Network error creating Square monthly checkout link.'
        };
    }
}

async function createCheckoutSession(items, req) {
    const { accessToken, locationId } = getSquareConfig();
    const configIssue = getSquareConfigIssue({ accessToken, locationId });

    if (configIssue) {
        return {
            error: configIssue
        };
    }

    const lineItems = buildSquareLineItems(items);
    if (lineItems.length === 0) {
        return {
            error: 'No valid items in cart.'
        };
    }

    const baseUrl = getBaseUrl(req);
    const body = {
        idempotency_key: createIdempotencyKey(),
        description: 'Comcare mobility equipment rental checkout',
        order: {
            location_id: locationId,
            line_items: lineItems,
            source: {
                name: 'comcare.store'
            }
        },
        checkout_options: {
            redirect_url: `${baseUrl}/home.html?checkout=success`,
            ask_for_shipping_address: true,
            merchant_support_email: 'admin@comcare.store'
        },
        payment_note: 'MOON LIGHTING INC. DBA Comfort Care rental order'
    };

    try {
        const response = await fetch(SQUARE_CHECKOUT_URL, {
            method: 'POST',
            headers: {
                'Square-Version': SQUARE_API_VERSION,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        if (!response.ok) {
            return {
                error: sanitizeSquareErrorMessage(data)
            };
        }

        return {
            sessionId: data?.payment_link?.id,
            url: data?.payment_link?.url || data?.payment_link?.long_url
        };
    } catch (error) {
        return {
            error: error.message || 'Network error creating Square checkout link.'
        };
    }
}

module.exports = async (req, res) => {
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
        const { items, subscription } = getRequestBody(req);
        const result = subscription
            ? await createRecoverySubscriptionCheckout(subscription, req)
            : await createCheckoutSession(items, req);

        if (result.error) {
            res.status(400).json(result);
        } else {
            res.status(200).json(result);
        }
    } catch (error) {
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
