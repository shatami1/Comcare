const globalStore = globalThis.__COMCARE_RECOVERY_HUB_ROOMS__ || new Map();
globalThis.__COMCARE_RECOVERY_HUB_ROOMS__ = globalStore;

const MAX_EVENTS = 80;
const ROOM_TTL_MS = 1000 * 60 * 10;

function cleanCode(value) {
  return String(value || "").replace(/\D/g, "").slice(0, 6);
}

function cleanText(value, limit = 600) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function nowLabel() {
  return new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York"
  });
}

function defaultRoom(code) {
  return {
    code,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    currentStatus: "Awake - Home screen",
    careCircleMembers: [],
    profile: {
      updatedAt: 0,
      patientName: "Robert",
      preferredLanguage: "English",
      dateOfBirth: "",
      recoveryStart: "",
      recoveryType: "Home recovery",
      accessibility: "Large text, simple screen, high contrast",
      caregiverName: "Sarah Johnson",
      caregiverRole: "Daughter and primary caregiver",
      caregiverPhone: "",
      caregiverEmail: "",
      availability: "Sarah is available",
      familyContacts: "",
      emergencyOrder: "Sarah, then Michael",
      morningPreference: "Relaxing piano and a short good-morning message",
      comfortInterests: "Family photos, relaxing music, inspirational programs",
      helpInstructions: "Notify Sarah first. Keep 911 visible for emergencies.",
      medicationName: "Morning medication",
      medicationTimes: "10:00 AM",
      medicationInstructions: "Take with water. Confirm after taking.",
      bathingSchedule: "Tuesday, Thursday, and Saturday at 10:30 AM",
      bathingAssistance: "Use shower chair. Caregiver remains nearby.",
      dailyQuestion: "Would you prefer your family call at lunch or dinner?",
      dailyQuestionOption1: "Lunch",
      dailyQuestionOption2: "Dinner",
      schedule: [
        { time: "10:00 AM", title: "Morning medication reminder", owner: "Sarah", acknowledge: true },
        { time: "12:30 PM", title: "Lunch and hydration", owner: "Sarah", acknowledge: true },
        { time: "2:30 PM", title: "Physical therapy visit", owner: "Sarah", acknowledge: false }
      ]
    },
    helpRequest: null,
    incomingMessages: [],
    timeline: [
      { level: "info", text: "Secure room created.", time: nowLabel() }
    ]
  };
}

function pruneRooms() {
  const cutoff = Date.now() - ROOM_TTL_MS;
  for (const [code, room] of globalStore.entries()) {
    if ((room.updatedAt || room.createdAt || 0) < cutoff) {
      globalStore.delete(code);
    }
  }
}

function addTimeline(room, text, level = "info") {
  room.timeline.unshift({ text, level, time: nowLabel() });
  room.timeline = room.timeline.slice(0, MAX_EVENTS);
  room.updatedAt = Date.now();
}

function getRoom(code, create = false) {
  pruneRooms();
  if (!globalStore.has(code) && create) {
    globalStore.set(code, defaultRoom(code));
  }
  return globalStore.get(code);
}

