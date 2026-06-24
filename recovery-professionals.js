const PUBLIC_COLUMNS = 'id,name,title,specialty,certifications,years_experience,phone,email,website,linkedin,service_area,bio,photo_url,featured,verified,created_at';
const ADMIN_COLUMNS = `${PUBLIC_COLUMNS},status,admin_notes,updated_at`;
const ALLOWED_SPECIALTIES = new Set([
  'Rehab Technician',
  'Physical Therapy Assistant (PTA)',
  'Occupational Therapy Assistant (OTA)',
  'Home Health Aide',
  'Caregiver',
  'Recovery Coach'
]);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function config() {
  return {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    adminToken: process.env.RECOVERY_ADMIN_TOKEN
  };
}

function requireDb(res) {
  const cfg = config();
  if (!cfg.url || !cfg.key) {
    res.status(500).json({ status: 'error', message: 'Recovery database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
    return null;
  }
  return cfg;
}

function isAdmin(req) {
  const token = config().adminToken;
  const header = req.headers.authorization || '';
  return Boolean(token && header === `Bearer ${token}`);
}

function clean(value, max = 500) {
  return String(value || '').trim().slice(0, max);
}

function bool(value) {
  return value === true || value === 'true';
}

function normalizeProfessional(input, admin = false) {
  if (typeof input === 'string') {
    try { input = JSON.parse(input); } catch (error) { input = {}; }
  }
  input = input || {};
  const specialty = clean(input.specialty, 80);
  return {
    name: clean(input.name, 120),
    title: clean(input.title || input.company || specialty, 160),
    specialty: ALLOWED_SPECIALTIES.has(specialty) ? specialty : 'Recovery Coach',
    certifications: clean(input.certifications, 500),
    years_experience: clean(input.yearsExperience || input.years_experience, 40),
    phone: clean(input.phone, 80),
    email: clean(input.email, 180).toLowerCase(),
    website: clean(input.website, 300),
    linkedin: clean(input.linkedin, 300),
    service_area: clean(input.serviceArea || input.service_area, 500),
    bio: clean(input.bio, 2000),
    photo_url: clean(input.photoUrl || input.photo_url, 1000),
    featured: admin ? bool(input.featured) : false,
    verified: admin ? bool(input.verified) : false,
    status: admin ? clean(input.status || 'pending', 40) : 'pending',
    admin_notes: admin ? clean(input.adminNotes || input.admin_notes, 1000) : ''
  };
}

function validateProfessional(item) {
  const missing = [];
  if (!item.name) missing.push('name');
  if (!item.email) missing.push('email');
  if (!item.phone) missing.push('phone');
  if (!item.service_area) missing.push('service_area');
  if (!item.bio) missing.push('bio');
  return missing;
}

async function supabaseRequest(path, options = {}) {
  const cfg = config();
  const base = cfg.url.replace(/\/$/, '');
  const response = await fetch(`${base}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
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

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!requireDb(res)) return;

  try {
    if (req.method === 'GET') {
      const admin = isAdmin(req);
      const qs = admin
        ? `recovery_professionals?select=${ADMIN_COLUMNS}&order=created_at.desc`
        : `recovery_professionals?select=${PUBLIC_COLUMNS}&status=eq.approved&order=featured.desc,created_at.desc`;
      const data = await supabaseRequest(qs, { method: 'GET', headers: { Prefer: undefined } });
      return res.status(200).json({ status: 'ok', professionals: data || [] });
    }

    if (req.method === 'POST') {
      const item = normalizeProfessional(req.body || {}, false);
      const missing = validateProfessional(item);
      if (missing.length) return res.status(400).json({ status: 'error', message: `Missing required fields: ${missing.join(', ')}` });
      const data = await supabaseRequest('recovery_professionals', { method: 'POST', body: JSON.stringify(item) });
      return res.status(201).json({ status: 'ok', professional: Array.isArray(data) ? data[0] : data });
    }

    if (req.method === 'PATCH') {
      if (!isAdmin(req)) return res.status(401).json({ status: 'error', message: 'Admin token required.' });
      const id = clean(req.body?.id, 80);
      if (!id) return res.status(400).json({ status: 'error', message: 'Missing id.' });
      const allowed = {};
      ['status','featured','verified','admin_notes'].forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) allowed[key] = key === 'featured' || key === 'verified' ? bool(req.body[key]) : clean(req.body[key], 1000);
      });
      allowed.updated_at = new Date().toISOString();
      const data = await supabaseRequest(`recovery_professionals?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(allowed) });
      return res.status(200).json({ status: 'ok', professional: Array.isArray(data) ? data[0] : data });
    }

    if (req.method === 'DELETE') {
      if (!isAdmin(req)) return res.status(401).json({ status: 'error', message: 'Admin token required.' });
      const id = clean(req.query?.id || req.body?.id, 80);
      if (!id) return res.status(400).json({ status: 'error', message: 'Missing id.' });
      await supabaseRequest(`recovery_professionals?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
      return res.status(200).json({ status: 'ok', message: 'Professional deleted.' });
    }

    return res.status(405).json({ status: 'error', message: 'Method not allowed.' });
  } catch (error) {
    return res.status(error.status || 500).json({ status: 'error', message: error.message || 'Recovery database error.' });
  }
};