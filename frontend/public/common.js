const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const num = n => Number(n).toLocaleString("es-AR");

// fetch que devuelve JSON o tira Error con el mensaje del backend
async function api(url, { method = "GET", body } = {}) {
  const r = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error(data.detail || "No se pudo conectar con el servidor. Probá de nuevo.");
    err.status = r.status;
    throw err;
  }
  return data;
}

const toast = Swal.mixin({ toast: true, position: "bottom", timer: 2200, showConfirmButton: false, timerProgressBar: true });

function confirmAction({ title, text, confirm }) {
  return Swal.fire({ title, text, icon: "question", showCancelButton: true, confirmButtonText: confirm, cancelButtonText: "Cancelar", reverseButtons: true })
    .then(r => r.isConfirmed);
}

function setBusy(btn, busy, label) {
  btn.disabled = busy;
  if (busy) { btn.dataset.label = btn.textContent; btn.textContent = label; }
  else if (btn.dataset.label) btn.textContent = btn.dataset.label;
}

// buscador: "/" enfoca (atajo para usuarios frecuentes)
document.addEventListener("keydown", e => {
  const q = $("q");
  if (e.key === "/" && q && document.activeElement.tagName !== "INPUT") { e.preventDefault(); q.focus(); }
});
