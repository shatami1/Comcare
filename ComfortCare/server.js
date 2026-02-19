const express = require('express');
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!stripeKey) {
    console.warn('STRIPE_SECRET_KEY is not set.');
}

const stripe = Stripe(stripeKey || '');

app.use(express.static('.'));
app.use(express.json({ limit: '1mb' }));

app.post('/create-invoice', async (req, res) => {
    try {
        const { items, customer } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        if (!customer?.email || !customer?.name || !customer?.phone) {
            return res.status(400).json({ error: 'Customer details are required.' });
        }

        const stripeCustomer = await stripe.customers.create({
            name: customer.name,
            email: customer.email,
            phone: customer.phone
        });

        const lineItems = items.map(item => {
            const unitAmount = Number(item.unit_amount);
            const quantity = Number(item.quantity);

            if (!item.name || !unitAmount || unitAmount <= 0 || !quantity || quantity <= 0) {
                throw new Error('Invalid line item.');
            }

            return {
                name: item.name,
                description: item.description || '',
                unit_amount: Math.round(unitAmount),
                quantity
            };
        });

        for (const item of lineItems) {
            await stripe.invoiceItems.create({
                customer: stripeCustomer.id,
                currency: 'usd',
                unit_amount: item.unit_amount,
                quantity: item.quantity,
                description: item.description || item.name
            });
        }

        const invoice = await stripe.invoices.create({
            customer: stripeCustomer.id,
            collection_method: 'send_invoice',
            days_until_due: 1,
            auto_advance: false,
            metadata: {
                customer_name: customer.name,
                customer_phone: customer.phone
            }
        });

        const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
        const sent = await stripe.invoices.sendInvoice(finalized.id);

        return res.json({
            invoiceId: sent.id,
            hostedInvoiceUrl: sent.hosted_invoice_url || null
        });
    } catch (error) {
        console.error('Stripe invoice error:', error);
        return res.status(500).json({ error: 'Unable to create and send invoice.' });
    }
});

app.post('/create-checkout-session', async (req, res) => {
    try {
        const { items } = req.body || {};

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        // Convert cart items to Stripe line items
        const lineItems = items.map(item => {
            const unitAmount = Math.round(Number(item.price) * 100); // Convert to cents
            const quantity = Number(item.quantity);

            if (!item.name || unitAmount <= 0 || quantity <= 0) {
                throw new Error('Invalid cart item.');
            }

            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        description: `${item.model || ''} - ${item.rate || 'Daily'}`.trim(),
                    },
                    unit_amount: unitAmount,
                },
                quantity: quantity,
            };
        });

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${req.headers.origin || 'http://localhost:3000'}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${req.headers.origin || 'http://localhost:3000'}/payment.html`,
            billing_address_collection: 'required',
            phone_number_collection: {
                enabled: true,
            },
        });

        return res.json({ sessionId: session.id, url: session.url });
    } catch (error) {
        console.error('Stripe checkout session error:', error);
        return res.status(500).json({ error: 'Unable to create checkout session.' });
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Invoice server running on http://localhost:${port}`);
});
