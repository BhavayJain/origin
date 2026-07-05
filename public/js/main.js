const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
let branches = [];

function qs(selector, root = document) { return root.querySelector(selector); }
function qsa(selector, root = document) { return [...root.querySelectorAll(selector)]; }

function initNav() {
  const toggle = qs('.nav-toggle');
  const links = qs('.nav-links');
  if (!toggle || !links) return;
  toggle.setAttribute('aria-expanded', 'false');
  toggle.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
  links.addEventListener('click', (event) => {
    if (event.target.tagName === 'A') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
}

function initSlideshow() {
  const slides = qsa('.slide');
  const dots = qs('.slide-dots');
  if (!slides.length || !dots) return;
  slides.forEach((_, index) => {
    const dot = document.createElement('span');
    dot.className = `slide-dot ${index === 0 ? 'active' : ''}`;
    dots.appendChild(dot);
  });
  const dotItems = qsa('.slide-dot');
  let active = 0;
  setInterval(() => {
    slides[active].classList.remove('active');
    dotItems[active].classList.remove('active');
    active = (active + 1) % slides.length;
    slides[active].classList.add('active');
    dotItems[active].classList.add('active');
  }, 4200);
}

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: .12 });
  qsa('.reveal').forEach((item) => observer.observe(item));
}

function statusClass(status) {
  if (status === 'Open') return 'green';
  if (status === 'Limited Seats') return 'gold';
  return '';
}

function renderBranches() {
  const wrap = qs('#branchCards');
  const select = qs('#branch');
  if (select) {
    select.innerHTML = '<option value="">Select branch</option>' + branches.map((branch) => `<option value="${branch.id}">${branch.name}</option>`).join('');
  }
  if (!wrap) return;
  wrap.innerHTML = branches.map((branch) => `
    <article class="card branch-card" tabindex="0" data-id="${branch.id}" aria-label="Open ${branch.name} detail page">
      <img src="${branch.image || '/images/campus.svg'}" alt="${branch.name}">
      <div class="card-body">
        <span class="badge ${statusClass(branch.admissionStatus)}">${branch.admissionStatus}</span>
        <h3>${branch.name}</h3>
        <p class="muted">${branch.address}</p>
        <div class="tag-list">${(branch.facilities || []).slice(0, 3).map((facility) => `<span class="tag">${facility.replace(/ with .*/, '')}</span>`).join('')}</div>
        <div class="booking-actions">
          <a class="btn btn-secondary btn-small" href="/branch/${branch.id}">Contact & View Details</a>
          ${branch.mapUrl ? `<a class="btn btn-soft btn-small" href="${branch.mapUrl}" target="_blank" rel="noopener">Open Map</a>` : ''}
        </div>
      </div>
    </article>
  `).join('');
  qsa('.branch-card', wrap).forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('a')) return;
      window.location.href = `/branch/${card.dataset.id}`;
    });
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') window.location.href = `/branch/${card.dataset.id}`;
    });
  });
}

function renderFees(fees) {
  const rows = qs('#feeRows');
  if (!rows) return;
  rows.innerHTML = fees.map((fee) => `
    <tr>
      <td>${fee.level}</td>
      <td>${money.format(fee.admissionFee)}</td>
      <td>${money.format(fee.monthlyTuition)}</td>
      <td>${money.format(fee.annualCharges)}</td>
      <td>${fee.transportFee ? money.format(fee.transportFee) : 'Optional'}</td>
    </tr>
  `).join('');
}

function formData(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function clearErrors(form) {
  qsa('.error', form).forEach((item) => { item.textContent = ''; });
}

function showErrors(form, errors = {}) {
  Object.entries(errors).forEach(([key, message]) => {
    const target = qs(`[data-error="${key}"]`, form);
    if (target) target.textContent = message;
  });
}

function validateBooking(data) {
  const errors = {};
  if (!data.studentName.trim()) errors.studentName = 'Student name is required.';
  if (!data.parentName.trim()) errors.parentName = 'Parent name is required.';
  if (!/^[0-9+\-\s()]{7,18}$/.test(data.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Enter a valid email.';
  if (!data.preferredDate) errors.preferredDate = 'Choose a preferred date.';
  if (!data.preferredTime) errors.preferredTime = 'Choose a preferred time.';
  if (!data.branch) errors.branch = 'Select a branch.';
  const visitors = Number(data.visitors);
  if (!Number.isInteger(visitors) || visitors < 1 || visitors > 10) errors.visitors = 'Use 1 to 10 visitors.';
  return errors;
}

function initBooking() {
  const form = qs('#bookingForm');
  if (!form) return;
  qs('#preferredDate').min = new Date().toISOString().slice(0, 10);
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);
    const notice = qs('#bookingNotice');
    notice.className = 'notice';
    const data = formData(form);
    const errors = validateBooking(data);
    if (Object.keys(errors).length) {
      showErrors(form, errors);
      return;
    }
    const button = qs('button[type="submit"]', form);
    button.disabled = true;
    button.textContent = 'Submitting...';
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (!response.ok) {
        showErrors(form, result.errors);
        throw new Error(result.message || 'Booking failed.');
      }
      form.reset();
      qs('#preferredDate').min = new Date().toISOString().slice(0, 10);
      notice.textContent = 'Your tour request was sent to the admissions manager.';
      notice.className = 'notice ok';
    } catch (error) {
      notice.textContent = error.message || 'Could not submit booking. Please try again.';
      notice.className = 'notice fail';
    } finally {
      button.disabled = false;
      button.textContent = 'Submit Booking Request';
    }
  });
}

async function loadData() {
  const [branchResponse, feeResponse] = await Promise.all([fetch('/api/branches'), fetch('/api/fees')]);
  branches = await branchResponse.json();
  renderBranches();
  renderFees(await feeResponse.json());
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initSlideshow();
  initReveal();
  initBooking();
  loadData().catch((error) => console.error(error));
});
