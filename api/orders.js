const nodemailer = require('nodemailer');

const ADMIN_EMAIL = 'admin@comcare.store';
const ADMIN_COPY_EMAIL = 'accentGV@gmail.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function cfg() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminToken: process.env.ORDER_ADMIN_TOKEN || process.env.RECOVERY_ADMIN_TOKEN,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || `ComCare Store <${ADMIN_EMAIL}>`
  };
}

function requireDb(res) {
  const config = cfg();
  if (!config.url || !config.key) {
    res.status(500).json({
      status: 'error',
      message: 'Order database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.'
    });
    return null;
  }
  return config;
}

function isAdmin(req) {
  const token = cfg().adminToken;
  const header = req.headers.authorization || '';
  return Boolean(token && header === `Bearer ${token}`);
}

function clean(value, max = 1000) {
  return String(value || '').trim().slice(0, max);
}

function parseBody(req) {
  const body = req.body || {};
  if (typeof body === 'string') {
    try { return JSON.parse(body || '{}'); } catch (error) { return {}; }
  }
  if (Buffer.isBuffer(body)) {
    try { return JSON.parse(body.toString('utf8') || '{}'); } catch (error) { return {}; }
  }
  return body;
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const unitPrice = Math.max(0, Number(item.unitPrice || item.price || 0));
      return {
        name: clean(item.name || item.equipment || 'Equipment item', 180),
        model: clean(item.model, 240),
        rateType: clean(item.rateType || item.rate || 'Rental', 80),
        unitPrice,
        quantity,
        lineTotal: Number((unitPrice * quantity).toFixed(2))
      };
    })
    .filter((item) => item.name);
}

function getSubtotal(items) {
  return Number(items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0).toFixed(2));
}

function classifyOrder(customer, items) {
  const text = `${customer.notes || ''} ${items.map((item) => item.name).join(' ')}`.toLowerCase();
  const startDate = customer.startDate ? new Date(`${customer.startDate}T12:00:00`) : null;
  const now = new Date();
  const daysUntil = startDate && !Number.isNaN(startDate.getTime())
    ? Math.round((startDate.getTime() - now.getTime()) / 86400000)
    : null;
  const hasBed = /bed|hospital|bariatric/.test(text);
  const hasBathroom = /shower|commode|toilet|bath/.test(text);
  const urgentWords = /urgent|today|tomorrow|discharge|surgery|coming home|hospital/.test(text);
  const priority = urgentWords || (daysUntil !== null && daysUntil <= 2) ? 'urgent' : hasBed ? 'high' : 'normal';
  const zip = clean(customer.zip, 20);
  const inCoreArea = /^30(0|1|2|3)/.test(zip);
  const recommended = [];

  recommended.push('Confirm rental availability.');
  if (hasBed) recommended.push('Confirm bed type, mattress, rails, delivery access, and setup room.');
  if (hasBathroom) recommended.push('Ask whether bathroom support item is for shower, toilet, or bedside use.');
  if (customer.address) recommended.push('Confirm delivery window and access instructions.');
  recommended.push('After owner approval, send Square payment link.');

  return {
    priority,
    serviceAreaStatus: inCoreArea ? 'core Atlanta area' : 'review service area',
    recommendedAction: recommended.join(' ')
  };
}

function buildSummary(customer, items) {
  const subtotal = getSubtotal(items);
  const classification = classifyOrder(customer, items);
  const itemLines = items.length
    ? items.map((item) => `- ${item.quantity} x ${item.name} (${item.rateType}) - $${item.lineTotal.toFixed(2)}`).join('\n')
    : '- No cart items submitted';

  const summary = [
    `Customer: ${customer.name || 'Not provided'}`,
    `Contact: ${customer.phone || 'No phone'} | ${customer.email || 'No email'}`,
    `ZIP/address: ${customer.zip || 'No ZIP'}${customer.address ? ` | ${customer.address}, ${customer.city || ''} ${customer.state || ''}` : ''}`,
    `Requested dates: ${customer.startDate || 'Not set'} to ${customer.endDate || 'Not set'}`,
    `Priority: ${classification.priority}`,
    `Service area: ${classification.serviceAreaStatus}`,
    'Items:',
    itemLines,
    `Estimated rental cart total: $${subtotal.toFixed(2)}`,
    `Next action: ${classification.recommendedAction}`,
    customer.notes ? `Notes: ${customer.notes}` : ''
  ].filter(Boolean).join('\n');

  return { summary, subtotal, ...classification };
}

