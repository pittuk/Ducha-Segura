// postulacion.ts — Formulario de /instaladores (postulación de Partners).
// Valida, hace POST al backend y reemplaza el form por el bloque de confirmación.
// Se inicializa en cada astro:page-load (solo si existe el form).

const API_URL = import.meta.env.DEV
  ? 'http://localhost:8080/api/postulacion.php'
  : '/api/postulacion.php';

// Evita re-cablear listeners si init corre dos veces sobre el mismo nodo.
let _formNode: HTMLFormElement | null = null;

export function initPostulacion(): void {
  const form = document.getElementById('postulacionForm') as HTMLFormElement | null;
  if (!form || form === _formNode) return; // no estamos en /instaladores, o ya cableado
  _formNode = form;

  const errorEl = document.getElementById('postulacionError');
  const okEl = document.getElementById('postulacionOk');
  const btn = document.getElementById('postulacionSubmit') as HTMLButtonElement | null;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.style.display = 'none';

    const fd = new FormData(form);
    const payload = {
      nombre: String(fd.get('nombre') || '').trim(),
      telefono: String(fd.get('telefono') || '').trim(),
      zona: String(fd.get('zona') || '').trim(),
      actividad: String(fd.get('actividad') || ''),
      herramientas: String(fd.get('herramientas') || ''),
      experiencia: String(fd.get('experiencia') || '').trim(),
      website: String(fd.get('website') || ''),
    };

    if (!payload.nombre || !payload.telefono || !payload.zona) {
      return showError(errorEl, 'Completa tu nombre, teléfono y la ciudad o región donde operas.');
    }
    if (!['empresa', 'honorarios', 'ninguna'].includes(payload.actividad)) {
      return showError(errorEl, 'Indícanos si tienes actividad o giro iniciado.');
    }
    if (payload.herramientas !== 'si' && payload.herramientas !== 'no') {
      return showError(errorEl, 'Indícanos si cuentas con herramientas y transporte propio.');
    }

    if (btn) { btn.disabled = true; const s = btn.querySelector('span'); if (s) s.textContent = 'Enviando…'; }
    try {
      const res = await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'error');
      form.style.display = 'none';
      if (okEl) { okEl.style.display = ''; okEl.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    } catch (_) {
      showError(errorEl, 'No pudimos enviar tu postulación. Revisa tu conexión e inténtalo de nuevo.');
      if (btn) { btn.disabled = false; const s = btn.querySelector('span'); if (s) s.textContent = 'Enviar postulación'; }
    }
  });
}

function showError(el: HTMLElement | null, msg: string): void {
  if (!el) return;
  el.textContent = msg;
  el.style.display = '';
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}
