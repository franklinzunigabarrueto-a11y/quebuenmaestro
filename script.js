function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// =============================================
// ESTADO DE FILTROS
// =============================================
let activeSpecialty = "";
let allProfessionals = [];

// =============================================
// CARGA INICIAL DESDE API
// =============================================
async function loadProfessionals() {
  try {
    const res  = await fetch('/api/professionals');
    const data = await res.json();
    allProfessionals = data.professionals || [];
  } catch {
    // Fallback: directorio vacío si la API falla
    allProfessionals = [];
  }
  applyFilters();
}

// =============================================
// RENDER CARD
// =============================================
function renderStars(rating, count) {
  if (!count || count === 0) {
    return `<span class="pro-card__stars no-rating" title="Sin calificaciones">☆☆☆☆☆ <small>Sin calificaciones</small></span>`;
  }
  const full  = Math.round(rating);
  const stars = "★".repeat(full) + "☆".repeat(5 - full);
  return `<span class="pro-card__stars" title="${rating}/5 — ${count} reseña${count !== 1 ? 's' : ''}">${stars} <small>(${count})</small></span>`;
}

function renderCard(p) {
  const rating  = p.rating        || 0;
  const reviews = p.reviews_count || 0;

  // Avatar: foto de perfil, primera foto de trabajos, o iniciales
  const initials = p.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarSrc = p.avatar || (p.fotos && p.fotos.length > 0 ? p.fotos[0] : null);
  const avatarHtml = avatarSrc
    ? `<img src="${avatarSrc}" alt="${p.nombre}" loading="lazy" />`
    : `<div class="pro-card__avatar--initials" style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:#E8762A;background:#FDF0E6;">${initials}</div>`;

  const verifiedBadge = `
    <span class="pro-card__verified">
      <svg width="10" height="10" fill="none" stroke="#059669" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
      Verificado
    </span>`;

  const ciudades = Array.isArray(p.ciudades) ? p.ciudades : [];
  const ciudad   = ciudades[0] || '—';

  return `
    <div class="pro-card fade-up" data-specialty="${p.especialidad}" data-city="${ciudad}" data-name="${p.nombre.toLowerCase()}" data-rating="${rating}">
      <div class="pro-card__header">
        <div class="pro-card__avatar">${avatarHtml}</div>
        <div class="pro-card__info">
          <p class="pro-card__name">${esc(p.nombre)}</p>
          <p class="pro-card__type">${esc(p.tipo === 'empresa' ? 'Empresa' : p.especialidad)}</p>
          ${verifiedBadge}
        </div>
      </div>

      <span class="pro-card__specialty">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ${esc(p.especialidad)}
      </span>

      <div class="pro-card__meta">
        <div class="pro-card__meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${esc(ciudad)}
        </div>
        <div class="pro-card__meta-item pro-card__desc-wrap">
          <p class="pro-card__desc">${esc(p.descripcion)}</p>
          <button class="pro-card__vermás" onclick="openQuickView(${p.id});event.stopPropagation();">Ver más</button>
        </div>
      </div>

      <div class="pro-card__footer">
        ${renderStars(rating, reviews)}
        <a href="perfil.html?id=${p.id}" class="btn--card">Ver perfil</a>
      </div>
    </div>
  `;
}

// =============================================
// FILTROS
// =============================================
function applyFilters() {
  const text   = (document.getElementById("searchText")?.value || '').toLowerCase().trim();
  const city   = document.getElementById("searchCity")?.value || '';
  const sortBy = document.getElementById("sortBy")?.value || 'rating';

  let results = allProfessionals.filter(p => {
    const ciudades   = Array.isArray(p.ciudades) ? p.ciudades : [];
    const matchText  = !text || p.nombre.toLowerCase().includes(text) || p.especialidad.toLowerCase().includes(text) || p.descripcion.toLowerCase().includes(text);
    const matchCity  = !city || ciudades.includes(city);
    const matchSpec  = !activeSpecialty || p.especialidad === activeSpecialty;
    return matchText && matchCity && matchSpec;
  });

  if (sortBy === "name") results.sort((a, b) => a.nombre.localeCompare(b.nombre));
  if (sortBy === "city") {
    results.sort((a, b) => {
      const ca = (Array.isArray(a.ciudades) ? a.ciudades[0] : '') || '';
      const cb = (Array.isArray(b.ciudades) ? b.ciudades[0] : '') || '';
      return ca.localeCompare(cb);
    });
  }

  const grid      = document.getElementById("prosGrid");
  const noResults = document.getElementById("noResults");
  const count     = document.getElementById("resultsCount");

  if (results.length === 0) {
    grid.innerHTML = "";
    noResults.classList.remove("hidden");
    count.textContent = "Sin resultados";
  } else {
    noResults.classList.add("hidden");
    grid.innerHTML = results.map(renderCard).join("");
    count.textContent = `Mostrando ${results.length} profesional${results.length !== 1 ? "es" : ""}`;
    grid.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
  }
}

