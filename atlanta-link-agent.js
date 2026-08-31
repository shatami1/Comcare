const STORAGE_KEY = 'comcare-atlanta-link-agent-v2';
const TOKEN_KEY = 'comcare-atlanta-link-agent-token';
const STATUSES = ['Research', 'Needs approval', 'Approved', 'Contacted', 'Follow-up', 'Live', 'Not a fit'];
const seed = [
  ['Atlanta Regional Commission - Aging', 'https://atlantaregional.org/what-we-do/aging-services-and-resources/', '', 'Government resource', 'Metro Atlanta', 94, 'Request resource-provider review', 'Needs approval', 'Ask about the Empowerline provider/resource process.'],
  ['Empowerline', 'https://empowerline.org/get-info/resources-for-aging-in-place/', '', 'Aging resource', 'Metro Atlanta', 94, 'Suggest local recovery-equipment resource', 'Needs approval', 'Requires editorial or provider approval.'],
  ['Senior Directory - Atlanta', 'https://seniordirectory.com/listing/atlanta/category/in-home-services/p2', '', 'Senior directory', 'Atlanta', 90, 'Submit Wheelchairs & Walkers listing', 'Approved', 'Verify current listing terms.'],
  ['Senior Business Directory - Atlanta', 'https://seniorbusinessdirectory.com/location/georgia/atlanta/', '', 'Senior directory', 'Atlanta', 86, 'Submit business listing', 'Approved', 'Use the Atlanta Home Recovery page.'],
  ['APTA Georgia', 'https://aptageorgia.org/page/Advertising', '', 'Professional association', 'Georgia', 88, 'Ask about advertising or partnership', 'Research', 'Good PT/OT audience; likely paid sponsorship.'],
  ['Home Care Association of America - Georgia', 'https://www.hcaoa.org/georgia.html', '', 'Professional association', 'Georgia', 87, 'Ask about Partners & Vendors directory', 'Research', 'Confirm vendor requirements.'],
  ['Greater Perimeter Chamber', 'https://business.greaterperimeterchamber.com/list/', '', 'Chamber directory', 'Sandy Springs', 84, 'Apply for member directory listing', 'Research', 'Membership may be required.'],
  ['Fulton County Senior Services', 'https://www.fultoncountyga.gov/services/senior-services', '', 'County resource', 'Fulton County', 83, 'Offer resource information for review', 'Needs approval', 'Do not imply government endorsement.'],
  ['DeKalb County Senior Centers', 'https://dekalbcountyga.gov/services/office-of-aging/senior-centers', '', 'Senior centers', 'DeKalb County', 82, 'Ask about resource-board inclusion', 'Needs approval', 'Contact only with relevant local service information.'],
  ['Cobb County Senior Services', 'https://www.cobbcounty.org/public-services/senior-services', '', 'County resource', 'Cobb County', 82, 'Ask about community resource process', 'Research', 'Local fit for Marietta and Cobb.'],
  ['Gwinnett County Senior Services', 'https://www.gwinnettcounty.com/web/gwinnett/departments/communityservices/healthhumanservices/seniorservices', '', 'County resource', 'Gwinnett County', 84, 'Ask about approved local resources', 'Research', 'Strong fit for Norcross.'],
  ['Fulton County Library Senior Resources', 'https://www.fulcolibrary.org/blogs/post/senior-services-resources/', '', 'Community resource', 'Fulton County', 76, 'Pitch a recovery-at-home guide', 'Research', 'Lead with education, not sales.'],
  ['Georgia Division of Aging Services', 'https://aging.georgia.gov/programs-and-services', '', 'State resource', 'Georgia', 78, 'Find correct Area Agency referral route', 'Research', 'Not an automatic listing.'],
  ['Georgia Council on Aging', 'https://www.gcoa.org/aging-resources-ga', '', 'Advocacy resource', 'Georgia', 76, 'Suggest aging-in-place resource', 'Research', 'Confirm commercial-resource policy.'],
  ['Georgia Watch - Senior Health', 'https://georgiawatch.org/senior-health/', '', 'Consumer resource', 'Georgia', 74, 'Pitch equipment-rental consumer guide', 'Research', 'Educational content opportunity.'],
  ['Emory Caregiving Resources', 'https://hr.emory.edu/eu/work-life/adult-and-elder-care/caregiving-resources/index.html', '', 'Employer resource', 'Atlanta', 79, 'Suggest vetted Metro Atlanta resource', 'Research', 'Requires institutional approval.'],
  ['Sadie G. Mays Health & Rehabilitation Center', 'https://www.sgmays.org/caregiving-support/', '', 'Caregiver resource', 'Atlanta', 78, 'Propose reciprocal recovery resource', 'Research', 'Personalized partnership outreach.'],
  ['Care.com Atlanta Home Care Agencies', 'https://www.care.com/home-care-agencies/atlanta-ga', '', 'Commercial directory', 'Atlanta', 68, 'Review business-listing eligibility', 'Research', 'Check fees and category fit.'],
  ['A Place for Mom - Atlanta Home Care', 'https://www.aplaceformom.com/home-care/georgia/atlanta', '', 'Commercial directory', 'Atlanta', 66, 'Ask whether equipment partners are eligible', 'Research', 'May not accept DME vendors.'],
  ['Seniors Resource Directory', 'https://seniorsresourcedirectory.com/', '', 'Senior directory', 'Georgia', 77, 'Request Atlanta vendor listing', 'Research', 'Confirm coverage and pricing.'],
  ['Family Caregiver Alliance - Georgia', 'https://www.caregiver.org/connecting-caregivers/services-by-state/georgia/', '', 'Caregiver resource', 'Georgia', 72, 'Suggest qualified local resource', 'Research', 'Educational/nonprofit standard likely applies.'],
  ['CareYaya Atlanta Resources', 'https://www.careyaya.org/resources/blog/best-senior-care-atlanta', '', 'Senior-care publication', 'Atlanta', 70, 'Pitch recovery-equipment guide or update', 'Research', 'Editorial outreach only.'],
  ['Buckhead Business Association', 'https://buckheadbusiness.org/', '', 'Business association', 'Buckhead', 70, 'Review membership directory', 'Research', 'Useful for Buckhead visibility.'],
  ['Brookhaven Chamber', 'https://www.brookhavencommerce.org/', '', 'Chamber directory', 'Brookhaven', 69, 'Review member listing options', 'Research', 'Confirm health-service categories.'],
  ['Georgia NPI / PT clinic research list', 'https://www.stedi.com/npi-registry/taxonomy/physical-therapy-clinic-center/GA/1', '', 'Prospect research', 'Georgia', 60, 'Identify PT partners; do not request link', 'Research', 'Research source only; contact each clinic directly.']
].map((x, i) => ({
  id: i + 1,
  name: x[0],
  url: x[1],
  email: x[2],
  category: x[3],
  location: x[4],
  score: x[5],
  action: x[6],
  status: x[7],
  notes: x[8]
}));

