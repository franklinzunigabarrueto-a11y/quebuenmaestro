// =============================================
// NAVEGACIÓN ENTRE PASOS
// =============================================
let currentStep = 1;

function goToStep(step) {
  if (step > currentStep && !validateStep(currentStep)) return;

  document.getElementById(`panel-${currentStep}`).classList.remove("active");
  currentStep = step;
  document.getElementById(`panel-${step}`).classList.add("active");

  document.querySelectorAll(".reg-step").forEach(el => {
    const n = parseInt(el.dataset.step);
    el.classList.toggle("reg-step--active", n === step);
    el.classList.toggle("reg-step--done", n < step);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =============================================
// VALIDACIÓN POR PASO
// =============================================
function validateStep(step) {
  const panel = document.getElementById(`panel-${step}`);
  const required = panel.querySelectorAll("[required]");
  let ok = true;

  required.forEach(field => {
    field.classList.remove("input-error");
    if (!field.value.trim()) {
      field.classList.add("input-error");
      ok = false;
    }
  });

  if (step === 2) {
    const ciudades = document.querySelectorAll('input[name="ciudades"]:checked');
    if (ciudades.length === 0) {
      document.querySelector(".checkbox-grid").classList.add("grid-error");
      ok = false;
    } else {
      document.querySelector(".checkbox-grid").classList.remove("grid-error");
    }
  }

  if (!ok) {
    const firstError = panel.querySelector(".input-error, .grid-error");
    firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  return ok;
}

// =============================================
// TIPO: individual / empresa
// =============================================
document.querySelectorAll('input[name="tipo"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const isEmpresa = radio.value === "empresa";
    document.querySelectorAll(".empresa-only").forEach(el => el.classList.toggle("hidden", !isEmpresa));
    document.querySelectorAll(".type-card").forEach(c => c.classList.remove("selected"));
    radio.closest(".type-card").classList.add("selected");
  });
});

// Marcar el primero como seleccionado al cargar
document.querySelector('.type-card input:checked')?.closest(".type-card").classList.add("selected");

// =============================================
// CONTADOR DE CARACTERES
// =============================================
const descTextarea = document.getElementById("descripcion");
const charCount = document.getElementById("charCount");
if (descTextarea) {
  descTextarea.addEventListener("input", () => {
    charCount.textContent = descTextarea.value.length;
    charCount.style.color = descTextarea.value.length > 550 ? "#E8762A" : "#999";
  });
}

// =============================================
// UPLOAD DE FOTOS
// =============================================
document.querySelectorAll(".photo-input").forEach(input => {
  input.addEventListener("change", function () {
    const slot = this.dataset.slot;
    const file = this.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La foto supera los 5MB. Elige una imagen más pequeña.");
      this.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      const slotEl = document.getElementById(`slot-${slot}`);
      const preview = slotEl.querySelector(".photo-preview");
      const placeholder = slotEl.querySelector(".photo-slot__placeholder");
      const removeBtn = slotEl.querySelector(".photo-remove");

      preview.src = e.target.result;
      preview.classList.remove("hidden");
      placeholder.classList.add("hidden");
      removeBtn.classList.remove("hidden");
      slotEl.classList.add("has-photo");
    };
    reader.readAsDataURL(file);
  });
});

document.querySelectorAll(".photo-remove").forEach(btn => {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const slot = this.dataset.slot;
    const slotEl = document.getElementById(`slot-${slot}`);
    const input = slotEl.querySelector(".photo-input");
    const preview = slotEl.querySelector(".photo-preview");
    const placeholder = slotEl.querySelector(".photo-slot__placeholder");

    input.value = "";
    preview.src = "";
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
    this.classList.add("hidden");
    slotEl.classList.remove("has-photo");
  });
});

// =============================================
// SUBMIT
// =============================================
document.getElementById("regForm").addEventListener("submit", function (e) {
  e.preventDefault();
  if (!validateStep(3)) return;

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> Publicando...`;

  // Guardar en localStorage como demo
  const formData = new FormData(this);
  const data = {};
  for (const [k, v] of formData.entries()) {
    if (data[k]) {
      data[k] = [].concat(data[k], v);
    } else {
      data[k] = v;
    }
  }
  localStorage.setItem("qbm_perfil_draft", JSON.stringify(data));

  // Simular envío
  setTimeout(() => {
    document.getElementById("regForm").classList.add("hidden");
    document.getElementById("regSuccess").classList.remove("hidden");
    document.getElementById("regSuccess").scrollIntoView({ behavior: "smooth" });
  }, 1800);
});

// =============================================
// FORMATO RUT automático
// =============================================
document.getElementById("rut")?.addEventListener("input", function () {
  let v = this.value.replace(/[^0-9kK]/g, "");
  if (v.length > 1) v = v.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "-" + v.slice(-1);
  this.value = v;
});

// =============================================
// FORMATO WhatsApp (solo dígitos)
// =============================================
document.getElementById("whatsapp")?.addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 8);
});

// CSS spin keyframe (inyectado dinámicamente)
const style = document.createElement("style");
style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(style);
