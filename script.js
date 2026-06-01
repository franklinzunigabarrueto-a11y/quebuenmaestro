// =============================================
// DATOS: Profesionales de la construcción
// =============================================
const professionals = [
  { id:1,  name:"Rodrigo Fuentes",      type:"Ingeniero Civil",           specialty:"Ingeniería Civil",          city:"Santiago",    rating:5, reviews:34, verified:true,  avatar:"https://i.pravatar.cc/100?img=11", description:"Proyectos estructurales y cálculo sísmico" },
  { id:2,  name:"Construcciones ARC",   type:"Empresa constructora",      specialty:"Constructoras",             city:"Concepción",  rating:5, reviews:82, verified:true,  avatar:null, initials:"ARC", description:"Construcción residencial e industrial" },
  { id:3,  name:"Jorge Pérez",          type:"Maestro gasfiter",          specialty:"Gasfitería",                city:"Talca",       rating:5, reviews:47, verified:true,  avatar:"https://i.pravatar.cc/100?img=52", description:"Instalaciones de agua potable y gas" },
  { id:4,  name:"Ana Vásquez",          type:"Arquitecta",                specialty:"Arquitectura",              city:"Santiago",    rating:5, reviews:61, verified:true,  avatar:"https://i.pravatar.cc/100?img=49", description:"Diseño de viviendas y remodelaciones" },
  { id:5,  name:"Carlos Muñoz",         type:"Instalador eléctrico",      specialty:"Instalaciones Eléctricas",  city:"Valparaíso",  rating:4, reviews:29, verified:true,  avatar:"https://i.pravatar.cc/100?img=33", description:"Instalaciones eléctricas residenciales y comerciales" },
  { id:6,  name:"Ingeniería Sur Ltda.", type:"Empresa de ingeniería",     specialty:"Ingeniería Civil",          city:"Temuco",      rating:5, reviews:55, verified:true,  avatar:null, initials:"IS",  description:"Inspección técnica y gestión de obras" },
  { id:7,  name:"Franco Contreras",     type:"Maestro soldador",          specialty:"Soldadura",                 city:"Concepción",  rating:4, reviews:18, verified:false, avatar:"https://i.pravatar.cc/100?img=68", description:"Soldadura MIG, TIG y estructural" },
  { id:8,  name:"Cristian Valenzuela",  type:"Inst. cámaras y seguridad", specialty:"Instalaciones Eléctricas",  city:"Santiago",    rating:5, reviews:41, verified:true,  avatar:"https://i.pravatar.cc/100?img=57", description:"CCTV, control de acceso y alarmas" },
  { id:9,  name:"Techo Sur",            type:"Empresa de techumbre",      specialty:"Techumbre",                 city:"Puerto Montt",rating:5, reviews:23, verified:true,  avatar:null, initials:"TS",  description:"Cubierta metálica, teja y pizarreño" },
  { id:10, name:"Luis González",        type:"Maestro albanil",           specialty:"Albanilería",               city:"Talca",       rating:5, reviews:38, verified:true,  avatar:"https://i.pravatar.cc/100?img=15", description:"Obras de albanilería y remodelaciones" },
  { id:11, name:"Sanitaria Norte",      type:"Empresa sanitaria",         specialty:"Instalaciones Sanitarias",  city:"Antofagasta", rating:4, reviews:14, verified:true,  avatar:null, initials:"SN",  description:"Redes de alcantarillado y agua potable" },
  { id:12, name:"Marcela Rojas",        type:"Arquitecta paisajista",     specialty:"Paisajismo",                city:"Santiago",    rating:5, reviews:27, verified:true,  avatar:"https://i.pravatar.cc/100?img=44", description:"Diseño de jardines y espacios exteriores" },
  { id:13, name:"Pinturas Rápidas SPA", type:"Empresa de pintura",        specialty:"Pintura",                   city:"Rancagua",    rating:4, reviews:33, verified:false, avatar:null, initials:"PR",  description:"Pintura interior, exterior y anticorrosiva" },
  { id:14, name:"Diego Salazar",        type:"Técnico en climatización",  specialty:"Climatización",             city:"La Serena",   rating:5, reviews:19, verified:true,  avatar:"https://i.pravatar.cc/100?img=60", description:"Instalación y mantención de sistemas AC" },
  { id:15, name:"Constructora Maipo",   type:"Constructora",              specialty:"Constructoras",             city:"Santiago",    rating:5, reviews:91, verified:true,  avatar:null, initials:"CM",  description:"Proyectos de construcción en altura y viviendas" },
];

