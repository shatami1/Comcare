const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
const squareLocationId = process.env.SQUARE_LOCATION_ID;
const squareApiVersion = '2026-05-20';
const port = Number(process.env.PORT || 3000);

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

if (!squareAccessToken || !squareLocationId) {
    console.warn('SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID is not set in environment or .env.');
}

function getSquareConfigIssue() {
    const tokenLooksPlaceholder = !squareAccessToken
        || /your_|placeholder|access_token_here/i.test(squareAccessToken);
    if (tokenLooksPlaceholder) {
        return 'Square access token is missing or still a placeholder. Replace SQUARE_ACCESS_TOKEN with a real Square Production Access Token.';
    }

    const locationLooksPlaceholder = !squareLocationId
        || /your_|placeholder|location_id_here/i.test(squareLocationId);
    if (locationLooksPlaceholder) {
        return 'Square location ID is missing or still a placeholder. Replace SQUARE_LOCATION_ID with the matching Square Production Location ID.';
    }

    return '';
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

function sanitizeSquareErrorMessage(payload, fallback = 'Square checkout validation failed.') {
    const error = Array.isArray(payload?.errors) && payload.errors.length ? payload.errors[0] : null;
    const detail = error?.detail || error?.code || payload?.message;
    return detail ? `Square checkout issue: ${detail}` : fallback;
}

function buildSquareLineItems(items) {
    return (Array.isArray(items) ? items : [])
        .map((item) => {
            const quantity = Math.max(1, Number(item?.quantity || 1));
            const unitAmount = Math.round(Number(item?.price || 0) * 100);
            const name = String(item?.name || 'Mobility equipment rental').slice(0, 512);
            const note = [item?.model, item?.rate]
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
                note: note || undefined
            };
        })
        .filter((item) => item.name && item.base_price_money.amount > 0 && Number(item.quantity) > 0);
}

function getBaseUrl(requestOrigin) {
    const candidate = requestOrigin && requestOrigin !== 'null'
        ? requestOrigin
        : `http://localhost:${port}`;

    try {
        const url = new URL(candidate);
        return `${url.protocol}//${url.host}`;
    } catch (error) {
        return `http://localhost:${port}`;
    }
}

function getRecoveryPackage(packageCode) {
    const normalizedCode = String(packageCode || '').trim().toLowerCase();
    return RECOVERY_PACKAGE_SUBSCRIPTIONS[normalizedCode] || null;
}

function buildSubscriptionCheckoutBody(subscription, requestOrigin) {
    const recoveryPackage = getRecoveryPackage(subscription?.packageCode);
    if (!recoveryPackage) {
        throw new Error('Unknown recovery support package.');
    }

    const planVariationId = process.env[recoveryPackage.planVariationEnv];
    if (!planVariationId) {
        throw new Error(`Square monthly billing is not configured for ${recoveryPackage.name}. Add ${recoveryPackage.planVariationEnv} after creating the monthly Square subscription plan variation.`);
    }

    const baseUrl = getBaseUrl(requestOrigin);
    return {
        body: {
            idempotency_key: crypto.randomUUID(),
            quick_pay: {
                name: `${recoveryPackage.name} Monthly Recovery Support`,
                price_money: {
                    amount: recoveryPackage.amountCents,
                    currency: 'USD'
                },
                location_id: squareLocationId
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

async function createRecoverySubscriptionCheckout(subscription, requestOrigin) {
    const configIssue = getSquareConfigIssue();
    if (configIssue) {
        throw new Error(configIssue);
    }

    const built = buildSubscriptionCheckoutBody(subscription, requestOrigin);

    const response = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
        method: 'POST',
        headers: {
            'Square-Version': squareApiVersion,
            Authorization: `Bearer ${squareAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(built.body)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(sanitizeSquareErrorMessage(data, 'Unable to create Square monthly checkout link.'));
    }

    return {
        mode: 'subscription',
        packageCode: built.package.code,
        packageName: built.package.name,
        monthlyAmount: built.package.amountCents / 100,
        sessionId: data?.payment_link?.id,
        url: data?.payment_link?.url || data?.payment_link?.long_url
    };
}

async function createCheckoutSession(items, requestOrigin) {
    const configIssue = getSquareConfigIssue();
    if (configIssue) {
        throw new Error(configIssue);
    }

    const lineItems = buildSquareLineItems(items);
    if (lineItems.length === 0) {
        throw new Error('Cart is empty.');
    }

    const baseUrl = getBaseUrl(requestOrigin);
    const body = {
        idempotency_key: crypto.randomUUID(),
        description: 'Comcare mobility equipment rental checkout',
        order: {
            location_id: squareLocationId,
            line_items: lineItems,
            source: {
                name: 'comcare.store'
            }
        },
        checkout_options: {
            redirect_url: `${baseUrl}/thank-you.html`,
            ask_for_shipping_address: true,
            merchant_support_email: 'admin@comcare.store'
        },
        payment_note: 'MOON LIGHTING INC. DBA Comfort Care rental order'
    };

    const response = await fetch('https://connect.squareup.com/v2/online-checkout/payment-links', {
        method: 'POST',
        headers: {
            'Square-Version': squareApiVersion,
            Authorization: `Bearer ${squareAccessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    const data = await response.json();
    if (!response.ok) {
        throw new Error(sanitizeSquareErrorMessage(data, 'Unable to create Square checkout link.'));
    }

    return {
        sessionId: data?.payment_link?.id,
        url: data?.payment_link?.url || data?.payment_link?.long_url
    };
}

async function getCheckoutHealthStatus() {
    const configIssue = getSquareConfigIssue();
    if (configIssue) {
        return {
            status: 'error',
            message: configIssue
        };
    }

    try {
        const response = await fetch(`https://connect.squareup.com/v2/locations/${encodeURIComponent(squareLocationId)}`, {
            method: 'GET',
            headers: {
                'Square-Version': squareApiVersion,
                Authorization: `Bearer ${squareAccessToken}`,
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
app.post('/create-checkout-session', async (req, res) => {
    try {
        const result = req.body?.subscription
            ? await createRecoverySubscriptionCheckout(req.body.subscription, req.headers.origin)
            : await createCheckoutSession(req.body?.items, req.headers.origin);
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
