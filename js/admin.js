const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const state = { token: localStorage.getItem('vd_admin_token'), branches: [], fees: [], bookings: [] };

function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }
function data(form) { return Object.fromEntries(new FormData(form).entries()); }

async function api(path, options = {}) {
  const headers = options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Request failed.');
  return result;
}

function showNotice(id, message, ok = true) {
  const node = qs(id);
  node.textContent = message;
  node.className = `notice ${ok ? 'ok' : 'fail'}`;
}

function setView() {
  qs('#loginView').classList.toggle('hidden', Boolean(state.token));
  qs('#dashboardView').classList.toggle('hidden', !state.token);
}

async function login(event) {
  event.preventDefault();
  try {
    const result = await api('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify(data(event.currentTarget))
    });
    state.token = result.token;
    localStorage.setItem('vd_admin_token', state.token);
    setView();
    await loadDashboard();
  } catch (error) {
    showNotice('#loginNotice', error.message, false);
  }
}

function logout() {
  localStorage.removeItem('vd_admin_token');
  state.token = null;
  setView();
}

function activateTab(name) {
  qsa('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  qsa('.admin-panel').forEach((panel) => panel.classList.toggle('active', panel.id === `panel-${name}`));
}

function renderSummary(summary) {
  qs('#branchCount').textContent = summary.branches;
  qs('#bookingCount').textContent = summary.bookings;
  qs('#pendingCount').textContent = summary.pending;
}

function renderBookings() {
  const wrap = qs('#bookingList');
  if (!state.bookings.length) {
    wrap.innerHTML = '<div class="card form-card"><p class="muted">No booking requests yet.</p></div>';
    return;
  }
  wrap.innerHTML = state.bookings.map((booking) => `
    <article class="booking-row">
      <div>
        <span class="badge ${booking.status === 'Confirmed' ? 'green' : booking.status === 'Rejected' ? '' : 'gold'}">${booking.status}</span>
        <h3>${booking.studentName} · ${booking.branchName || booking.branch?.name || 'Branch'}</h3>
        <p class="muted">Parent: ${booking.parentName} · ${booking.phone} · ${booking.email}</p>
        <p class="muted">Preferred: ${new Date(booking.preferredDate).toDateString()} at ${booking.preferredTime} · Visitors: ${booking.visitors}</p>
        <p class="muted">${booking.message || ''}</p>
      </div>
      <div class="booking-actions">
        <a class="btn btn-secondary btn-small" href="tel:${booking.phone}">Call</a>
        <a class="btn btn-secondary btn-small" href="mailto:${booking.email}">Email</a>
        <button class="btn btn-soft btn-small" data-booking="${booking.id}" data-status="Confirmed">Confirm</button>
        <button class="btn btn-danger btn-small" data-booking="${booking.id}" data-status="Rejected">Reject</button>
      </div>
    </article>
  `).join('');
  qsa('[data-booking]', wrap).forEach((button) => button.addEventListener('click', updateBookingStatus));
}

async function updateBookingStatus(event) {
  const button = event.currentTarget;
  await api(`/api/admin/bookings/${button.dataset.booking}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: button.dataset.status })
  });
  await loadDashboard();
}

function renderBranches() {
  qs('#adminBranchCards').innerHTML = state.branches.map((branch) => `
    <article class="card branch-card">
      <img src="${branch.image || '/images/campus.svg'}" alt="${branch.name}">
      <div class="card-body">
        <span class="badge">${branch.admissionStatus}</span>
        <h3>${branch.name}</h3>
        <p class="muted">${branch.address}</p>
        <button class="btn btn-secondary btn-small" data-edit-branch="${branch.id}">Edit branch</button>
      </div>
    </article>
  `).join('');
  qsa('[data-edit-branch]').forEach((button) => button.addEventListener('click', () => editBranch(button.dataset.editBranch)));
}

function editBranch(id) {
  const branch = state.branches.find((item) => item.id === id);
  const form = qs('#branchForm');
  form.elements.id.value = branch.id;
  form.elements.name.value = branch.name || '';
  form.elements.phone.value = branch.phone || '';
  form.elements.address.value = branch.address || '';
  form.elements.mapUrl.value = branch.mapUrl || '';
  form.elements.mapEmbedUrl.value = branch.mapEmbedUrl || '';
  form.elements.admissionStatus.value = branch.admissionStatus || 'Open';
  form.elements.description.value = branch.description || '';
  form.elements.facilities.value = (branch.facilities || []).join('\n');
  form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

async function saveBranch(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const payload = new FormData(form);
  const id = payload.get('id');
  try {
    await api(id ? `/api/admin/branches/${id}` : '/api/admin/branches', { method: id ? 'PUT' : 'POST', body: payload });
    showNotice('#branchNotice', 'Branch saved.');
    form.reset();
    qs('#branchId').value = '';
    await loadDashboard();
  } catch (error) {
    showNotice('#branchNotice', error.message, false);
  }
}

function renderFees() {
  qs('#adminFeeRows').innerHTML = state.fees.map((fee) => `
    <tr>
      <td>${fee.level}</td><td>${money.format(fee.admissionFee)}</td><td>${money.format(fee.monthlyTuition)}</td><td>${money.format(fee.annualCharges)}</td><td>${fee.transportFee ? money.format(fee.transportFee) : 'Optional'}</td>
      <td><button class="btn btn-secondary btn-small" data-edit-fee="${fee.id}">Edit</button></td>
    </tr>
  `).join('');
  qsa('[data-edit-fee]').forEach((button) => button.addEventListener('click', () => editFee(button.dataset.editFee)));
}

function editFee(id) {
  const fee = state.fees.find((item) => item.id === id);
  const form = qs('#feeForm');
  form.elements.id.value = fee.id;
  form.elements.level.value = fee.level;
  form.elements.admissionFee.value = fee.admissionFee;
  form.elements.monthlyTuition.value = fee.monthlyTuition;
  form.elements.annualCharges.value = fee.annualCharges;
  form.elements.transportFee.value = fee.transportFee || 0;
}

async function saveFee(event) {
  event.preventDefault();
  const payload = data(event.currentTarget);
  const id = payload.id;
  delete payload.id;
  try {
    await api(id ? `/api/admin/fees/${id}` : '/api/admin/fees', { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) });
    showNotice('#feeNotice', 'Fee row saved.');
    event.currentTarget.reset();
    qs('#feeId').value = '';
    await loadDashboard();
  } catch (error) {
    showNotice('#feeNotice', error.message, false);
  }
}

async function loadDashboard() {
  try {
    const [summary, branches, fees, bookings] = await Promise.all([
      api('/api/admin/summary'),
      api('/api/branches'),
      api('/api/fees'),
      api('/api/admin/bookings')
    ]);
    Object.assign(state, { branches, fees, bookings });
    renderSummary(summary);
    renderBookings();
    renderBranches();
    renderFees();
  } catch (error) {
    if (/auth|session|token/i.test(error.message)) logout();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  qs('#loginForm').addEventListener('submit', login);
  qs('#logoutButton').addEventListener('click', logout);
  qs('#branchForm').addEventListener('submit', saveBranch);
  qs('#feeForm').addEventListener('submit', saveFee);
  qs('#clearBranchForm').addEventListener('click', () => { qs('#branchForm').reset(); qs('#branchId').value = ''; });
  qs('#clearFeeForm').addEventListener('click', () => { qs('#feeForm').reset(); qs('#feeId').value = ''; });
  qsa('.tab').forEach((tab) => tab.addEventListener('click', () => activateTab(tab.dataset.tab)));
  setView();
  if (state.token) loadDashboard();
});