function buildConfirmation(customer, items, summaryData) {
  const itemText = items.length
    ? items.map((item) => `${item.quantity} x ${item.name}`).join(', ')
    : 'your ComCare equipment request';
  const subject = 'ComCare received your recovery equipment request';
  const body = [
    `Hi ${customer.name || 'there'},`,
    '',
    `Thank you. ComCare received your request for ${itemText}.`,
    '',
    `Our team will confirm availability, delivery timing, and the best next step for your ZIP code (${customer.zip || 'not provided'}).`,
    customer.startDate ? `Requested start date: ${customer.startDate}` : '',
    '',
    'If the request is urgent, you can also call or text 678-242-9309.',
    '',
    'Comfort Care',
    'comcare.store'
  ].filter(Boolean).join('\n');

  return { subject, body, priority: summaryData.priority };
}

function canSendEmail() {
  const config = cfg();
  return Boolean(config.smtpHost && config.smtpUser && config.smtpPass);
}

async function sendEmail({ to, subject, text }) {
  const config = cfg();
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort || 587),
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  return transporter.sendMail({
    from: config.smtpFrom,
    to,
    bcc: ADMIN_COPY_EMAIL,
    subject,
    text
  });
}

async function supabaseRequest(path, options = {}) {
  const config = cfg();
  const base = config.url.replace(/\/$/, '');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (error) { data = text; }
  if (!response.ok) {
    const message = data?.message || data?.hint || data?.details || 'Database request failed.';
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function recordEvent(orderId, type, note) {
  if (!orderId) return;
  await supabaseRequest('comcare_order_events', {
    method: 'POST',
    body: JSON.stringify({
      order_id: orderId,
      event_type: clean(type, 80),
      note: clean(note, 2000)
    })
  });
}

async function createOrder(input) {
  const customer = {
    name: clean(input.customer?.name || input.name, 160),
    email: clean(input.customer?.email || input.email, 220).toLowerCase(),
    phone: clean(input.customer?.phone || input.phone, 80),
    address: clean(input.customer?.address || input.address, 240),
    city: clean(input.customer?.city || input.city, 120),
    state: clean(input.customer?.state || input.state || 'GA', 40),
    zip: clean(input.customer?.zip || input.zip, 20),
    startDate: clean(input.customer?.startDate || input.startDate, 40),
    endDate: clean(input.customer?.endDate || input.endDate, 40),
    notes: clean(input.customer?.notes || input.notes, 3000)
  };
  const items = normalizeItems(input.items);
  const missing = [];
  if (!customer.name) missing.push('name');
  if (!customer.email && !customer.phone) missing.push('email or phone');
  if (!customer.zip) missing.push('zip');
  if (!items.length) missing.push('cart items');
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const summaryData = buildSummary(customer, items);
  const confirmation = buildConfirmation(customer, items, summaryData);
  const orderPayload = {
    status: 'new',
    priority: summaryData.priority,
    service_area_status: summaryData.serviceAreaStatus,
    customer_name: customer.name,
    customer_email: customer.email,
    customer_phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zip: customer.zip,
    start_date: customer.startDate || null,
    end_date: customer.endDate || null,
    notes: customer.notes,
    items,
    subtotal: summaryData.subtotal,
    summary: summaryData.summary,
    recommended_action: summaryData.recommendedAction,
    confirmation_subject: confirmation.subject,
    confirmation_body: confirmation.body,
    confirmation_status: 'ready'
  };

  const inserted = await supabaseRequest('comcare_orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  });
  const order = Array.isArray(inserted) ? inserted[0] : inserted;
  await recordEvent(order.id, 'order_created', 'Customer submitted order request. AI summary created.');

  let confirmationStatus = 'ready';
  let confirmationError = '';
  if (customer.email && canSendEmail()) {
    try {
      await sendEmail({ to: customer.email, subject: confirmation.subject, text: confirmation.body });
      confirmationStatus = 'sent';
      await recordEvent(order.id, 'confirmation_sent', `Confirmation email sent to ${customer.email}.`);
    } catch (error) {
      confirmationStatus = 'email_error';
      confirmationError = error.message || 'Email failed.';
      await recordEvent(order.id, 'confirmation_error', confirmationError);
    }
    const updated = await supabaseRequest(`comcare_orders?id=eq.${encodeURIComponent(order.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        confirmation_status: confirmationStatus,
        confirmation_error: confirmationError,
        updated_at: new Date().toISOString()
      })
    });
    return Array.isArray(updated) ? updated[0] : updated;
  }

  return order;
}

async function updateOrder(input) {
  const id = clean(input.id, 80);
  const action = clean(input.action, 80);
  if (!id || !action) {
    const err = new Error('Missing order id or action.');
    err.status = 400;
    throw err;
  }

  const now = new Date().toISOString();
  const updates = { updated_at: now };
  let eventNote = '';

  if (action === 'approve') {
    updates.status = 'approved';
    eventNote = 'Owner approved order request.';
  } else if (action === 'send_payment_link') {
    updates.status = 'payment_link_sent';
    updates.payment_link = clean(input.paymentLink, 1000);
    eventNote = updates.payment_link ? `Payment link recorded: ${updates.payment_link}` : 'Payment link marked as sent.';
  } else if (action === 'schedule_delivery') {
    updates.status = 'delivery_scheduled';
    updates.delivery_window = clean(input.deliveryWindow, 300);
    eventNote = `Delivery scheduled: ${updates.delivery_window || 'window not entered'}.`;
  } else if (action === 'mark_delivered') {
    updates.status = 'delivered';
    updates.delivered_at = now;
    eventNote = 'Order marked delivered/setup complete.';
  } else if (action === 'pickup_needed') {
    updates.status = 'pickup_needed';
    updates.pickup_requested_at = now;
    eventNote = 'Pickup needed.';
  } else if (action === 'close') {
    updates.status = 'closed';
    eventNote = 'Order closed.';
  } else if (action === 'owner_note') {
    updates.owner_notes = clean(input.ownerNotes, 3000);
    eventNote = `Owner note updated: ${updates.owner_notes}`;
  } else {
    const err = new Error('Unknown order action.');
    err.status = 400;
    throw err;
  }

  const updated = await supabaseRequest(`comcare_orders?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(updates)
  });
  await recordEvent(id, action, eventNote);
  return Array.isArray(updated) ? updated[0] : updated;
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireDb(res)) return;

  try {
    if (req.method === 'POST') {
      const order = await createOrder(parseBody(req));
      return res.status(201).json({ status: 'ok', order });
    }

    if (req.method === 'GET') {
      if (!isAdmin(req)) return res.status(401).json({ status: 'error', message: 'Admin token required.' });
      const orders = await supabaseRequest('comcare_orders?select=*&order=created_at.desc&limit=100', {
        method: 'GET',
        headers: { Prefer: undefined }
      });
      return res.status(200).json({ status: 'ok', orders: orders || [] });
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return res.status(401).json({ status: 'error', message: 'Admin token required.' });
      const order = await updateOrder(parseBody(req));
      return res.status(200).json({ status: 'ok', order });
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  } catch (error) {
    return res.status(error.status || 500).json({ status: 'error', message: error.message || 'Order automation error.' });
  }
};