// =============================================
// RENDER CARD
// =============================================
function renderCard(p) {
  const stars = "★".repeat(p.rating) + "☆".repeat(5 - p.rating);
  const avatarHtml = p.avatar
    ? `<img src="${p.avatar}" alt="${p.name}" loading="lazy" />`
    : `<div class="pro-card__avatar--initials" style="width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;color:#E8762A;background:#FDF0E6;">${p.initials}</div>`;

  const flowdeskBadge = `<span></span>`;

  const verifiedBadge = p.verified
    ? `<span class="pro-card__verified">
        <svg width="10" height="10" fill="none" stroke="#059669" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
        Verificado
      </span>`
    : '';

  return `
    <div class="pro-card fade-up" data-specialty="${p.specialty}" data-city="${p.city}" data-name="${p.name.toLowerCase()}" data-rating="${p.rating}">
      <div class="pro-card__header">
        <div class="pro-card__avatar">${avatarHtml}</div>
        <div class="pro-card__info">
          <p class="pro-card__name">${p.name}</p>
          <p class="pro-card__type">${p.type}</p>
          ${verifiedBadge}
        </div>
      </div>

      <span class="pro-card__specialty">
        <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        ${p.specialty}
      </span>

      <div class="pro-card__meta">
        <div class="pro-card__meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${p.city}
        </div>
        <div class="pro-card__meta-item">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          ${p.description}
        </div>
      </div>

      <div class="pro-card__footer">
        <span class="pro-card__stars" title="${p.rating}/5 — ${p.reviews} reseñas">${stars} <small style="color:#999;font-size:.75rem;font-style:normal;">(${p.reviews})</small></span>
        <a href="perfil.html" class="btn--card">Ver perfil</a>
      </div>
    </div>
  `;
}

// =============================================
// FILTROS
// =============================================
let activeSpecialty = "";

function applyFilters() {
  const text     = document.getElementById("searchText").value.toLowerCase().trim();
  const city     = document.getElementById("searchCity").value;
  const spec     = activeSpecialty;
  const sortBy   = document.getElementById("sortBy").value;

  let results = professionals.filter(p => {
    const matchText = !text || p.name.toLowerCase().includes(text) || p.specialty.toLowerCase().includes(text) || p.description.toLowerCase().includes(text);
    const matchCity = !city || p.city === city;
    const matchSpec = !spec || p.specialty === spec;
    return matchText && matchCity && matchSpec;
  });

  // Sort
  if (sortBy === "rating") results.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  if (sortBy === "name")   results.sort((a, b) => a.name.localeCompare(b.name));
  if (sortBy === "city")   results.sort((a, b) => a.city.localeCompare(b.city));

  const grid = document.getElementById("prosGrid");
  const noResults = document.getElementById("noResults");
  const count = document.getElementById("resultsCount");

  if (results.length === 0) {
    grid.innerHTML = "";
    noResults.classList.remove("hidden");
    count.textContent = "Sin resultados";
  } else {
    noResults.classList.add("hidden");
    grid.innerHTML = results.map(renderCard).join("");
    count.textContent = `Mostrando ${results.length} profesional${results.length !== 1 ? "es" : ""}`;
    // Re-observe new cards
    grid.querySelectorAll(".fade-up").forEach(el => observer.observe(el));
  }
}

function resetFilters() {
  document.getElementById("searchText").value = "";
  document.getElementById("searchCity").value = "";
  document.getElementById("searchSpecialty").value = "";
  activeSpecialty = "";
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
  document.querySelector(".chip[data-specialty='']").classList.add("chip--active");
  activeSpecialty = "";
  applyFilters();
}

// =============================================
// CATEGORY CHIPS
// =============================================
document.getElementById("categoryChips").addEventListener("click", e => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach(c => c.classList.remove("chip--active"));
  chip.classList.add("chip--active");
  activeSpecialty = chip.dataset.specialty;
  applyFilters();
  document.getElementById("directorio").scrollIntoView({ behavior: "smooth", block: "start" });
});

// =============================================
// INTERSECTION OBSERVER (fade-up)
// =============================================
const observer = new IntersectionObserver(
  entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); } }),
  { threshold: 0.1 }
);

// =============================================
// COUNTER ANIMATION
// =============================================
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1400;
  const start = performance.now();
  function update(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.floor(ease * target);
    if (t < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

const statsObserver = new IntersectionObserver(
  entries => entries.forEach(e => {
    if (e.isIntersecting) { animateCounter(e.target); statsObserver.unobserve(e.target); }
  }),
  { threshold: 0.5 }
);
document.querySelectorAll(".stat__num").forEach(el => statsObserver.observe(el));

// =============================================
// NAVBAR SCROLL
// =============================================
const navbar = document.querySelector(".navbar");
window.addEventListener("scroll", () => {
  navbar.style.boxShadow = window.scrollY > 10 ? "0 4px 20px rgba(0,0,0,.1)" : "none";
}, { passive: true });

// =============================================
// INIT
// =============================================
document.addEventListener("DOMContentLoaded", () => {
  applyFilters();
  document.querySelectorAll(".fade-up:not(.pro-card)").forEach(el => observer.observe(el));
});

// Enter key on search
document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.target.id === "searchText") applyFilters();
});
