(function() {
  const storageKey = 'comcareRecoveryHubDemoState';
  const appearanceStorageKey = 'comcareRecoveryHubAppearance';
  const syncDurationMs = 10 * 60 * 1000;
  const defaultState = {
    currentStatus: 'Awake - Home screen',
    caregiverConnected: false,
    careCircleMembers: [],
    syncCode: '482716',
    syncExpiresAt: 0,
    profile: {
      updatedAt: 0,
      patientName: 'Robert',
      preferredLanguage: 'English',
      dateOfBirth: '',
      recoveryStart: '',
      recoveryStatus: 'At Home',
      recoveryDay: 'Day 12',
      recoveryType: 'Home recovery',
      accessibility: 'Large text, simple screen, high contrast',
      caregiverName: 'Sarah Johnson',
      caregiverRole: 'Daughter and primary caregiver',
      caregiverPhone: '',
      caregiverEmail: '',
      availability: 'Sarah is available',
      familyContacts: 'Sarah Johnson - daughter - primary caregiver\nMichael Johnson - son - backup contact',
      emergencyOrder: 'Sarah, then Michael',
      physicianInfo: 'Dr. Lee - orthopedic follow-up\nPT: Atlanta Home Therapy',
      medicationPreference: 'Large reminder prompt with Yes, Done, and Remind Me Later choices.',
      dailyRoutinePreference: 'Morning greeting, medication reminder, lunch and hydration, therapy visit, evening family call.',
      morningPreference: 'Relaxing piano and a short good-morning message',
      comfortInterests: 'Family photos, relaxing music, inspirational programs',
      helpInstructions: 'Notify Sarah first. Keep 911 visible for emergencies.',
      medicationName: 'Morning medication',
      medicationTimes: '10:00 AM',
      medicationInstructions: 'Take with water. Confirm after taking.',
      bathingSchedule: 'Tuesday, Thursday, and Saturday at 10:30 AM',
      bathingAssistance: 'Use shower chair. Caregiver remains nearby.',
      dailyQuestion: 'Would you prefer your family call at lunch or dinner?',
      dailyQuestionOption1: 'Lunch',
      dailyQuestionOption2: 'Dinner',
      schedule: [
        { time: '10:00 AM', title: 'Morning medication reminder', owner: 'Sarah', acknowledge: true },
        { time: '12:30 PM', title: 'Lunch and hydration', owner: 'Sarah', acknowledge: true },
        { time: '2:30 PM', title: 'Physical therapy visit', owner: 'Sarah', acknowledge: false }
      ]
    },
    helpRequest: null,
    incomingMessages: [
      {
        type: 'podcast',
        from: 'Sarah',
        text: 'Dad, I thought you might enjoy this.',
        time: 'Demo',
        opened: false
      }
    ],
    timeline: [
      { level: 'info', text: 'Recovery Hub opened to Robert’s home screen.' },
      { level: 'info', text: 'Caregiver dashboard connected.' }
    ]
  };

  let state = loadState();
  let lastIncomingCount = state.incomingMessages?.length || 0;
  let lastIncomingSignature = state.incomingMessages?.[0]
    ? `${state.incomingMessages[0].time}|${state.incomingMessages[0].from}|${state.incomingMessages[0].text}`
    : '';
  let audioReady = false;
  let audioContext = null;
  let caregiverAlertBeepTimer = null;
  let syncCountdownTimer = null;
  let profileEditing = false;
  let selectedPatientKey = 'robert';
  const monitoredPatients = {
    maria: { name: 'Maria Gomez', initials: 'MG', status: 'At Home', details: 'Hydration support · Next check 11:30 AM', online: true },
    alan: { name: 'Alan Walker', initials: 'AW', status: 'Needs Review', details: 'Apartment recovery · PT visit 1:00 PM', online: false }
  };
  const channel = 'BroadcastChannel' in window ? new BroadcastChannel('comcare-recovery-hub-demo') : null;
  const params = new URLSearchParams(window.location.search);
  const demoMode = params.get('demo') === '1';
  const tourMode = params.get('tour') === '1';
  const cleanPairMode = window.location.pathname.includes('/pair');
  const initialRole = params.get('role') || (cleanPairMode ? 'setup' : window.location.pathname.includes('caregiver') ? 'caregiver' : 'patient');
  const roomStorageKey = 'comcareRecoveryHubPairCode';
  const profileCachePrefix = 'comcareRecoveryHubProfile:';
  const urlCode = cleanCode(params.get('code') || '');
  const isCareCircleRole = initialRole === 'caregiver' || initialRole === 'family';
  const savedCode = initialRole === 'caregiver' ? cleanCode(localStorage.getItem(roomStorageKey) || '') : '';
  // The caregiver owns room creation. Patient stations always start blank and
  // join only after the patient enters the caregiver's six-digit code.
  let roomCode = initialRole === 'patient' ? '' : (urlCode || savedCode);
  let pollTimer = null;
  let connectionFailures = 0;
  let roomVerified = false;
  const careCircleMemberIdKey = 'comcareCareCircleMemberId';
  let careCircleMemberId = localStorage.getItem(careCircleMemberIdKey) || '';
  if (!careCircleMemberId) {
    careCircleMemberId = `member-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem(careCircleMemberIdKey, careCircleMemberId);
  }
  let registeredRoomCode = '';

  if (roomCode) {
    state.syncCode = roomCode;
    state.syncExpiresAt = Date.now() + syncDurationMs;
  }

  function cleanCode(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 6);
  }

  function generateCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  function formatSyncCode(code) {
    const clean = cleanCode(code || state.syncCode || '482716').padEnd(6, '0');
    return `${clean.slice(0, 3)} ${clean.slice(3, 6)}`;
  }

  function ensureSyncCode() {
    if (!cleanCode(state.syncCode)) {
      state.syncCode = '482716';
    }
    if (!Number.isFinite(state.syncExpiresAt) || state.syncExpiresAt <= Date.now()) {
      state.syncExpiresAt = Date.now() + syncDurationMs;
    }
  }

  function syncTimeText() {
    ensureSyncCode();
    const remaining = Math.max(0, state.syncExpiresAt - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `Expires in ${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  function renderSyncUi() {
    const code = document.getElementById('syncCodeDisplay');
    const countdown = document.getElementById('syncCountdown');
    const status = document.getElementById('syncStatus');
    const dashboardStatus = document.getElementById('dashboardCaregiverStatus');
    const monitorStatus = document.getElementById('monitorRobertStatus');
    if (code) code.textContent = hasRoom() ? formatSyncCode(roomCode) : '------';
    if (countdown) {
      countdown.textContent = hasRoom() ? syncTimeText() : 'Generate a code when the patient is ready';
    }
    const memberCount = Array.isArray(state.careCircleMembers) ? state.careCircleMembers.length : (state.caregiverConnected ? 1 : 0);
    state.caregiverConnected = memberCount > 0;
    if (status && state.caregiverConnected) status.textContent = `${memberCount} care-circle member${memberCount === 1 ? '' : 's'} connected`;
    if (dashboardStatus) dashboardStatus.textContent = `${memberCount} Care Circle Member${memberCount === 1 ? '' : 's'} Connected`;
    if (monitorStatus) monitorStatus.textContent = state.helpRequest ? 'Help requested' : state.caregiverConnected ? 'Connected' : 'Online';
  }

  async function generateNewSyncCode() {
    roomCode = generateCode();
    state.syncCode = roomCode;
    state.syncExpiresAt = Date.now() + syncDurationMs;
    state.caregiverConnected = false;
    localStorage.setItem(roomStorageKey, roomCode);
    updateUrlCode();
    const status = document.getElementById('syncStatus');
    if (status) status.textContent = 'New patient sync code generated.';
    addTimeline(`New caregiver sync code generated: ${formatSyncCode(state.syncCode)}.`, 'info');
    saveState();
    renderState();
    updatePairingUi('Share this code with the patient.');
    try {
      await postRoom('create', { from: profile().caregiverName || 'Primary caregiver', profile: state.profile });
      updatePairingUi('Code ready. Share it with the patient or approved family members.');
      startPolling();
    } catch (error) {
      roomCode = '';
      localStorage.removeItem(roomStorageKey);
      updatePairingUi(error.message || 'Unable to create a pairing code. Please try again.');
      renderState();
    }
  }

  function connectDemoCaregiver() {
    const status = document.getElementById('syncStatus');
    if (status) status.textContent = 'Connecting caregiver...';
    window.setTimeout(() => {
      state.caregiverConnected = true;
      state.currentStatus = '1 Caregiver Connected';
      addTimeline('Caregiver connected through sync-code screen.', 'important');
      saveState();
      renderState();
    }, 2000);
  }

  function unlockAudio() {
    if (audioReady) {
      return;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      return;
    }
    audioContext = audioContext || new AudioCtor();
    if (audioContext.state === 'suspended') {
      audioContext.resume().catch(() => {});
    }
    audioReady = true;
  }

  function playBeep() {
    unlockAudio();
    if (!audioContext || audioContext.state === 'suspended') {
      return;
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.16, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.22);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.24);
  }

  function shouldCaregiverAlertBeep() {
    return initialRole === 'caregiver'
      && document.querySelector('.caregiver-interface.active')
      && state.helpRequest
      && state.helpRequest.status !== 'Acknowledged';
  }

  function stopCaregiverAlertBeep() {
    if (caregiverAlertBeepTimer) {
      clearInterval(caregiverAlertBeepTimer);
      caregiverAlertBeepTimer = null;
    }
  }

  function updateCaregiverAlertBeep() {
    const alertCard = document.getElementById('caregiverAlertCard');
    const shouldBeep = shouldCaregiverAlertBeep();
    if (alertCard) {
      alertCard.classList.toggle('needs-ack', Boolean(shouldBeep));
    }
    if (!shouldBeep) {
      stopCaregiverAlertBeep();
      return;
    }
    if (!audioReady || caregiverAlertBeepTimer) {
      return;
    }
    playBeep();
    caregiverAlertBeepTimer = setInterval(playBeep, 1600);
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (saved && Array.isArray(saved.timeline)) {
        if (!Array.isArray(saved.incomingMessages)) {
          saved.incomingMessages = [];
        }
        saved.caregiverConnected = Boolean(saved.caregiverConnected);
        saved.syncCode = cleanCode(saved.syncCode || defaultState.syncCode);
        saved.syncExpiresAt = Number(saved.syncExpiresAt || 0);
        saved.profile = { ...defaultState.profile, ...(saved.profile || {}) };
        return saved;
      }
    } catch (error) {
      // Use a fresh demo state when browser storage is unavailable or corrupted.
    }
    return structuredClone(defaultState);
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (channel) {
      channel.postMessage({ type: 'state-updated', state });
    }
  }

  function profileCacheKey() {
    return `${profileCachePrefix}${hasRoom() ? roomCode : 'local'}`;
  }

  function loadCachedProfile() {
    try {
      return JSON.parse(localStorage.getItem(profileCacheKey()) || 'null');
    } catch (error) {
      return null;
    }
  }

  function saveCachedProfile(nextProfile) {
    if (!nextProfile) {
      return;
    }
    localStorage.setItem(profileCacheKey(), JSON.stringify(nextProfile));
  }

  function nowLabel() {
    return new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  function hasRoom() {
    return roomCode && roomCode.length === 6;
  }

  function roomUrl() {
    return `/recovery-hub-room?code=${encodeURIComponent(roomCode)}`;
  }

  function updateUrlCode() {
    if (!hasRoom()) {
      return;
    }
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.set('code', roomCode);
    nextParams.set('role', initialRole);
    const nextUrl = `${window.location.pathname}?${nextParams.toString()}`;
    window.history.replaceState({}, '', nextUrl);
  }

  function trackDemoOpen() {
    fetch('/demo-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'demo-open',
        role: initialRole,
        pairCode: roomCode || state.syncCode
      })
    }).catch(() => {});
  }

  async function fetchRoom() {
    if (!hasRoom()) {
      return;
    }
    const response = await fetch(roomUrl(), { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to connect to paired room.');
    }
    connectionFailures = 0;
    roomVerified = true;
    receiveExternalState(data.room);
    updatePairingUi('Paired and connected.');
  }

  async function postRoom(action, payload) {
    if (!hasRoom()) {
      saveState();
      renderState();
      updatePairingUi('Use a six-digit pairing code to connect phone and PC.');
      return;
    }
    const response = await fetch('/recovery-hub-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: roomCode, action, ...(payload || {}) })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Unable to update paired room.');
    }
    connectionFailures = 0;
    roomVerified = true;
    receiveExternalState(data.room);
    updatePairingUi('Paired and connected.');
  }

  function showConnectionWarning() {
    connectionFailures += 1;
    const warning = document.getElementById('pairingWarning');
    if (warning && connectionFailures >= 2) {
      warning.hidden = false;
    }
  }

  function handlePollingFailure() {
    showConnectionWarning();
    if (roomVerified) {
      updatePairingUi(`Paired with code ${roomCode}. Syncing latest updates...`);
    } else if (connectionFailures >= 2) {
      updatePairingUi('Connection problem. Retrying.');
    }
  }

  function startPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
    }
    if (!hasRoom()) {
      updatePairingUi('Not paired yet.');
      return;
    }
    localStorage.setItem(roomStorageKey, roomCode);
    if (Number(state.profile?.updatedAt || 0) > 0) {
      saveCachedProfile(state.profile);
    }
    updateUrlCode();
    updatePairingUi('Connecting...');
    if (isCareCircleRole && registeredRoomCode !== roomCode) {
      registeredRoomCode = roomCode;
      state.careCircleMembers = Array.isArray(state.careCircleMembers) ? state.careCircleMembers : [];
      if (!state.careCircleMembers.some(member => member.id === careCircleMemberId)) {
        state.careCircleMembers.push({
          id: careCircleMemberId,
          name: initialRole === 'family' ? 'Family member' : (profile().caregiverName || 'Primary caregiver'),
          role: initialRole === 'family' ? 'Approved family member' : (profile().caregiverRole || 'Primary caregiver'),
          joinedAt: nowLabel()
        });
        saveState();
        renderState();
      }
      postRoom('join', {
        memberId: careCircleMemberId,
        memberName: initialRole === 'family' ? 'Family member' : (profile().caregiverName || 'Primary caregiver'),
        memberRole: initialRole === 'family' ? 'Approved family member' : (profile().caregiverRole || 'Primary caregiver')
      }).catch(() => {
        registeredRoomCode = '';
      });
    }
    fetchRoom().catch(() => {
      handlePollingFailure();
    });
    pollTimer = setInterval(() => {
      fetchRoom().catch(() => {
        handlePollingFailure();
      });
    }, 2000);
  }

  function addTimeline(text, level) {
    state.timeline.unshift({
      text,
      level: level || 'info',
      time: nowLabel()
    });
    state.timeline = state.timeline.slice(0, 30);
    saveState();
    renderState();
  }

  function setMode(mode) {
    if (mode !== 'patient') {
      closeSpotifyRelax();
    }
    document.querySelector('.hub-shell').dataset.interface = mode;
    document.querySelectorAll('.mode-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.mode === mode);
    });
    document.querySelectorAll('.interface-panel').forEach(panel => {
      const targetId = mode === 'patient' ? 'patientInterface' : mode === 'caregiver' ? 'caregiverInterface' : 'setupInterface';
      panel.classList.toggle('active', panel.id === targetId);
    });
  }

  function updatePairingUi(message) {
    const codeEl = document.getElementById('pairingCode');
    const railCodeEl = document.getElementById('railPairingCode');
    const joinInput = document.getElementById('joinPairCode');
    const status = document.getElementById('pairingStatus');
    const patientStatus = document.getElementById('patientSyncStatus');
    if (codeEl) {
      codeEl.textContent = hasRoom() ? roomCode : '------';
    }
    if (railCodeEl) {
      railCodeEl.textContent = hasRoom() ? roomCode : '------';
    }
    if (joinInput && initialRole === 'caregiver' && hasRoom() && joinInput !== document.activeElement) {
      joinInput.value = roomCode;
    }
    if (status) {
      status.textContent = message || (hasRoom() ? `Paired with code ${roomCode}.` : 'Not paired yet.');
    }
    if (patientStatus && initialRole === 'patient' && message) {
      patientStatus.textContent = message;
    }
  }

  function profile() {
    const cached = loadCachedProfile();
    const current = { ...defaultState.profile, ...(state.profile || {}) };
    const cachedTime = Number(cached?.updatedAt || 0);
    const currentTime = Number(current.updatedAt || 0);
    state.profile = cachedTime > currentTime ? { ...defaultState.profile, ...cached } : current;
    if (!Array.isArray(state.profile.schedule)) {
      state.profile.schedule = defaultState.profile.schedule;
    }
    return state.profile;
  }

  function initials(name) {
    return String(name || 'CC')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0].toUpperCase())
      .join('') || 'CC';
  }

  function appearancePreference() {
    return localStorage.getItem(appearanceStorageKey) || 'device';
  }

  function resolvedAppearance(choice) {
    if (choice === 'light' || choice === 'dark') return choice;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyAppearance(choice) {
    const preference = choice || appearancePreference();
    document.documentElement.dataset.theme = resolvedAppearance(preference);
    document.documentElement.dataset.appearancePreference = preference;
    document.querySelectorAll('input[name="appearance"]').forEach(input => {
      input.checked = input.value === preference;
    });
  }

  function setAppearance(choice) {
    localStorage.setItem(appearanceStorageKey, choice);
    applyAppearance(choice);
    addTimeline(`Appearance changed to ${choice === 'device' ? 'Use Device Setting' : choice}.`, 'info');
  }

  function profileFields() {
    return {
      patientName: document.getElementById('profilePreferredName'),
      recoveryStatus: document.getElementById('profileRecoveryStatus'),
      recoveryDay: document.getElementById('profileRecoveryDay'),
      dateOfBirth: document.getElementById('profileDob'),
      preferredLanguage: document.getElementById('profileLanguage'),
      accessibility: document.getElementById('profileAccessibility'),
      familyContacts: document.getElementById('profileCaregiverContacts'),
      emergencyOrder: document.getElementById('profileEmergencyContact'),
      physicianInfo: document.getElementById('profilePhysician'),
      medicationPreference: document.getElementById('profileMedicationPreference'),
      dailyRoutinePreference: document.getElementById('profileDailyRoutine'),
      comfortInterests: document.getElementById('profileComfort')
    };
  }

  function fillProfileForm() {
    const data = profile();
    const fields = profileFields();
    Object.entries(fields).forEach(([key, field]) => {
      if (field && field !== document.activeElement) {
        field.value = data[key] || '';
        field.disabled = !profileEditing;
      }
    });
    const preview = document.getElementById('profileNamePreview');
    const status = document.getElementById('profileStatusPreview');
    const photo = document.getElementById('profileInitials');
    if (preview) preview.textContent = `${data.patientName || 'Robert'} Johnson`;
    if (status) status.textContent = `${data.recoveryStatus || 'At Home'} · ${data.recoveryDay || 'Recovery day'}`;
    if (photo) photo.textContent = initials(data.patientName || 'Robert');
    const editButton = document.getElementById('editProfile');
    const saveButton = document.getElementById('saveProfile');
    const cancelButton = document.getElementById('cancelProfile');
    if (editButton) editButton.disabled = profileEditing;
    if (saveButton) saveButton.disabled = !profileEditing;
    if (cancelButton) cancelButton.disabled = !profileEditing;
  }

  function setProfileEditing(isEditing) {
    profileEditing = Boolean(isEditing);
    fillProfileForm();
  }

  function saveProfileForm() {
    const fields = profileFields();
    const nextProfile = { ...profile(), updatedAt: Date.now() };
    Object.entries(fields).forEach(([key, field]) => {
      if (field) nextProfile[key] = field.value.trim();
    });
    state.profile = nextProfile;
    saveCachedProfile(state.profile);
    setProfileEditing(false);
    addTimeline('Patient profile updated locally.', 'important');
    postRoom('profile', { from: 'Profile', profile: state.profile }).catch(() => updatePairingUi('Profile saved locally. Pairing connection problem.'));
    saveState();
    renderState();
  }

  function resetDemoState() {
    state = structuredClone(defaultState);
    state.syncExpiresAt = Date.now() + syncDurationMs;
    profileEditing = false;
    lastIncomingCount = state.incomingMessages.length;
    lastIncomingSignature = state.incomingMessages[0]
      ? `${state.incomingMessages[0].time}|${state.incomingMessages[0].from}|${state.incomingMessages[0].text}`
      : '';
    localStorage.removeItem(profileCacheKey());
    localStorage.removeItem(roomStorageKey);
    roomCode = '';
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    saveState();
    renderState();
    showPatientScreen('home');
    updatePairingUi('Pair reset. Caregiver connection reset.');
  }

  function selectMonitorPatient(key) {
    selectedPatientKey = key;
    document.querySelectorAll('[data-monitor-patient]').forEach(card => {
      card.classList.toggle('active', card.dataset.monitorPatient === key);
    });
    renderCaregiverWorkspace();
    const patient = activeMonitoredPatient();
    addTimeline(`Caregiver opened ${patient.name}'s workspace.`, key === 'alan' ? 'important' : 'info');
    document.getElementById('activePatientWorkspace')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function activeMonitoredPatient() {
    if (selectedPatientKey === 'robert') {
      const data = profile();
      return { name: data.patientName || 'Patient', initials: initials(data.patientName || 'Patient'), status: data.recoveryStatus || data.recoveryType || 'At Home', details: `${data.recoveryType || 'Home recovery'} · ${state.currentStatus || 'No recent update'}`, online: hasRoom() };
    }
    return monitoredPatients[selectedPatientKey] || monitoredPatients.maria;
  }

  function renderCaregiverWorkspace() {
    const patient = activeMonitoredPatient();
    const name = document.getElementById('activePatientName');
    const status = document.getElementById('activePatientStatus');
    const details = document.getElementById('activePatientDetails');
    const avatar = document.querySelector('#activePatientWorkspace .caregiver-avatar');
    const messageTitle = document.getElementById('messagePanelTitle');
    if (name) name.textContent = patient.name;
    if (status) status.textContent = patient.online ? `${patient.status} · Connected` : `${patient.status} · Offline demo`;
    if (details) details.textContent = patient.details;
    if (avatar) avatar.textContent = patient.initials;
    if (messageTitle) messageTitle.textContent = `Message ${patient.name.split(' ')[0]}`;

    const connected = selectedPatientKey === 'robert' && hasRoom();
    const banner = document.getElementById('careConnectionBanner');
    banner?.classList.toggle('connected', connected);
    const bannerTitle = document.getElementById('connectionBannerTitle');
    const bannerDetail = document.getElementById('connectionBannerDetail');
    const bannerBadge = document.getElementById('connectionBannerBadge');
    if (bannerTitle) bannerTitle.textContent = connected ? `${patient.name} is connected to this Care Circle` : `${patient.name} is not connected to this shared room`;
    if (bannerDetail) bannerDetail.textContent = connected ? `Code ${roomCode} · Updates sync automatically across caregiver, patient, and family screens.` : 'Open the paired patient or create a code to begin sharing live updates.';
    if (bannerBadge) bannerBadge.textContent = connected ? 'LIVE' : 'NOT CONNECTED';
    renderConversation();
  }

  function renderConversation() {
    const list = document.getElementById('sharedConversationMessages');
    const connection = document.getElementById('conversationConnectionState');
    if (!list) return;
    const connected = selectedPatientKey === 'robert' && hasRoom();
    connection?.classList.toggle('connected', connected);
    if (connection) connection.textContent = connected ? 'Live sync on' : 'Local preview';
    const patient = activeMonitoredPatient();
    const messages = (state.incomingMessages || []).slice(0, 5);
    if (!messages.length) {
      list.innerHTML = `<div class="conversation-empty">No messages yet. Send a note to ${patient.name.split(' ')[0]} to start the conversation.</div>`;
      return;
    }
    list.innerHTML = messages.map(message => `
      <article class="conversation-item caregiver"><strong>${message.from || 'Caregiver'}</strong><span>${message.text || 'Update sent'}</span><small>${message.time || 'Now'} · ${message.opened ? 'Opened' : 'Delivered'}</small></article>
      ${message.reply ? `<article class="conversation-item patient"><strong>${patient.name}</strong><span>${message.reply}</span><small>${message.replyAt || 'Now'} · Shared reply</small></article>` : ''}
    `).join('');
  }

  function startGuidedRoleDemo() {
    const roleName = initialRole === 'caregiver' ? 'Caregiver' : 'Patient';
    const slides = initialRole === 'caregiver' ? [
      { icon: '1', label: 'CAREGIVER OVERVIEW', title: 'Your connected patient workspace', text: 'Open a patient card to see current status, today’s plan, alerts, and the latest Care Circle activity.', target: '#activePatientWorkspace' },
      { icon: '2', label: 'SEND', title: 'Send a simple update', text: 'Choose the patient, write a message, or use a quick action. The update appears on the patient screen and in the shared conversation.', target: '#caregiverMessage' },
      { icon: '3', label: 'RECEIVE', title: 'See patient replies and requests', text: 'Patient replies, I’m Okay updates, and help requests return to this dashboard with a clear time and response state.', target: '#sharedConversationMessages' },
      { icon: '4', label: 'SHARED CARE CIRCLE', title: 'Everyone follows the same story', text: 'Approved family and caregivers use the same code and see the shared plan, messages, replies, and activity.', target: '#careConnectionBanner' }
    ] : [
      { icon: '1', label: 'PATIENT OVERVIEW', title: 'A calm home screen with clear choices', text: 'The patient starts with large buttons for today’s plan, family contact, comfort content, profile, and help.', target: '.patient-home-screen' },
      { icon: '2', label: 'SEND', title: 'Send an update with one tap', text: 'The patient can say I’m Okay, request a call, answer the daily question, or ask for help without typing.', target: '[data-patient-ok]' },
      { icon: '3', label: 'RECEIVE', title: 'Caregiver messages are easy to notice', text: 'Incoming messages open in a clear alert with the caregiver name, message, time, and large reply choices.', target: '#patientIncomingCard' },
      { icon: '4', label: 'REPLY', title: 'The Care Circle sees the response', text: 'A one-tap reply is shared back to the caregiver and family conversation, so both sides know it was received.', target: '#patientAlertModal' }
    ];
    let index = 0;
    const modal = document.createElement('section');
    modal.className = 'demo-tour';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', `${roleName} guided demo`);
    modal.innerHTML = `<div class="demo-tour-card"><div class="demo-tour-progress"></div><div class="demo-tour-body"><span class="demo-tour-icon"></span><div class="demo-tour-label"></div><h2></h2><p></p></div><div class="demo-tour-actions"><button type="button" class="demo-tour-skip">Explore demo</button><button type="button" class="demo-tour-next">Next</button></div></div>`;
    document.body.appendChild(modal);
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.className = 'demo-tour-launch';
    launch.textContent = `Replay ${roleName} Tour`;
    document.body.appendChild(launch);
    const showTarget = slide => {
      document.querySelectorAll('.demo-highlight').forEach(el => el.classList.remove('demo-highlight'));
      if (initialRole === 'patient' && index === 2) showPatientScreen('relax');
      if (initialRole === 'patient' && index === 0) showPatientScreen('home');
      const target = document.querySelector(slide.target);
      target?.classList.add('demo-highlight');
    };
    const render = () => {
      const slide = slides[index];
      modal.querySelector('.demo-tour-progress').innerHTML = slides.map((_, i) => `<i class="${i <= index ? 'active' : ''}"></i>`).join('');
      modal.querySelector('.demo-tour-icon').textContent = slide.icon;
      modal.querySelector('.demo-tour-label').textContent = slide.label;
      modal.querySelector('h2').textContent = slide.title;
      modal.querySelector('.demo-tour-body p').textContent = slide.text;
      modal.querySelector('.demo-tour-next').textContent = index === slides.length - 1 ? 'Start Exploring' : 'Next';
      showTarget(slide);
    };
    const close = () => { modal.hidden = true; document.querySelectorAll('.demo-highlight').forEach(el => el.classList.remove('demo-highlight')); };
    modal.querySelector('.demo-tour-skip').addEventListener('click', close);
    modal.querySelector('.demo-tour-next').addEventListener('click', () => { if (index === slides.length - 1) close(); else { index += 1; render(); } });
    launch.addEventListener('click', () => { index = 0; modal.hidden = false; render(); });
    render();
  }

  function collectSetupProfile() {
    const schedule = [];
    for (let i = 0; i < 8; i += 1) {
      const time = document.querySelector(`[data-schedule-time="${i}"]`)?.value.trim() || '';
      const title = document.querySelector(`[data-schedule-title="${i}"]`)?.value.trim() || '';
      const owner = document.querySelector(`[data-schedule-owner="${i}"]`)?.value.trim() || '';
      const acknowledge = Boolean(document.querySelector(`[data-schedule-ack="${i}"]`)?.checked);
      if (time || title || owner) {
        schedule.push({ time, title, owner, acknowledge });
      }
    }

    return {
      ...profile(),
      updatedAt: Date.now(),
      patientName: document.getElementById('setupPatientName').value.trim() || 'Robert',
      preferredLanguage: document.getElementById('setupLanguage').value.trim(),
      dateOfBirth: document.getElementById('setupDob').value.trim(),
      recoveryStart: document.getElementById('setupStartDate').value.trim(),
      recoveryType: document.getElementById('setupRecoveryType').value.trim(),
      accessibility: document.getElementById('setupAccessibility').value.trim(),
      caregiverName: document.getElementById('setupCaregiverName').value.trim() || 'Sarah Johnson',
      caregiverRole: document.getElementById('setupCaregiverRole').value.trim(),
      caregiverPhone: document.getElementById('setupCaregiverPhone').value.trim(),
      caregiverEmail: document.getElementById('setupCaregiverEmail').value.trim(),
      availability: document.getElementById('setupAvailability').value.trim(),
      familyContacts: document.getElementById('setupFamilyContacts').value.trim(),
      emergencyOrder: document.getElementById('setupEmergencyOrder').value.trim(),
      morningPreference: document.getElementById('setupMorningPreference').value.trim(),
      comfortInterests: document.getElementById('setupComfortInterests').value.trim(),
      helpInstructions: document.getElementById('setupHelpInstructions').value.trim(),
      medicationName: document.getElementById('setupMedicationName').value.trim(),
      medicationTimes: document.getElementById('setupMedicationTimes').value.trim(),
      medicationInstructions: document.getElementById('setupMedicationInstructions').value.trim(),
      bathingSchedule: document.getElementById('setupBathingSchedule').value.trim(),
      bathingAssistance: document.getElementById('setupBathingAssistance').value.trim(),
      dailyQuestion: document.getElementById('setupDailyQuestion').value.trim(),
      dailyQuestionOption1: document.getElementById('setupDailyOption1').value.trim(),
      dailyQuestionOption2: document.getElementById('setupDailyOption2').value.trim(),
      schedule: schedule.length ? schedule : defaultState.profile.schedule
    };
  }

  function fillSetupForm(profileOverride) {
    const data = profileOverride || profile();
    const fields = {
      setupPatientName: data.patientName,
      setupLanguage: data.preferredLanguage,
      setupDob: data.dateOfBirth,
      setupStartDate: data.recoveryStart,
      setupRecoveryType: data.recoveryType,
      setupAccessibility: data.accessibility,
      setupCaregiverName: data.caregiverName,
      setupCaregiverRole: data.caregiverRole,
      setupCaregiverPhone: data.caregiverPhone,
      setupCaregiverEmail: data.caregiverEmail,
      setupAvailability: data.availability,
      setupFamilyContacts: data.familyContacts,
      setupEmergencyOrder: data.emergencyOrder,
      setupMorningPreference: data.morningPreference,
      setupComfortInterests: data.comfortInterests,
      setupHelpInstructions: data.helpInstructions,
      setupMedicationName: data.medicationName,
      setupMedicationTimes: data.medicationTimes,
      setupMedicationInstructions: data.medicationInstructions,
      setupBathingSchedule: data.bathingSchedule,
      setupBathingAssistance: data.bathingAssistance,
      setupDailyQuestion: data.dailyQuestion,
      setupDailyOption1: data.dailyQuestionOption1,
      setupDailyOption2: data.dailyQuestionOption2
    };
    Object.entries(fields).forEach(([id, value]) => {
      const field = document.getElementById(id);
      if (field && field !== document.activeElement) {
        field.value = value || '';
      }
    });
    (data.schedule || []).slice(0, 8).forEach((item, index) => {
      const time = document.querySelector(`[data-schedule-time="${index}"]`);
      const title = document.querySelector(`[data-schedule-title="${index}"]`);
      const owner = document.querySelector(`[data-schedule-owner="${index}"]`);
      const ack = document.querySelector(`[data-schedule-ack="${index}"]`);
      if (time && time !== document.activeElement) time.value = item.time || '';
      if (title && title !== document.activeElement) title.value = item.title || '';
      if (owner && owner !== document.activeElement) owner.value = item.owner || '';
      if (ack && ack !== document.activeElement) ack.checked = Boolean(item.acknowledge);
    });
  }

  async function loadDemoSetup() {
    const status = document.getElementById('setupSaveStatus');
    const demoProfile = {
      ...defaultState.profile,
      updatedAt: Date.now(),
      patientName: 'Alex Morgan',
      preferredLanguage: 'English',
      dateOfBirth: '06/15/1952',
      recoveryStart: '08/12/2026',
      recoveryStatus: 'Recovering at Home',
      recoveryDay: 'Day 8',
      recoveryType: 'Post-surgery home recovery',
      accessibility: 'Large text, high contrast, simple one-tap choices, and spoken reminders.',
      caregiverName: 'Jamie Morgan',
      caregiverRole: 'Adult child and primary caregiver',
      caregiverPhone: '(555) 010-2026',
      caregiverEmail: 'jamie.demo@example.com',
      availability: 'Jamie is available from 7:00 AM to 9:00 PM.',
      familyContacts: 'Taylor Morgan - spouse - calls and messages\nJordan Morgan - sibling - photos and check-ins',
      emergencyOrder: 'Call Jamie first, then Taylor, then emergency services when appropriate.',
      physicianInfo: 'Dr. Casey Lee - primary physician\nNorthside Home Therapy - physical therapy',
      medicationPreference: 'Show a large reminder with Taken and Remind Me Later buttons.',
      dailyRoutinePreference: 'Morning check-in, medication, lunch, therapy exercise, rest, and evening family call.',
      morningPreference: 'Soft instrumental music and a brief family greeting.',
      comfortInterests: 'Family photos, gardening, classic movies, jazz, and nature programs.',
      helpInstructions: 'Notify Jamie first and Taylor second. Keep the emergency call option visible.',
      medicationName: 'Demo morning medication',
      medicationTimes: '8:00 AM and 8:00 PM',
      medicationInstructions: 'Take with food and water. Confirm after taking.',
      bathingSchedule: 'Tuesday, Thursday, and Saturday at 10:30 AM',
      bathingAssistance: 'Use the shower chair and nonslip mat; caregiver remains nearby.',
      dailyQuestion: 'Would you prefer a family call at lunch or after dinner?',
      dailyQuestionOption1: 'Lunch',
      dailyQuestionOption2: 'After dinner',
      schedule: [
        { time: '8:00 AM', title: 'Morning medication', owner: 'Jamie', acknowledge: true },
        { time: '12:30 PM', title: 'Lunch and hydration', owner: 'Jamie', acknowledge: true },
        { time: '2:30 PM', title: 'Physical therapy exercises', owner: 'Jamie', acknowledge: true },
        { time: '7:00 PM', title: 'Family video call', owner: 'Taylor', acknowledge: false }
      ]
    };
    state.profile = demoProfile;
    saveCachedProfile(demoProfile);
    addTimeline('Demo patient and caregiver information loaded.', 'important');
    saveState();
    renderState();
    if (status) status.textContent = 'Demo information loaded. Creating a shareable code...';
    await generateNewSyncCode();
    state.profile = demoProfile;
    saveCachedProfile(demoProfile);
    renderState();
    fillSetupForm(demoProfile);
    if (status && hasRoom()) {
      status.textContent = `Demo ready. Share code ${roomCode} with the patient and approved family members.`;
    }
  }

  function showPatientScreen(screenName) {
    document.querySelectorAll('.patient-screen').forEach(screen => {
      screen.classList.toggle('active', screen.dataset.screen === screenName);
    });
    document.querySelectorAll('.rail-btn').forEach(button => {
      button.classList.toggle('active', button.dataset.patientScreen === screenName);
    });

    const labels = {
      home: 'Awake - Home screen',
      start: 'Starting the day',
      plan: 'Viewing today’s care plan',
      caregiver: 'Viewing My Caregiver',
      relax: 'Relaxing or connecting',
      sync: 'Connecting caregiver',
      profile: 'Viewing patient profile',
      settings: 'Viewing settings',
      help: 'Help screen open'
    };
    state.currentStatus = labels[screenName] || 'Using Recovery Hub';
    saveState();
    renderState();
    if (hasRoom()) {
      postRoom('status', { text: state.currentStatus }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    }
  }

  function createHelpRequest(reason) {
    state.helpRequest = {
      reason,
      createdAt: nowLabel(),
      status: 'Caregiver notified',
      responder: null,
      estimate: null
    };
    state.currentStatus = 'Help requested';
    addTimeline(`Help requested: ${reason}. Sarah was notified.`, 'urgent');
    postRoom('help', { text: reason, from: 'Robert' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    showPatientScreen('help');
  }

  function cancelHelpRequest() {
    if (!state.helpRequest) {
      return;
    }
    addTimeline(`Patient canceled help request: ${state.helpRequest.reason}.`, 'important');
    state.helpRequest = null;
    state.currentStatus = 'Awake - Home screen';
    saveState();
    renderState();
    postRoom('resolved', { from: 'Robert' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
  }

  function caregiverAction(action) {
    if (!state.helpRequest && action !== 'call') {
      addTimeline('Caregiver opened quick response, but there is no active help request.', 'info');
      return;
    }

    if (action === 'responding') {
      state.helpRequest.status = 'Acknowledged';
      state.helpRequest.responder = 'Sarah';
      state.helpRequest.estimate = 'about 10 minutes';
      stopCaregiverAlertBeep();
      state.incomingMessages.unshift({
        type: 'response',
        from: 'Sarah',
        text: 'Sarah received your request and is responding about 10 minutes.',
        time: nowLabel(),
        opened: false
      });
      addTimeline('Sarah accepted responsibility and is responding.', 'urgent');
      postRoom('responding', { from: 'Sarah', estimate: 'about 10 minutes' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    }

    if (action === 'call') {
      addTimeline('Sarah started a call to Robert.', 'important');
      postRoom('call', { from: 'Sarah' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    }

    if (action === 'talk') {
      addTimeline('Sarah requested to talk through the station. Patient consent is required.', 'important');
      postRoom('video', { from: 'Sarah', text: 'Talk through station requested.' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    }

    if (action === 'resolved') {
      addTimeline(`Help request resolved: ${state.helpRequest.reason}.`, 'urgent');
      state.helpRequest = null;
      stopCaregiverAlertBeep();
      state.currentStatus = 'Awake - Home screen';
      postRoom('resolved', { from: 'Sarah' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    }

    saveState();
    renderState();
  }

  function sendContent(text) {
    const patient = activeMonitoredPatient();
    const sender = profile().caregiverName || 'Caregiver';
    const messageText = text.replace(/^Sarah sent a message:\s*/i, '');
    state.currentStatus = 'New family content received';
    state.incomingMessages.unshift({
      type: text.toLowerCase().includes('photo') ? 'photo' : text.toLowerCase().includes('podcast') ? 'podcast' : 'message',
      from: sender,
      text: messageText,
      time: nowLabel(),
      opened: false
    });
    state.incomingMessages = state.incomingMessages.slice(0, 10);
    addTimeline(text, 'info');
    if (selectedPatientKey === 'robert') postRoom('message', {
      from: sender,
      type: text.toLowerCase().includes('photo') ? 'photo' : text.toLowerCase().includes('podcast') ? 'podcast' : 'message',
      text: messageText
    }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    updatePairingUi(`Message delivered to ${patient.name}.`);
    renderCaregiverWorkspace();
    showPatientScreen('relax');
  }

  function renderState() {
    const data = profile();
    const medicationSummary = document.getElementById('patientMedicationSummary');
    const bathingSummary = document.getElementById('patientBathingSummary');
    const dailyQuestion = document.getElementById('patientDailyQuestion');
    const dailyOption1 = document.querySelector('[data-daily-answer="1"]');
    const dailyOption2 = document.querySelector('[data-daily-answer="2"]');
    if (medicationSummary) medicationSummary.textContent = [data.medicationName, data.medicationTimes, data.medicationInstructions].filter(Boolean).join(' · ') || 'No medication reminder entered.';
    if (bathingSummary) bathingSummary.textContent = [data.bathingSchedule, data.bathingAssistance].filter(Boolean).join(' · ') || 'No bathing schedule entered.';
    if (dailyQuestion) dailyQuestion.textContent = data.dailyQuestion || 'Would you prefer a call at lunch or dinner?';
    if (dailyOption1) dailyOption1.textContent = data.dailyQuestionOption1 || 'Lunch';
    if (dailyOption2) dailyOption2.textContent = data.dailyQuestionOption2 || 'Dinner';
    const patientNameEls = [
      document.querySelector('.patient-hero h1'),
      document.querySelector('.phone-header h1')
    ];
    patientNameEls.forEach((el, index) => {
      if (!el) return;
      el.textContent = index === 0 ? data.patientName : `${data.patientName}’s Recovery Hub`;
    });

    const caregiverHeading = document.querySelector('[data-screen="caregiver"] h2');
    if (caregiverHeading) caregiverHeading.textContent = data.caregiverName;
    const caregiverPhoto = document.querySelector('.caregiver-photo');
    if (caregiverPhoto) caregiverPhoto.textContent = initials(data.caregiverName);
    const caregiverRole = document.querySelector('.caregiver-card-large strong');
    if (caregiverRole) caregiverRole.textContent = data.caregiverRole || 'Primary caregiver';
    const caregiverAvailability = document.querySelector('.caregiver-card-large p');
    if (caregiverAvailability) caregiverAvailability.textContent = data.availability || 'Availability not entered yet.';

    const summary = document.querySelector('.patient-summary');
    if (summary) {
      const firstItem = data.schedule?.[0];
      const secondItem = data.schedule?.[1];
      summary.textContent = firstItem
        ? `Good morning, ${data.patientName}. Today you have ${firstItem.title}${firstItem.time ? ` at ${firstItem.time}` : ''}${secondItem ? ` and ${secondItem.title}${secondItem.time ? ` at ${secondItem.time}` : ''}` : ''}.`
        : `Good morning, ${data.patientName}. Tap Today’s Plan whenever you’re ready.`;
    }

    const referencePatientName = document.querySelector('.patient-greeting h1');
    if (referencePatientName) referencePatientName.textContent = data.patientName;
    const referenceSummary = document.querySelector('.patient-greeting .patient-summary');
    if (referenceSummary) referenceSummary.textContent = `Good morning, ${data.patientName}. We are here to support your recovery.`;
    const caregiverProfileName = document.querySelector('.caregiver-profile-card h1');
    if (caregiverProfileName) caregiverProfileName.textContent = `${data.patientName} Johnson`;
    const caregiverAvatar = document.querySelector('.caregiver-avatar');
    if (caregiverAvatar) caregiverAvatar.textContent = initials(data.patientName || 'Robert');
    renderSyncUi();
    fillProfileForm();
    applyAppearance();

    const planPreview = document.querySelector('.plan-preview');
    if (planPreview) {
      planPreview.innerHTML = (data.schedule || []).slice(0, 3).map(item => `
        <div><span>${item.time || 'Today'}</span><strong>${item.title || 'Care reminder'}</strong></div>
      `).join('');
    }

    const carePlanList = document.querySelector('.care-plan-list');
    if (carePlanList) {
      carePlanList.innerHTML = (data.schedule || []).slice(0, 6).map((item, index) => `
        <article class="plan-item">
          <span>${item.time || 'Today'}</span>
          <div>
            <strong>${item.title || 'Care reminder'}</strong>
            <small>Entered by ${item.owner || data.caregiverName}. ${item.acknowledge ? 'Acknowledgment enabled.' : 'View only.'}</small>
          </div>
          <button type="button" data-dynamic-ack="${index}">${item.acknowledge ? 'Done' : 'Viewed'}</button>
        </article>
      `).join('');
      carePlanList.querySelectorAll('[data-dynamic-ack]').forEach(button => {
        button.addEventListener('click', () => {
          const item = data.schedule[Number(button.dataset.dynamicAck)];
          const text = `${item.title || 'Care item'} acknowledged`;
          addTimeline(text, 'info');
          postRoom('status', { text }).catch(() => updatePairingUi('Connection problem. Retrying.'));
        });
      });
    }

    const miniPlan = document.querySelector('.mini-plan');
    if (miniPlan) {
      miniPlan.innerHTML = (data.schedule || []).slice(0, 4).map((item, index) => `
        <span>${item.time || 'Today'}</span><strong>${item.title || 'Care reminder'}</strong><small id="${index === 0 ? 'medStatus' : ''}">${item.acknowledge ? 'Waiting for response' : 'Scheduled'}</small>
      `).join('');
    }

    fillSetupForm();

    const currentStatus = document.getElementById('caregiverCurrentStatus');
    if (currentStatus) {
      currentStatus.textContent = state.currentStatus;
    }
    const monitorRobert = document.querySelector('[data-monitor-patient="robert"]');
    if (monitorRobert) {
      monitorRobert.classList.toggle('attention', Boolean(state.helpRequest));
    }

    const alertCard = document.getElementById('caregiverAlertCard');
    const alertTitle = document.getElementById('caregiverAlertTitle');
    const alertMeta = document.getElementById('caregiverAlertMeta');
    const patientRequestStatus = document.getElementById('patientRequestStatus');

    if (state.helpRequest && alertCard && alertTitle && alertMeta && patientRequestStatus) {
      alertCard.hidden = false;
      alertTitle.textContent = `${data.patientName || 'Patient'} needs help now: ${state.helpRequest.reason}`;
      alertMeta.textContent = `${state.helpRequest.status} at ${state.helpRequest.createdAt}. Station status: Online.`;

      if (state.helpRequest.status === 'Acknowledged') {
        patientRequestStatus.innerHTML = `
          <strong>Sarah received your request.</strong>
          <p>She is responding in ${state.helpRequest.estimate}. You can still call Sarah or use the emergency option.</p>
        `;
      } else {
        patientRequestStatus.innerHTML = `
          <strong>Your request was sent.</strong>
          <p>Sarah has been notified. We are waiting for your caregiver to respond.</p>
          <p>Request type: ${state.helpRequest.reason}. Sent at: ${state.helpRequest.createdAt}.</p>
        `;
      }
    } else if (alertCard && patientRequestStatus) {
      alertCard.hidden = true;
      patientRequestStatus.innerHTML = `
        <strong>No active help request.</strong>
        <p>If this is an emergency, call 911 using your phone or emergency device.</p>
      `;
    }
    updateCaregiverAlertBeep();

    const medicationStatus = document.getElementById('medStatus');
    const safeTimeline = Array.isArray(state.timeline) ? state.timeline : [];
    const medicationEvent = safeTimeline.find(item => item.text.includes('Morning medication confirmed'));
    if (medicationStatus) {
      medicationStatus.textContent = medicationEvent ? medicationEvent.text : 'Waiting for response';
    }

    const timeline = document.getElementById('activityTimeline');
    if (timeline) {
      timeline.innerHTML = safeTimeline.map(item => `
        <article class="timeline-item ${item.level || 'info'}">
          <span class="timeline-time">${item.time || 'Now'}</span>
          <span class="timeline-text">${item.text}</span>
        </article>
      `).join('');
    }

    const latestMessage = state.incomingMessages && state.incomingMessages[0];
    const incomingCard = document.getElementById('patientIncomingCard');
    const incomingTitle = document.getElementById('patientIncomingTitle');
    const incomingText = document.getElementById('patientIncomingText');
    const replyStatus = document.getElementById('patientReplyStatus');
    if (incomingCard && incomingTitle && incomingText) {
      if (latestMessage) {
        incomingCard.hidden = false;
        incomingTitle.textContent = latestMessage.type === 'photo'
          ? `${latestMessage.from} sent you a new photo.`
          : latestMessage.type === 'response'
            ? `${latestMessage.from} responded to your help request.`
          : latestMessage.type === 'call'
            ? `${latestMessage.from} wants to call you.`
          : latestMessage.type === 'video'
            ? `${latestMessage.from} wants to start a video call.`
          : latestMessage.type === 'suggestion'
            ? `${latestMessage.from} suggested something for you.`
          : latestMessage.type === 'podcast'
            ? `${latestMessage.from} suggested something for you.`
            : `${latestMessage.from} sent you a message.`;
        incomingText.textContent = latestMessage.text;
        if (replyStatus) {
          replyStatus.textContent = latestMessage.reply ? `Reply sent: ${latestMessage.reply}` : '';
        }
      } else {
        incomingCard.hidden = true;
        if (replyStatus) {
          replyStatus.textContent = '';
        }
      }
    }
    renderCaregiverWorkspace();
  }

  function showPatientNotice(message) {
    if (!message || !document.querySelector('.patient-interface.active')) {
      return;
    }
    const notice = document.getElementById('patientNotice');
    const title = document.getElementById('patientNoticeTitle');
    const text = document.getElementById('patientNoticeText');
    if (!notice || !title || !text) {
      return;
    }
    title.textContent = message.type === 'response'
      ? `${message.from} responded`
      : message.type === 'call'
        ? `${message.from} wants to call`
        : message.type === 'video'
          ? `${message.from} wants a video call`
          : 'New caregiver update';
    text.textContent = message.text;
    notice.hidden = false;
    window.setTimeout(() => {
      notice.hidden = true;
    }, 9000);
    showPatientAlert(message);
  }

  function patientMessageTitle(message) {
    if (!message) return 'New caregiver update';
    if (message.type === 'response') return `${message.from} responded to your help request.`;
    if (message.type === 'call') return `${message.from} wants to call you.`;
    if (message.type === 'video') return `${message.from} wants to start a video call.`;
    if (message.type === 'suggestion') return `${message.from} suggested something for you.`;
    if (message.type === 'photo') return `${message.from} sent you a new photo.`;
    if (message.type === 'podcast') return `${message.from} suggested something for you.`;
    return `${message.from} sent you a message.`;
  }

  function showPatientAlert(message) {
    if (!message || !document.querySelector('.patient-interface.active')) {
      return;
    }
    const modal = document.getElementById('patientAlertModal');
    const title = document.getElementById('patientAlertTitle');
    const text = document.getElementById('patientAlertText');
    const status = document.getElementById('patientAlertStatus');
    if (!modal || !title || !text || !status) {
      return;
    }
    title.textContent = patientMessageTitle(message);
    text.textContent = message.text || 'Open the update when you are ready.';
    status.textContent = `Received at ${message.time || nowLabel()} from ${message.from || 'caregiver/family'}.`;
    modal.hidden = false;
  }

  function sendPatientQuickReply(replyText) {
    const reply = replyText || 'I got the message';
    const message = state.incomingMessages?.[0];
    if (message) {
      message.opened = true;
      message.reply = reply;
      message.replyAt = nowLabel();
    }
    const replyStatus = document.getElementById('patientReplyStatus');
    if (replyStatus) {
      replyStatus.textContent = `Reply sent: ${reply}`;
    }
    document.getElementById('patientAlertModal').hidden = true;
    addTimeline(`Patient replied: ${reply}`, 'important');
    postRoom('reply', { from: profile().patientName || 'Patient', text: reply })
      .catch(() => updatePairingUi('Connection problem. Retrying.'));
    if (reply.toLowerCase().includes('help')) {
      showPatientScreen('help');
    } else {
      showPatientScreen('home');
    }
  }

  const spotifyRelaxSrc = 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4sWSpwq3LiO?utm_source=generator&theme=0';

  function openSpotifyRelax() {
    const panel = document.getElementById('spotifyPanel');
    const frame = document.getElementById('spotifyFrame');
    if (!panel || !frame) {
      return;
    }
    frame.src = spotifyRelaxSrc;
    panel.hidden = false;
    document.querySelector('.station-frame')?.classList.add('player-playing');
    showPatientScreen('home');
    addTimeline('Spotify relaxing music opened in Comfort Care.', 'info');
  }

  function closeSpotifyRelax() {
    const panel = document.getElementById('spotifyPanel');
    const frame = document.getElementById('spotifyFrame');
    if (frame) {
      frame.src = 'about:blank';
    }
    if (panel) {
      panel.hidden = true;
      panel.classList.remove('large-player');
    }
    document.querySelector('.station-frame')?.classList.remove('player-playing');
    const button = document.getElementById('expandSpotify');
    if (button) {
      button.textContent = 'Large';
    }
  }

  function receiveExternalState(nextState) {
    nextState = {
      ...defaultState,
      ...(nextState || {}),
      profile: { ...defaultState.profile, ...(nextState?.profile || {}) },
      timeline: Array.isArray(nextState?.timeline) ? nextState.timeline : [],
      incomingMessages: Array.isArray(nextState?.incomingMessages) ? nextState.incomingMessages : [],
      careCircleMembers: Array.isArray(nextState?.careCircleMembers) ? nextState.careCircleMembers : []
    };
    const incomingProfile = { ...defaultState.profile, ...(nextState.profile || {}) };
    const cachedProfile = loadCachedProfile();
    const cachedTime = Number(cachedProfile?.updatedAt || 0);
    const incomingTime = Number(incomingProfile.updatedAt || 0);
    if (cachedTime > incomingTime) {
      nextState.profile = { ...defaultState.profile, ...cachedProfile };
    } else if (incomingTime > 0) {
      nextState.profile = incomingProfile;
      saveCachedProfile(incomingProfile);
    }

    const nextIncomingCount = nextState.incomingMessages?.length || 0;
    const nextIncoming = nextState.incomingMessages?.[0];
    const nextIncomingSignature = nextIncoming
      ? `${nextIncoming.time}|${nextIncoming.from}|${nextIncoming.text}`
      : '';
    state = nextState;
    renderState();
    if (
      nextIncoming
      && !nextIncoming.opened
      && nextIncomingSignature !== lastIncomingSignature
      && document.querySelector('.patient-interface.active')
    ) {
      showPatientNotice(nextIncoming);
      playBeep();
      if (nextIncoming.type === 'response' && state.helpRequest) {
        showPatientScreen('help');
      } else {
        showPatientScreen('relax');
      }
    }
    lastIncomingCount = nextIncomingCount;
    lastIncomingSignature = nextIncomingSignature;
  }

  document.querySelectorAll('.mode-btn').forEach(button => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });

  function unlockAudioAndAlert() {
    unlockAudio();
    updateCaregiverAlertBeep();
  }

  document.addEventListener('pointerdown', unlockAudioAndAlert, { once: true });
  document.addEventListener('keydown', unlockAudioAndAlert, { once: true });

  document.querySelectorAll('[data-patient-screen]').forEach(button => {
    button.addEventListener('click', () => showPatientScreen(button.dataset.patientScreen));
  });

  document.querySelectorAll('[data-help-reason]').forEach(button => {
    button.addEventListener('click', () => createHelpRequest(button.dataset.helpReason));
  });

  document.querySelectorAll('[data-caregiver-action]').forEach(button => {
    button.addEventListener('click', () => caregiverAction(button.dataset.caregiverAction));
  });

  document.querySelectorAll('[data-send-content]').forEach(button => {
    button.addEventListener('click', () => sendContent(button.dataset.sendContent));
  });

  document.querySelectorAll('[data-ack]').forEach(button => {
    button.addEventListener('click', () => {
      addTimeline(button.dataset.ack, button.dataset.ack.includes('question') ? 'important' : 'info');
      postRoom('status', { text: button.dataset.ack }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    });
  });

  document.querySelectorAll('[data-content]').forEach(button => {
    button.addEventListener('click', () => addTimeline(button.dataset.content, 'info'));
  });

  document.querySelectorAll('[data-patient-ok]').forEach(button => {
    button.addEventListener('click', () => {
      addTimeline('Patient sent status: I am okay.', 'important');
      postRoom('status', { text: 'Patient sent status: I am okay.' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
      showPatientScreen('home');
    });
  });

  document.querySelectorAll('[data-monitor-patient]').forEach(button => {
    button.addEventListener('click', () => selectMonitorPatient(button.dataset.monitorPatient));
  });

  document.querySelectorAll('input[name="appearance"]').forEach(input => {
    input.addEventListener('change', () => setAppearance(input.value));
  });

  document.getElementById('generateSyncCode')?.addEventListener('click', generateNewSyncCode);
  document.getElementById('connectDemoCaregiver')?.addEventListener('click', connectDemoCaregiver);
  document.getElementById('editProfile')?.addEventListener('click', () => setProfileEditing(true));
  document.getElementById('cancelProfile')?.addEventListener('click', () => setProfileEditing(false));
  document.getElementById('patientProfileForm')?.addEventListener('submit', event => {
    event.preventDefault();
    saveProfileForm();
  });
  document.getElementById('restartDemo')?.addEventListener('click', resetDemoState);
  document.getElementById('setupConnectCaregiver')?.addEventListener('click', () => {
    setMode('caregiver');
    if (!hasRoom()) generateNewSyncCode();
  });
  document.getElementById('loadDemoSetup')?.addEventListener('click', () => {
    loadDemoSetup().catch(error => {
      const status = document.getElementById('setupSaveStatus');
      if (status) status.textContent = error.message || 'Unable to load the demo. Please try again.';
    });
  });

  document.getElementById('openSpotifyRelax').addEventListener('click', openSpotifyRelax);

  document.getElementById('expandSpotify').addEventListener('click', () => {
    const panel = document.getElementById('spotifyPanel');
    const button = document.getElementById('expandSpotify');
    if (!panel || !button) return;
    panel.classList.toggle('large-player');
    button.textContent = panel.classList.contains('large-player') ? 'Small' : 'Large';
  });

  document.getElementById('closeSpotify').addEventListener('click', closeSpotifyRelax);
  document.getElementById('permanentStopMusic')?.addEventListener('click', () => {
    closeSpotifyRelax();
    updatePairingUi('Music stopped.');
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !document.getElementById('spotifyPanel')?.hidden) {
      closeSpotifyRelax();
    }
  });

  document.querySelectorAll('[data-preset-message]').forEach(button => {
    button.addEventListener('click', () => {
      addTimeline(`Patient message to Sarah: ${button.dataset.presetMessage}.`, 'important');
      postRoom('status', { text: `Patient message to Sarah: ${button.dataset.presetMessage}.` }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    });
  });

  document.querySelectorAll('[data-start-choice]').forEach(button => {
    button.addEventListener('click', () => {
      const message = button.dataset.startChoice === 'started'
        ? 'Patient started the day.'
        : 'Patient asked to start in a few minutes.';
      addTimeline(message, 'info');
      postRoom('status', { text: message }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    });
  });

  document.querySelectorAll('[data-daily-answer]').forEach(button => {
    button.addEventListener('click', () => {
      const question = profile().dailyQuestion || 'Caregiver question';
      const answer = button.textContent.trim();
      const response = `${profile().patientName || 'Patient'} answered "${answer}" to: ${question}`;
      const status = document.getElementById('dailyQuestionStatus');
      if (status) status.textContent = `Response shared: ${answer}`;
      addTimeline(response, 'important');
      postRoom('status', { text: response }).catch(() => updatePairingUi('Response saved locally. Pairing connection problem.'));
    });
  });

  document.querySelector('[data-cancel-help]').addEventListener('click', cancelHelpRequest);

  document.getElementById('sendTypedMessage').addEventListener('click', () => {
    const field = document.getElementById('caregiverMessage');
    const message = field.value.trim();
    if (!message) {
      updatePairingUi('Type a message before sending.');
      field.focus();
      return;
    }
    sendContent(`Sarah sent a message: ${message}`);
    field.value = '';
  });

  document.getElementById('focusCaregiverMessage').addEventListener('click', () => {
    const field = document.getElementById('caregiverMessage');
    updatePairingUi('Type your message, then tap Send Now.');
    field.focus();
  });
  document.getElementById('messageActivePatient')?.addEventListener('click', () => {
    const field = document.getElementById('caregiverMessage');
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field?.focus();
  });

  document.getElementById('clearDemo').addEventListener('click', resetDemoState);

  document.getElementById('patientOpenIncoming').addEventListener('click', () => {
    if (!state.incomingMessages || !state.incomingMessages[0]) {
      return;
    }
    state.incomingMessages[0].opened = true;
    showPatientScreen('relax');
    addTimeline(`Patient opened message from ${state.incomingMessages[0].from}.`, 'info');
    postRoom('opened', { from: 'Robert' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
  });

  document.getElementById('patientAlertOpen').addEventListener('click', () => {
    const message = state.incomingMessages?.[0];
    if (!message) {
      document.getElementById('patientAlertModal').hidden = true;
      return;
    }
    showPatientScreen('relax');
    state.incomingMessages[0].opened = true;
    document.getElementById('patientAlertModal').hidden = true;
    if (message.type === 'response' && state.helpRequest) {
      showPatientScreen('help');
    } else {
      showPatientScreen('relax');
    }
    addTimeline(`Patient opened alert from ${message.from}.`, 'info');
    postRoom('opened', { from: 'Robert' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
  });

  document.getElementById('patientAlertCall').addEventListener('click', () => {
    const phone = profile().caregiverPhone.replace(/[^\d+]/g, '');
    addTimeline('Patient chose to call caregiver from alert.', 'important');
    postRoom('status', { text: 'Patient chose to call caregiver from alert.' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  });

  document.getElementById('patientAlertLater').addEventListener('click', () => {
    document.getElementById('patientAlertModal').hidden = true;
    addTimeline('Patient selected Not Now for caregiver update.', 'info');
  });

  document.getElementById('patientAlertHome').addEventListener('click', () => {
    document.getElementById('patientAlertModal').hidden = true;
    showPatientScreen('home');
  });

  document.querySelectorAll('[data-patient-quick-reply]').forEach(button => {
    button.addEventListener('click', () => {
      sendPatientQuickReply(button.dataset.patientQuickReply);
    });
  });

  window.addEventListener('storage', event => {
    if (event.key !== storageKey || !event.newValue) {
      return;
    }
    try {
      receiveExternalState(JSON.parse(event.newValue));
    } catch (error) {
      renderState();
    }
  });

  if (channel) {
    channel.addEventListener('message', event => {
      if (event.data?.type === 'state-updated' && event.data.state) {
        receiveExternalState(event.data.state);
      }
    });
  }

  document.getElementById('newPairingCode').addEventListener('click', generateNewSyncCode);

  async function joinPatientRoom(input) {
    const inputCode = cleanCode(input?.value);
    if (inputCode.length !== 6) {
      updatePairingUi('Enter the six-digit code generated by your caregiver.');
      const syncStatus = document.getElementById('patientSyncStatus');
      if (syncStatus) syncStatus.textContent = 'Enter all six digits, then tap Connect.';
      return;
    }
    updatePairingUi('Connecting to caregiver...');
    const syncStatus = document.getElementById('patientSyncStatus');
    if (syncStatus) syncStatus.textContent = 'Connecting to caregiver...';
    try {
      const response = await fetch(`/recovery-hub-room?code=${encodeURIComponent(inputCode)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Pairing code not found.');
      roomCode = inputCode;
      roomVerified = true;
      state.syncCode = roomCode;
      localStorage.setItem(roomStorageKey, roomCode);
      updateUrlCode();
      receiveExternalState(data.room);
      updatePairingUi('Paired and connected.');
      startPolling();
    } catch (error) {
      roomCode = '';
      localStorage.removeItem(roomStorageKey);
      updatePairingUi(error.message || 'Pairing code not found. Ask the caregiver for a new code.');
      if (syncStatus) syncStatus.textContent = error.message || 'Pairing code not found. Ask the caregiver for a new code.';
    }
  }

  document.getElementById('joinPairRoom')?.addEventListener('click', () => {
    joinPatientRoom(document.getElementById('joinPairCode'));
  });

  document.getElementById('patientJoinSyncCode')?.addEventListener('click', () => {
    joinPatientRoom(document.getElementById('patientSyncCode'));
  });

  document.getElementById('familyJoinPairCode')?.addEventListener('click', () => {
    joinPatientRoom(document.getElementById('familyPairCode'));
  });

  document.getElementById('resetPairRoom').addEventListener('click', () => {
    roomCode = '';
    localStorage.removeItem(roomStorageKey);
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    const joinInput = document.getElementById('joinPairCode');
    if (joinInput) {
      joinInput.value = '';
      joinInput.focus();
    }
    const warning = document.getElementById('pairingWarning');
    if (warning) {
      warning.hidden = true;
    }
    const nextParams = new URLSearchParams(window.location.search);
    nextParams.delete('code');
    nextParams.set('role', initialRole);
    window.history.replaceState({}, '', `${window.location.pathname}?${nextParams.toString()}`);
    updatePairingUi('Code reset. Enter the patient station code and tap Join.');
  });

  document.getElementById('copyCaregiverLink').addEventListener('click', async () => {
    if (!hasRoom()) {
      roomCode = generateCode();
      localStorage.setItem(roomStorageKey, roomCode);
      updateUrlCode();
      startPolling();
    }
    const pairPage = window.location.hostname === 'localhost' ? '/pair.html' : '/pair';
    const link = `${window.location.origin}${pairPage}?role=caregiver&code=${roomCode}`;
    try {
      await navigator.clipboard.writeText(link);
      updatePairingUi('Caregiver link copied.');
    } catch (error) {
      updatePairingUi(link);
    }
  });

  document.getElementById('sendCallRequest').addEventListener('click', () => {
    postRoom('call', { from: 'Sarah' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    addTimeline('Sarah requested a phone call.', 'important');
  });

  document.getElementById('sendVideoRequest').addEventListener('click', () => {
    const suggestion = document.getElementById('sharedLinkInput').value.trim();
    postRoom('video', { from: 'Sarah', text: suggestion ? `Video request: ${suggestion}` : 'Video call requested.' }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    addTimeline('Sarah requested a video call.', 'important');
  });

  document.getElementById('sendSharedLink').addEventListener('click', () => {
    const field = document.getElementById('sharedLinkInput');
    const suggestion = field.value.trim();
    if (!suggestion) {
      updatePairingUi('Type a suggestion before sending.');
      field.focus();
      return;
    }
    postRoom('message', { from: 'Sarah', type: 'suggestion', text: suggestion }).catch(() => updatePairingUi('Connection problem. Retrying.'));
    addTimeline(`Sarah suggested: ${suggestion}`, 'info');
    field.value = '';
  });

  document.getElementById('setupForm').addEventListener('submit', event => {
    event.preventDefault();
    state.profile = collectSetupProfile();
    saveCachedProfile(state.profile);
    addTimeline('Setup information saved.', 'important');
    const status = document.getElementById('setupSaveStatus');
    if (status) status.textContent = 'Saving setup to paired room...';
    postRoom('profile', { from: 'Setup', profile: state.profile })
      .then(() => {
        if (status) status.textContent = 'Setup saved and shared with patient and caregiver pages.';
      })
      .catch(() => {
        if (status) status.textContent = 'Saved on this device. Pairing connection problem.';
      });
    renderState();
  });

  ensureSyncCode();
  applyAppearance();
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (appearancePreference() === 'device') applyAppearance('device');
    });
  }
  syncCountdownTimer = setInterval(() => {
    const countdown = document.getElementById('syncCountdown');
    if (countdown) {
      countdown.textContent = hasRoom() ? syncTimeText() : 'Generate a code when the patient is ready';
    }
  }, 1000);
  if (cleanPairMode) document.querySelector('.hub-shell').classList.add('clean-pair');
  const caregiverGenerateArea = document.getElementById('caregiverGenerateArea');
  const familyJoinArea = document.getElementById('familyJoinArea');
  if (caregiverGenerateArea) caregiverGenerateArea.hidden = initialRole === 'family';
  if (familyJoinArea) familyJoinArea.hidden = initialRole !== 'family';
  document.querySelector('.hub-shell').dataset.role = isCareCircleRole ? 'caregiver' : initialRole === 'setup' ? 'setup' : 'patient';
  setMode(isCareCircleRole ? 'caregiver' : initialRole === 'setup' ? 'setup' : 'patient');
  trackDemoOpen();
  updatePairingUi(hasRoom() ? `Paired with code ${roomCode}.` : 'Not paired yet.');
  startPolling();
  renderState();
  if (demoMode && initialRole === 'caregiver' && !hasRoom()) {
    loadDemoSetup().catch(() => updatePairingUi('Demo loaded locally.'));
  }
  if (demoMode && tourMode) {
    window.setTimeout(startGuidedRoleDemo, 250);
  }
  if (
    initialRole === 'patient'
    && hasRoom()
    && state.incomingMessages?.[0]
    && !state.incomingMessages[0].opened
    && state.incomingMessages[0].time !== 'Demo'
  ) {
    showPatientNotice(state.incomingMessages[0]);
    playBeep();
    if (state.incomingMessages[0].type === 'response' && state.helpRequest) {
      showPatientScreen('help');
    } else {
      showPatientScreen('relax');
    }
  }
})();
