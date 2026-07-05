const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

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

function initReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => entry.isIntersecting && entry.target.classList.add('visible'));
  }, { threshold: .12 });
  qsa('.reveal').forEach((item) => observer.observe(item));
}

function branchId() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  return parts[1] || new URLSearchParams(window.location.search).get('id');
}

function renderFees(fees) {
  qs('#feeRows').innerHTML = fees.map((fee) => `
    <tr><td>${fee.level}</td><td>${money.format(fee.admissionFee)}</td><td>${money.format(fee.monthlyTuition)}</td><td>${money.format(fee.annualCharges)}</td><td>${fee.transportFee ? money.format(fee.transportFee) : 'Optional'}</td></tr>
  `).join('');
}

function renderBranch(branch) {
  document.title = `${branch.name} | Vidyarupa Discovery`;
  qs('#status').textContent = branch.admissionStatus;
  qs('#branchName').textContent = branch.name;
  qs('#branchDescription').textContent = branch.description || 'A Vidyarupa Discovery learning campus.';
  qs('#branchAddress').textContent = `${branch.address} · ${branch.phone || ''}`;
  qs('#contactButton').href = branch.phone ? `tel:${branch.phone.replace(/\s/g, '')}` : '/#booking';
  if (branch.mapUrl) {
    qs('#contactButton').insertAdjacentHTML('afterend', `<a class="btn btn-soft" href="${branch.mapUrl}" target="_blank" rel="noopener">Open Map</a>`);
  }

  const heroImages = branch.heroImages?.length ? branch.heroImages : [branch.image || '/images/campus.svg'];
  qs('#heroImages').innerHTML = heroImages.slice(0, 3).map((src, index) => `<img src="${src}" alt="${branch.name} image ${index + 1}">`).join('');
  qs('#facilityList').innerHTML = (branch.facilities || []).map((facility) => `<li>${facility}</li>`).join('');
  renderMap(branch);
  qs('#facultyCards').innerHTML = (branch.faculty || []).map((person) => `
    <article class="card facility">
      <span class="facility-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.8-4 4.4-6 8-6s6.2 2 8 6"/></svg></span>
      <h3>${person.name}</h3>
      <p class="muted"><strong>${person.role}</strong><br>${person.qualification}<br>${person.experience}</p>
    </article>
  `).join('');
  qs('#galleryImages').innerHTML = (branch.gallery || heroImages).slice(0, 3).map((src, index) => `<img src="${src}" alt="${branch.name} gallery ${index + 1}">`).join('');
}

function renderMap(branch) {
  const mapCard = qs('#mapCard');
  const mapSection = qs('#mapSection');
  if (!branch.mapUrl && !branch.mapEmbedUrl) {
    mapSection.classList.add('hidden');
    return;
  }
  const embedUrl = branch.mapEmbedUrl || `https://www.google.com/maps?q=${encodeURIComponent(`${branch.name} ${branch.address}`)}&output=embed`;
  mapCard.innerHTML = `
    <iframe class="map-frame" src="${embedUrl}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" title="${branch.name} map"></iframe>
    <div class="map-info">
      <div>
        <h3>${branch.name}</h3>
        <p class="muted">${branch.address}</p>
      </div>
      <a class="btn btn-primary" href="${branch.mapUrl || embedUrl}" target="_blank" rel="noopener">Open Exact Map</a>
    </div>
  `;
}

async function load() {
  const [branchResponse, feesResponse] = await Promise.all([fetch(`/api/branches/${branchId()}`), fetch('/api/fees')]);
  if (!branchResponse.ok) throw new Error('Branch not found.');
  renderBranch(await branchResponse.json());
  renderFees(await feesResponse.json());
}

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initReveal();
  load().catch(() => {
    qs('#branchPage').innerHTML = '<section class="section"><h1>Branch not found</h1><p class="lead">Please return to branches and choose a campus.</p><a class="btn btn-primary" href="/#branches">View Branches</a></section>';
  });
});