function resetFilters() {
  const searchText = document.getElementById("searchText");
  const searchCity = document.getElementById("searchCity");
  if (searchText) searchText.value = "";
  if (searchCity) searchCity.value = "";
  activeSpecialty = "";
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
  document.querySelector(".chip[data-specialty='']")?.classList.add("chip--active");
  applyFilters();
}

// =============================================
// CATEGORY CHIPS
// =============================================
document.getElementById("categoryChips")?.addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
  chip.classList.add("chip--active");
  activeSpecialty = chip.dataset.specialty;
  applyFilters();
  document.getElementById("directorio")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// =============================================
// INTERSECTION OBSERVER (fade-up)
// =============================================
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
  { threshold: 0.1 }
);

// =============================================
// NAVBAR SCROLL + FADE INFERIOR
// =============================================
const navbar   = document.querySelector(".navbar");
const pageFade = document.getElementById("pageFade");

window.addEventListener("scroll", () => {
  if (navbar) navbar.style.boxShadow = window.scrollY > 10 ? "0 4px 20px rgba(0,0,0,.1)" : "none";

  if (pageFade) {
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 60;
    pageFade.classList.toggle("hidden-fade", atBottom);
  }
}, { passive: true });

// =============================================
// INIT
// =============================================
async function loadSponsors() {
  try {
    const res  = await fetch('/api/sponsors');
    const data = await res.json();
    const list = data.sponsors || [];
    if (list.length === 0) return;

    const section = document.getElementById('auspiciadores');
    const grid    = document.getElementById('sponsorsGrid');
    grid.innerHTML = list.map(s => `
      <a class="sponsor-card" href="${s.website || '#'}" target="_blank" rel="noopener noreferrer" title="${s.nombre}">
        ${s.logo_url
          ? `<img src="${s.logo_url}" alt="${s.nombre}" class="sponsor-card__logo" />`
          : `<span class="sponsor-card__name">${s.nombre}</span>`}
        ${s.descripcion ? `<span class="sponsor-card__desc">${s.descripcion}</span>` : ''}
      </a>`).join('');
    section.style.display = 'block';
  } catch { /* silencioso */ }
}

document.addEventListener("DOMContentLoaded", () => {
  loadProfessionals();
  loadSponsors();
  document.querySelectorAll(".fade-up:not(.pro-card)").forEach(el => observer.observe(el));
});

document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "searchText") applyFilters();
});

// =============================================
// QUICK VIEW MODAL
// =============================================
function openQuickView(id) {
  const p = allProfessionals.find(x => x.id === id);
  if (!p) return;

  const ciudades = (Array.isArray(p.ciudades) ? p.ciudades : []).map(esc).join(' · ') || '—';
  const servicios = (Array.isArray(p.servicios) && p.servicios.length)
    ? p.servicios.map(s => `<span class="service-pill">${esc(s)}</span>`).join('')
    : '';

  const initials = p.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const avatarHtml = p.avatar
    ? `<img src="${esc(p.avatar)}" alt="${esc(p.nombre)}" class="qv-avatar-img" />`
    : `<div class="qv-avatar-initials">${esc(initials)}</div>`;

  const existing = document.getElementById('quickView');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'quickView';
  modal.className = 'qv-backdrop';
  modal.innerHTML = `
    <div class="qv-card" role="dialog" aria-modal="true">
      <button class="qv-close" onclick="closeQuickView()" aria-label="Cerrar">×</button>
      <div class="qv-avatar-wrap">${avatarHtml}</div>
      <h2 class="qv-name">${esc(p.nombre)}</h2>
      <p class="qv-type">${esc(p.tipo === 'empresa' ? 'Empresa' : p.especialidad)}</p>
      <div class="qv-meta">
        <svg width="14" height="14" fill="none" stroke="#E8762A" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
        ${ciudades}
      </div>
      ${servicios ? `<div class="qv-services">${servicios}</div>` : ''}
      <p class="qv-desc">${esc(p.descripcion)}</p>
      <a href="perfil.html?id=${p.id}" class="btn btn--primary" style="width:100%;justify-content:center;margin-top:4px;">Ver perfil completo →</a>
    </div>`;

  modal.addEventListener('click', e => { if (e.target === modal) closeQuickView(); });
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  requestAnimationFrame(() => modal.classList.add('qv-visible'));
}

function closeQuickView() {
  const modal = document.getElementById('quickView');
  if (!modal) return;
  modal.classList.remove('qv-visible');
  setTimeout(() => { modal.remove(); document.body.style.overflow = ''; }, 250);
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeQuickView();
});