let opportunities = load();
const $ = (id) => document.getElementById(id);

function cloneSeed() {
  return JSON.parse(JSON.stringify(seed));
}

function normalizeOpportunity(item) {
  return { email: '', ...item };
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) return saved.map(normalizeOpportunity);
  } catch (error) {}
  return cloneSeed();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
  render();
}

function esc(value = '') {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function populateFilters() {
  STATUSES.forEach((status) => $('statusFilter').insertAdjacentHTML('beforeend', `<option>${status}</option>`));
  STATUSES.forEach((status) => $('editStatus').insertAdjacentHTML('beforeend', `<option>${status}</option>`));
  [...new Set(seed.map((item) => item.category))]
    .sort()
    .forEach((category) => $('categoryFilter').insertAdjacentHTML('beforeend', `<option>${esc(category)}</option>`));
}

function filtered() {
  const q = $('searchInput').value.toLowerCase();
  const status = $('statusFilter').value;
  const category = $('categoryFilter').value;
  const min = Number($('scoreFilter').value);
  return opportunities
    .filter((item) => (!q || [item.name, item.category, item.location, item.action, item.email].some((value) => String(value || '').toLowerCase().includes(q)))
      && (!status || item.status === status)
      && (!category || item.category === category)
      && item.score >= min)
    .sort((a, b) => b.score - a.score);
}

function render() {
  const rows = filtered();
  $('resultCount').textContent = `Showing ${rows.length} of ${opportunities.length}`;
  $('totalCount').textContent = opportunities.length;
  $('approvedCount').textContent = opportunities.filter((item) => item.status === 'Approved').length;
  $('contactedCount').textContent = opportunities.filter((item) => ['Contacted', 'Follow-up', 'Live'].includes(item.status)).length;
  $('liveCount').textContent = opportunities.filter((item) => item.status === 'Live').length;
  $('opportunityRows').innerHTML = rows.length
    ? rows.map((item) => `<tr><td><span class="score ${item.score < 75 ? 'mid' : ''}">${item.score}</span></td><td><a href="${esc(item.url)}" target="_blank" rel="noopener">${esc(item.name)}</a><span class="org-location">${esc(item.location)}${item.email ? ` - ${esc(item.email)}` : ''}</span></td><td>${esc(item.category)}</td><td>${esc(item.action)}</td><td><select class="status-select" data-status="${item.id}">${STATUSES.map((status) => `<option ${status === item.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td><td><div class="tool-row"><button class="tool" data-message="${item.id}">Send</button><button class="tool" data-edit="${item.id}">Edit</button></div></td></tr>`).join('')
    : '<tr><td colspan="6" class="empty">No opportunities match these filters.</td></tr>';
}

function openEdit(id) {
  const item = opportunities.find((entry) => entry.id === id);
  $('dialogTitle').textContent = item ? 'Edit opportunity' : 'Add opportunity';
  $('editId').value = item?.id || '';
  $('editName').value = item?.name || '';
  $('editUrl').value = item?.url || '';
  $('editEmail').value = item?.email || '';
  $('editCategory').value = item?.category || '';
  $('editLocation').value = item?.location || '';
  $('editScore').value = item?.score || 70;
  $('editStatus').value = item?.status || 'Research';
  $('editAction').value = item?.action || '';
  $('editNotes').value = item?.notes || '';
  $('editDialog').showModal();
}

function draft(item) {
  return {
    subject: `Atlanta recovery-at-home resource for ${item.name}`,
    body: `Hello ${item.name} team,\n\nI am reaching out from Comfort Care, a Metro Atlanta home-recovery service offering wheelchair, walker, rollator, hospital-bed, and bathroom-safety equipment rentals and sales, with local delivery and setup.\n\nI noticed your work serving ${item.location} residents and wanted to ask whether Comfort Care could be considered for an appropriate local resource, vendor, or partner listing. Our Atlanta recovery page is:\n\nhttps://comcare.store/atlanta-home-recovery.html?utm_source=partner&utm_medium=referral&utm_campaign=atlanta_links\n\nWe would be glad to provide a short educational description, verify our service details, and follow your organization's listing standards. We are also interested in reciprocal referrals when a family needs caregiving, rehabilitation, or community support beyond equipment.\n\nThank you for considering it.\n\nSaeed\nComfort Care\nadmin@comcare.store\n678-242-9309\nhttps://comcare.store`
  };
}

function openMessage(id) {
  const item = opportunities.find((entry) => entry.id === id);
  const message = draft(item);
  $('messageOpportunityId').value = item.id;
  $('messageTo').value = item.email || '';
  $('messageToken').value = sessionStorage.getItem(TOKEN_KEY) || '';
  $('messageSubject').value = message.subject;
  $('messageText').value = message.body;
  $('sendStatus').textContent = item.status === 'Approved' ? '' : 'Tip: move this target to Approved before sending.';
  $('messageDialog').showModal();
}

function currentMessagePayload() {
  const item = opportunities.find((entry) => entry.id === Number($('messageOpportunityId').value));
  return {
    item,
    to: $('messageTo').value.trim(),
    subject: $('messageSubject').value.trim(),
    text: $('messageText').value.trim()
  };
}

function updateEmailOnOpportunity(item, email) {
  if (!item || !email || item.email === email) return;
  item.email = email;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(opportunities));
}

function markContacted(item) {
  if (!item) return;
  item.status = 'Contacted';
  save();
}

document.addEventListener('change', (event) => {
  if (event.target.matches('[data-status]')) {
    opportunities.find((item) => item.id === Number(event.target.dataset.status)).status = event.target.value;
    save();
  }
});

document.addEventListener('click', (event) => {
  if (event.target.dataset.edit) openEdit(Number(event.target.dataset.edit));
  if (event.target.dataset.message) openMessage(Number(event.target.dataset.message));
});

['searchInput', 'statusFilter', 'categoryFilter', 'scoreFilter'].forEach((id) => {
  $(id).addEventListener(id === 'searchInput' ? 'input' : 'change', render);
});

$('addOpportunity').onclick = () => openEdit();
$('saveOpportunity').onclick = (event) => {
  event.preventDefault();
  const id = Number($('editId').value);
  const item = {
    id: id || Date.now(),
    name: $('editName').value.trim(),
    url: $('editUrl').value.trim(),
    email: $('editEmail').value.trim().toLowerCase(),
    category: $('editCategory').value.trim(),
    location: $('editLocation').value.trim(),
    score: Number($('editScore').value),
    status: $('editStatus').value,
    action: $('editAction').value.trim(),
    notes: $('editNotes').value.trim()
  };
  if (!item.name || !item.url || !item.category || !item.location || !item.action) return $('editForm').reportValidity();
  const index = opportunities.findIndex((entry) => entry.id === id);
  if (index >= 0) opportunities[index] = item;
  else opportunities.push(item);
  $('editDialog').close();
  save();
};

$('copyMessage').onclick = async () => {
  const payload = currentMessagePayload();
  await navigator.clipboard.writeText(`Subject: ${payload.subject}\n\n${payload.text}`);
  $('copyMessage').textContent = 'Copied';
  setTimeout(() => { $('copyMessage').textContent = 'Copy draft'; }, 1400);
};

$('openMailto').onclick = () => {
  const payload = currentMessagePayload();
  updateEmailOnOpportunity(payload.item, payload.to);
  const url = `mailto:${encodeURIComponent(payload.to)}?subject=${encodeURIComponent(payload.subject)}&body=${encodeURIComponent(payload.text)}`;
  window.location.href = url;
};

$('sendMessage').onclick = async () => {
  const payload = currentMessagePayload();
  const token = $('messageToken').value.trim();
  if (!payload.to) {
    $('sendStatus').textContent = 'Enter the recipient email first.';
    return;
  }
  if (!token) {
    $('sendStatus').textContent = 'Enter your private admin token first.';
    return;
  }
  if (payload.item?.status !== 'Approved' && !confirm('This target is not marked Approved yet. Send anyway?')) return;

  sessionStorage.setItem(TOKEN_KEY, token);
  updateEmailOnOpportunity(payload.item, payload.to);
  $('sendMessage').disabled = true;
  $('sendStatus').textContent = 'Sending...';
  try {
    const response = await fetch('/api/atlanta-link-agent-send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        organization: payload.item?.name,
        website: payload.item?.url
      })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Email send failed.');
    markContacted(payload.item);
    $('sendStatus').textContent = 'Sent. Status changed to Contacted.';
  } catch (error) {
    $('sendStatus').textContent = error.message || 'Email send failed.';
  } finally {
    $('sendMessage').disabled = false;
  }
};

$('resetData').onclick = () => {
  if (confirm('Replace local changes with the 25 starter opportunities?')) {
    opportunities = cloneSeed();
    save();
  }
};

$('exportCsv').onclick = () => {
  const headers = ['Score', 'Organization', 'Website', 'Email', 'Category', 'Location', 'Suggested Action', 'Status', 'Notes'];
  const values = opportunities.map((item) => [item.score, item.name, item.url, item.email, item.category, item.location, item.action, item.status, item.notes]);
  const csv = [headers, ...values]
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n');
  const link = document.createElement('a');
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  link.download = `comcare-atlanta-links-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

populateFilters();
render();
