const OWNER_CODE = "9309";

const stats = globalThis.__COMCARE_DEMO_STATS__ || {
  startedAt: Date.now(),
  landingVisits: 0,
  syncCodesCreated: 0,
  patientOpens: 0,
  caregiverOpens: 0,
  setupOpens: 0,
  events: []
};

globalThis.__COMCARE_DEMO_STATS__ = stats;

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  });
}

function clean(value, limit = 80) {
  return String(value || "").replace(/[^\w\s:.-]/g, "").trim().slice(0, limit);
}

function authorize(req) {
  const supplied = req.query?.code || req.headers["x-comcare-owner-code"];
  return String(supplied || "") === OWNER_CODE;
}

function activeSince(ms) {
  return stats.events.filter(item => item.at >= Date.now() - ms).length;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "POST") {
    const event = clean(req.body?.event, 40);
    const role = clean(req.body?.role, 30);
    const pairCode = clean(req.body?.pairCode, 10);

    if (event === "landing") stats.landingVisits += 1;
    if (event === "code-created") stats.syncCodesCreated += 1;
    if (event === "demo-open" && role === "patient") stats.patientOpens += 1;
    if (event === "demo-open" && role === "caregiver") stats.caregiverOpens += 1;
    if (event === "demo-open" && role === "setup") stats.setupOpens += 1;

    stats.events.unshift({
      event,
      role,
      pairCode,
      time: nowLabel(),
      at: Date.now()
    });
    stats.events = stats.events.slice(0, 100);

    res.status(200).json({ ok: true });
    return;
  }

  if (req.method === "GET") {
    if (!authorize(req)) {
      res.status(401).json({ error: "Private code required." });
      return;
    }

    res.status(200).json({
      startedAt: stats.startedAt,
      totals: {
        landingVisits: stats.landingVisits,
        syncCodesCreated: stats.syncCodesCreated,
        patientOpens: stats.patientOpens,
        caregiverOpens: stats.caregiverOpens,
        setupOpens: stats.setupOpens,
        activeEventsLast5Minutes: activeSince(5 * 60 * 1000)
      },
      recent: stats.events.slice(0, 30)
    });
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
};
