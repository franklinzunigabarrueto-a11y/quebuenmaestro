// Timestamp de carga del formulario — para detectar bots que envían en milisegundos
const FORM_LOAD_TIME = Date.now();

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

  // Foto de perfil obligatoria para profesional independiente
  if (step === 1) {
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    if (tipo === 'individual' && !avatarKey) {
      document.getElementById('avatarError').classList.remove('hidden');
      document.getElementById('avatarCircle').scrollIntoView({ behavior: 'smooth', block: 'center' });
      ok = false;
    }
  }

  if (step === 2) {
    const ciudades = document.querySelectorAll('input[name="ciudades"]:checked');
    const grid = document.querySelector(".checkbox-grid");
    if (ciudades.length === 0) {
      grid.classList.add("grid-error");
      ok = false;
    } else {
      grid.classList.remove("grid-error");
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
function updateAvatarLabel(tipo) {
  const label    = document.getElementById('avatarLabel');
  const hint     = document.getElementById('avatarHint');
  const required = document.getElementById('avatarRequiredMark');
  const emptyTxt = document.getElementById('avatarEmptyText');

  if (tipo === 'empresa') {
    label.childNodes[0].textContent = 'Logo de empresa ';
    hint.textContent = 'Sube el logo de tu empresa (opcional). JPG, PNG o WEBP, máx 5MB.';
    required.classList.add('hidden');
    emptyTxt.textContent = 'Agregar logo';
  } else {
    label.childNodes[0].textContent = 'Foto de perfil ';
    hint.textContent = 'Una foto tuya genera más confianza y contactos. JPG, PNG o WEBP, máx 5MB.';
    required.classList.remove('hidden');
    emptyTxt.textContent = 'Agregar foto';
  }
}

document.querySelectorAll('input[name="tipo"]').forEach(radio => {
  radio.addEventListener("change", () => {
    const isEmpresa = radio.value === "empresa";
    document.querySelectorAll(".empresa-only").forEach(el => el.classList.toggle("hidden", !isEmpresa));
    document.querySelectorAll(".type-card").forEach(c => c.classList.remove("selected"));
    radio.closest(".type-card").classList.add("selected");
    updateAvatarLabel(radio.value);
  });
});
document.querySelector('.type-card input:checked')?.closest(".type-card").classList.add("selected");

// =============================================
// CONTADOR DE CARACTERES
// =============================================
const descTextarea = document.getElementById("descripcion");
const charCount    = document.getElementById("charCount");
if (descTextarea) {
  descTextarea.addEventListener("input", () => {
    charCount.textContent = descTextarea.value.length;
    charCount.style.color = descTextarea.value.length > 550 ? "#E8762A" : "#999";
  });
}

// =============================================
// AVATAR UPLOAD + CROP
// =============================================
let avatarKey     = null;
let avatarPromise = null;
let cropperInstance = null;

function validateImageFile(file) {
  if (!file) return 'Sin archivo';
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) return 'Solo JPG, PNG o WEBP.';
  if (file.size > 5 * 1024 * 1024) return 'La imagen supera los 5MB.';
  return null;
}

function openCropModal(file) {
  const error = validateImageFile(file);
  if (error) { alert(error); return; }

  const reader = new FileReader();
  reader.onload = e => {
    const modal    = document.getElementById('cropModal');
    const cropImg  = document.getElementById('cropImage');

    // Destruir instancia previa si existe
    if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }

    cropImg.src = e.target.result;
    modal.style.display = 'flex';

    // Init Cropper después de que la imagen cargue
    cropImg.onload = () => {
      cropperInstance = new Cropper(cropImg, {
        aspectRatio:     1,
        viewMode:        1,
        dragMode:        'move',
        autoCropArea:    0.85,
        cropBoxResizable: true,
        cropBoxMovable:  true,
        guides:          false,
        highlight:       false,
        background:      false,
        movable:         true,
        zoomable:        true,
        rotatable:       false,
      });
    };
  };
  reader.readAsDataURL(file);
}

function cancelCrop() {
  document.getElementById('cropModal').style.display = 'none';
  if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
  document.getElementById('avatarFileInput').value = '';
}