function applyAction(room, body) {
  const action = cleanText(body.action, 50);
  const text = cleanText(body.text);
  const from = cleanText(body.from, 80) || "Sarah";
  const type = cleanText(body.type, 50) || "message";

  if (action === "join") {
    const memberId = cleanText(body.memberId, 120);
    if (!memberId) {
      throw new Error("A caregiver member ID is required.");
    }
    room.careCircleMembers = Array.isArray(room.careCircleMembers) ? room.careCircleMembers : [];
    const member = {
      id: memberId,
      name: cleanText(body.memberName, 80) || "Family caregiver",
      role: cleanText(body.memberRole, 120) || "Family / caregiver",
      joinedAt: nowLabel()
    };
    const existingIndex = room.careCircleMembers.findIndex(item => item.id === memberId);
    if (existingIndex >= 0) {
      room.careCircleMembers[existingIndex] = member;
    } else {
      room.careCircleMembers.push(member);
      addTimeline(room, `${member.name} joined the care circle.`, "important");
    }
    room.careCircleMembers = room.careCircleMembers.slice(-20);
  }

  if (action === "status") {
    room.currentStatus = text || room.currentStatus;
    addTimeline(room, room.currentStatus, "info");
  }

  if (action === "reply") {
    const reply = text || "I got the message";
    room.currentStatus = "Patient replied to caregiver";
    if (room.incomingMessages[0]) {
      room.incomingMessages[0].opened = true;
      room.incomingMessages[0].reply = reply;
      room.incomingMessages[0].replyAt = nowLabel();
    }
    addTimeline(room, `Patient replied: ${reply}`, "important");
  }

  if (action === "profile") {
    const profile = body.profile && typeof body.profile === "object" ? body.profile : {};
    room.profile = {
      ...(room.profile || {}),
      updatedAt: Number(profile.updatedAt || Date.now()) || Date.now(),
      patientName: cleanText(profile.patientName, 80) || room.profile?.patientName || "Robert",
      preferredLanguage: cleanText(profile.preferredLanguage, 80),
      dateOfBirth: cleanText(profile.dateOfBirth, 40),
      recoveryStart: cleanText(profile.recoveryStart, 40),
      recoveryType: cleanText(profile.recoveryType, 120),
      accessibility: cleanText(profile.accessibility, 500),
      caregiverName: cleanText(profile.caregiverName, 80) || "Sarah Johnson",
      caregiverRole: cleanText(profile.caregiverRole, 120),
      caregiverPhone: cleanText(profile.caregiverPhone, 80),
      caregiverEmail: cleanText(profile.caregiverEmail, 120),
      availability: cleanText(profile.availability, 160),
      familyContacts: cleanText(profile.familyContacts, 1000),
      emergencyOrder: cleanText(profile.emergencyOrder, 500),
      morningPreference: cleanText(profile.morningPreference, 600),
      comfortInterests: cleanText(profile.comfortInterests, 600),
      helpInstructions: cleanText(profile.helpInstructions, 800),
      medicationName: cleanText(profile.medicationName, 160),
      medicationTimes: cleanText(profile.medicationTimes, 160),
      medicationInstructions: cleanText(profile.medicationInstructions, 600),
      bathingSchedule: cleanText(profile.bathingSchedule, 300),
      bathingAssistance: cleanText(profile.bathingAssistance, 600),
      dailyQuestion: cleanText(profile.dailyQuestion, 300),
      dailyQuestionOption1: cleanText(profile.dailyQuestionOption1, 100),
      dailyQuestionOption2: cleanText(profile.dailyQuestionOption2, 100),
      schedule: Array.isArray(profile.schedule)
        ? profile.schedule.slice(0, 8).map(item => ({
            time: cleanText(item.time, 40),
            title: cleanText(item.title, 160),
            owner: cleanText(item.owner, 80),
            acknowledge: Boolean(item.acknowledge)
          })).filter(item => item.time || item.title)
        : room.profile?.schedule || []
    };
    addTimeline(room, `${from} updated patient setup information.`, "important");
  }

  if (action === "message") {
    if (!text) {
      throw new Error("Message text is required.");
    }
    room.currentStatus = "New family content received";
    room.incomingMessages.unshift({
      type,
      from,
      text: text || "Caregiver sent a message.",
      time: nowLabel(),
      opened: false
    });
    room.incomingMessages = room.incomingMessages.slice(0, 20);
    addTimeline(room, `${from} sent ${type === "suggestion" ? "a suggestion" : "a message"} to the patient.`, "info");
  }

  if (action === "help") {
    const reason = text || "Help requested";
    room.helpRequest = {
      reason,
      createdAt: nowLabel(),
      status: "Caregiver notified",
      responder: null,
      estimate: null
    };
    room.currentStatus = "Help requested";
    addTimeline(room, `Help requested: ${reason}. Caregiver was notified.`, "urgent");
  }

  if (action === "responding" && room.helpRequest) {
    room.helpRequest.status = "Acknowledged";
    room.helpRequest.responder = from;
    room.helpRequest.estimate = body.estimate || "about 10 minutes";
    room.incomingMessages.unshift({
      type: "response",
      from,
      text: `${from} received your request and is responding ${room.helpRequest.estimate}.`,
      time: nowLabel(),
      opened: false
    });
    room.incomingMessages = room.incomingMessages.slice(0, 20);
    addTimeline(room, `${from} accepted responsibility and is responding.`, "urgent");
  }

  if (action === "resolved" && room.helpRequest) {
    addTimeline(room, `Help request resolved: ${room.helpRequest.reason}.`, "urgent");
    room.helpRequest = null;
    room.currentStatus = "Awake - Home screen";
  }

  if (action === "call") {
    addTimeline(room, `${from} requested a phone call.`, "important");
    room.incomingMessages.unshift({
      type: "call",
      from,
      text: "Please call me when you are ready.",
      time: nowLabel(),
      opened: false
    });
  }

  if (action === "video") {
    addTimeline(room, `${from} requested a video call.`, "important");
    room.incomingMessages.unshift({
      type: "video",
      from,
      text: body.url ? cleanText(body.url, 500) : "Video call requested.",
      time: nowLabel(),
      opened: false
    });
  }

  if (action === "opened" && room.incomingMessages[0]) {
    room.incomingMessages[0].opened = true;
    addTimeline(room, "Patient opened the latest caregiver item.", "info");
  }

  if (action === "clear") {
    const fresh = defaultRoom(room.code);
    Object.keys(room).forEach(key => delete room[key]);
    Object.assign(room, fresh);
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const code = cleanCode(req.method === "GET" ? req.query?.code : req.body?.code);
  if (code.length !== 6) {
    res.status(400).json({ error: "A valid six-digit pairing code is required." });
    return;
  }

  if (req.method === "GET") {
    const room = getRoom(code);
    if (!room) {
      res.status(404).json({ error: "Pairing code not found. Ask the caregiver to generate a new code." });
      return;
    }
    res.status(200).json({ room });
    return;
  }

  if (req.method === "POST") {
    try {
      const action = cleanText(req.body?.action, 50);
      const room = getRoom(code, action === "create");
      if (!room) {
        res.status(404).json({ error: "Pairing code not found. Ask the caregiver to generate a new code." });
        return;
      }
      applyAction(room, req.body || {});
      room.updatedAt = Date.now();
      res.status(200).json({ room });
    } catch (error) {
      res.status(500).json({ error: error.message || "Unable to update room." });
    }
    return;
  }

  res.status(405).json({ error: "Method not allowed." });
};
