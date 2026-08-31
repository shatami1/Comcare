const nodemailer = require('nodemailer');

const ADMIN_EMAIL = 'admin@comcare.store';
const ADMIN_COPY_EMAIL = 'accentGV@gmail.com';

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function cfg() {
  return {
    adminToken: process.env.ATLANTA_LINK_AGENT_TOKEN || process.env.ORDER_ADMIN_TOKEN || process.env.RECOVERY_ADMIN_TOKEN,
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT || '587',
    smtpUser: process.env.SMTP_USER,
    smtpPass: process.env.SMTP_PASS,
    smtpFrom: process.env.SMTP_FROM || `ComCare Store <${ADMIN_EMAIL}>`
  };
}

function clean(value, max = 3000) {
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

function isAdmin(req) {
  const token = cfg().adminToken;
  const header = req.headers.authorization || '';
  return Boolean(token && header === `Bearer ${token}`);
}

function requireSmtp() {
  const config = cfg();
  if (!config.smtpHost || !config.smtpUser || !config.smtpPass) {
    const err = new Error('Email sending is not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM in Vercel.');
    err.status = 500;
    throw err;
  }
  return config;
}

async function sendEmail(input) {
  const config = requireSmtp();
  const to = clean(input.to, 240).toLowerCase();
  const subject = clean(input.subject, 240);
  const text = clean(input.text, 6000);
  const organization = clean(input.organization, 240);
  const website = clean(input.website, 1000);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    const err = new Error('Enter a valid recipient email address.');
    err.status = 400;
    throw err;
  }
  if (!subject || !text) {
    const err = new Error('Subject and message are required.');
    err.status = 400;
    throw err;
  }

  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort || 587),
    secure: Number(config.smtpPort) === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass
    }
  });

  const info = await transporter.sendMail({
    from: config.smtpFrom,
    to,
    bcc: ADMIN_COPY_EMAIL,
    subject,
    text: [
      text,
      '',
      '---',
      organization ? `Outreach target: ${organization}` : '',
      website ? `Website: ${website}` : ''
    ].filter(Boolean).join('\n')
  });

  return { messageId: info.messageId };
}

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  if (!isAdmin(req)) return res.status(401).json({ status: 'error', message: 'Admin token required.' });

  try {
    const result = await sendEmail(parseBody(req));
    return res.status(200).json({ status: 'ok', message: 'Outreach email sent.', result });
  } catch (error) {
    return res.status(error.status || 500).json({ status: 'error', message: error.message || 'Email send failed.' });
  }
};