function confirmCrop() {
  if (!cropperInstance) return;

  cropperInstance.getCroppedCanvas({ width: 400, height: 400, fillColor: '#fff' })
    .toBlob(async blob => {
      document.getElementById('cropModal').style.display = 'none';
      cropperInstance.destroy();
      cropperInstance = null;

      // Preview de la imagen recortada
      const url = URL.createObjectURL(blob);
      document.getElementById('avatarPreviewImg').src = url;
      document.getElementById('avatarPreviewWrap').classList.remove('hidden');
      document.getElementById('avatarEmpty').classList.add('hidden');
      document.getElementById('avatarRemoveBtn').classList.remove('hidden');
      document.getElementById('avatarError').classList.add('hidden');

      // Subir a R2 — trackear Promise
      const fd = new FormData();
      fd.append('file', new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      avatarPromise = fetch('/api/upload', { method: 'POST', body: fd })
        .then(r => r.json())
        .then(data => { if (data.key) avatarKey = data.key; })
        .catch(() => {});
    }, 'image/jpeg', 0.92);
}

document.getElementById('avatarFileInput')?.addEventListener('change', function () {
  if (this.files[0]) openCropModal(this.files[0]);
});

// Drag & drop en la zona de avatar
const dropzone = document.getElementById('avatarDropzone');
if (dropzone) {
  dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
  dropzone.addEventListener('drop', e => {
    e.preventDefault();
    dropzone.classList.remove('drag-over');
    if (e.dataTransfer.files[0]) openCropModal(e.dataTransfer.files[0]);
  });
}

function removeAvatar() {
  avatarKey = null;
  document.getElementById('avatarPreviewImg').src = '';
  document.getElementById('avatarPreviewWrap').classList.add('hidden');
  document.getElementById('avatarEmpty').classList.remove('hidden');
  document.getElementById('avatarRemoveBtn').classList.add('hidden');
  document.getElementById('avatarFileInput').value = '';
}

// =============================================
// UPLOAD DE FOTOS DE TRABAJO → R2
// =============================================
const uploadedKeys   = {};
const uploadPromises = {};

// =============================================
// COMPRESIÓN CLIENT-SIDE (Canvas API)
// =============================================
function compressImage(file, maxDimension = 1200, quality = 0.82) {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Redimensionar si supera el máximo
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round(height * maxDimension / width);
          width  = maxDimension;
        } else {
          width  = Math.round(width * maxDimension / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob(blob => {
        resolve(new File([blob], 'foto.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', quality);
    };

    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

async function handleWorkPhoto(slot, file) {
  const error = validateImageFile(file);
  if (error) {
    showSlotError(slot, error);
    return;
  }
  clearSlotError(slot);

  // Preview inmediato
  const reader = new FileReader();
  reader.onload = e => {
    const slotEl      = document.getElementById(`slot-${slot}`);
    const preview     = slotEl.querySelector(".photo-preview");
    const placeholder = slotEl.querySelector(".photo-slot__placeholder");
    const removeBtn   = slotEl.querySelector(".photo-remove");
    preview.src = e.target.result;
    preview.classList.remove("hidden");
    placeholder.classList.add("hidden");
    removeBtn.classList.remove("hidden");
    slotEl.classList.add("has-photo");
  };
  reader.readAsDataURL(file);

  // Comprimir y subir a R2
  const uploadPromise = compressImage(file)
    .then(compressed => {
      const fd = new FormData();
      fd.append("file", compressed);
      return fetch("/api/upload", { method: "POST", body: fd });
    })
    .then(r => r.json())
    .then(data => { if (data.key) uploadedKeys[slot] = data.key; })
    .catch(() => {});
  uploadPromises[slot] = uploadPromise;
}

function showSlotError(slot, msg) {
  const slotEl = document.getElementById(`slot-${slot}`);
  slotEl.style.borderColor = '#EF4444';
  let err = slotEl.querySelector('.slot-error');
  if (!err) {
    err = document.createElement('span');
    err.className = 'slot-error';
    err.style.cssText = 'position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:0.7rem;color:#EF4444;background:rgba(255,255,255,.9);padding:2px 4px;';
    slotEl.appendChild(err);
  }
  err.textContent = msg;
  setTimeout(() => clearSlotError(slot), 3000);
}

function clearSlotError(slot) {
  const slotEl = document.getElementById(`slot-${slot}`);
  if (!slotEl) return;
  slotEl.style.borderColor = '';
  slotEl.querySelector('.slot-error')?.remove();
}

// Click (selector de archivo)
document.querySelectorAll(".photo-input").forEach(input => {
  input.addEventListener("change", function () {
    if (this.files[0]) handleWorkPhoto(this.dataset.slot, this.files[0]);
  });
});

// Drag & drop en cada slot
document.querySelectorAll(".photo-slot").forEach(slot => {
  const slotId = slot.id?.replace('slot-', '');
  if (!slotId) return;

  slot.addEventListener("dragover", e => {
    e.preventDefault();
    slot.style.borderColor = '#E8762A';
    slot.style.background  = '#FDF0E6';
  });
  slot.addEventListener("dragleave", () => {
    slot.style.borderColor = '';
    slot.style.background  = '';
  });
  slot.addEventListener("drop", e => {
    e.preventDefault();
    slot.style.borderColor = '';
    slot.style.background  = '';
    const file = e.dataTransfer.files[0];
    if (file) handleWorkPhoto(slotId, file);
  });
});

document.querySelectorAll(".photo-remove").forEach(btn => {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    const slot    = this.dataset.slot;
    const slotEl  = document.getElementById(`slot-${slot}`);
    const input   = slotEl.querySelector(".photo-input");
    const preview = slotEl.querySelector(".photo-preview");
    const placeholder = slotEl.querySelector(".photo-slot__placeholder");

    input.value      = "";
    preview.src      = "";
    preview.classList.add("hidden");
    placeholder.classList.remove("hidden");
    this.classList.add("hidden");
    slotEl.classList.remove("has-photo");
    delete uploadedKeys[slot];
  });
});

// =============================================
// SUBMIT → POST /api/register
// =============================================
document.getElementById("regForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  if (!validateStep(3)) return;

  // Validar aceptación de términos
  const termsCheckbox = document.getElementById('acceptTerms');
  const termsWrapper  = document.getElementById('termsAcceptWrapper');
  if (!termsCheckbox.checked) {
    termsWrapper.classList.add('error');
    termsWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }
  termsWrapper.classList.remove('error');

  // ── Honeypot: si está relleno, es un bot → simular éxito sin hacer nada ──
  if (document.getElementById('honeypot')?.value) {
    document.getElementById("regForm").classList.add("hidden");
    document.getElementById("regSuccess").classList.remove("hidden");
    return;
  }

  // ── Timer anti-bot: formulario completado en menos de 8 segundos = bot ──
  if (Date.now() - FORM_LOAD_TIME < 8000) {
    document.getElementById("regForm").classList.add("hidden");
    document.getElementById("regSuccess").classList.remove("hidden");
    return;
  }

  const btn = document.getElementById("submitBtn");
  btn.disabled = true;
  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> Subiendo fotos...`;

  // Esperar que todos los uploads en curso terminen antes de enviar
  const pending = [
    avatarPromise,
    ...Object.values(uploadPromises),
  ].filter(Boolean);
  if (pending.length > 0) await Promise.all(pending);

  btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0"/></svg> Publicando...`;

  // Recopilar datos del formulario
  const form = this;
  const ciudadesChecked = [...form.querySelectorAll('input[name="ciudades"]:checked')].map(c => c.value);
  const serviciosChecked = [...form.querySelectorAll('input[name="servicios"]:checked')].map(s => s.value);
  const horarioChecked = [...form.querySelectorAll('input[name="horario"]:checked')].map(h => h.value);

  const payload = {
    tipo:             form.tipo.value,
    nombre:           form.nombre.value.trim(),
    representante:    form.representante?.value.trim() || '',
    rut:              form.rut.value.trim(),
    años:             parseInt(form.años.value, 10),
    whatsapp:         form.whatsapp.value.trim(),
    email:            form.email.value.trim(),
    telefono:         form.telefono.value.trim(),
    web:              form.web.value.trim(),
    instagram:        form.instagram.value.trim(),
    facebook:         form.facebook.value.trim(),
    ciudades:         ciudadesChecked,
    viaja:            form.viaja?.checked || false,
    otra_ciudad:      form['otra-ciudad']?.value.trim() || '',
    especialidad:     form.especialidad.value,
    servicios:        serviciosChecked,
    certificaciones:  form.certificaciones.value.trim(),
    descripcion:      form.descripcion.value.trim(),
    horario:          horarioChecked,
    horario_detalle:  form['horario-detalle'].value.trim(),
    fotos:            Object.values(uploadedKeys),
    avatar:           avatarKey || null,
  };

  try {
    const res  = await fetch('/api/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Error desconocido');

    // Éxito
    form.classList.add("hidden");
    const success = document.getElementById("regSuccess");
    success.classList.remove("hidden");
    success.scrollIntoView({ behavior: "smooth" });

    // Link al preview del perfil (visible aunque esté pending)
    if (data.id) {
      const perfilLink = success.querySelector('a[href="perfil.html"]');
      if (perfilLink) perfilLink.href = `perfil.html?id=${data.id}&preview=1`;
    }

  } catch (err) {
    alert(`Hubo un error al enviar tu registro: ${err.message}\nInténtalo nuevamente.`);
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> Publicar mi perfil gratis`;
  }
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

// CSS spin keyframe
const style = document.createElement("style");
style.textContent = "@keyframes spin { to { transform: rotate(360deg); } }";
document.head.appendChild(style);
