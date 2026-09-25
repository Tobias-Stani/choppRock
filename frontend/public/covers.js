// Tapas desde Deezer, buscadas por el navegador del cliente solo para los discos en pantalla.
// Nada se guarda en el servidor; el caché vive en memoria mientras la pestaña esté abierta.
// ponytail: Deezer cubre lo que salió en digital; vinilos raros quedan sin tapa (Discogs si hiciera falta)

const covers = new Map();   // id -> url | null (null = buscado y no encontrado)
let coverQueue = [];
const WORKERS = 3;          // Deezer permite ~50 consultas cada 5 s por IP

const norm = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\(.*?\)|\[.*?\]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

// "MURPHY, Peter" -> "Peter Murphy", "MURDER CAPITAL, The" -> "The Murder Capital",
// "X feat Y" -> "X", "MURO/VARIOUS" -> "MURO"
function cleanArtist(a) {
  a = a.split(/\s+(?:feat\.?|ft\.?|featuring)\s+/i)[0].split("/")[0].trim();
  const m = a.match(/^([^,]+),\s*([^,]+)$/);
  return m ? `${m[2]} ${m[1]}` : a;
}
const cleanTitle = t => t.replace(/\(.*?\)|\[.*?\]/g, "").split("/")[0].trim();

// una tapa equivocada es peor que ninguna: artista y título tienen que coincidir
function matches(artist, title, album) {
  const a = norm(artist), t = norm(title), da = norm(album.artist?.name), dt = norm(album.title);
  if (!a || !t || !da || !dt) return false;
  return (a.includes(da) || da.includes(a)) && (t.includes(dt) || dt.includes(t));
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const cb = "dz" + Math.random().toString(36).slice(2);
    const s = document.createElement("script");
    const done = () => { window[cb] = () => {}; s.remove(); clearTimeout(timer); };
    const timer = setTimeout(() => { done(); reject(new Error("timeout")); }, 8000);
    window[cb] = data => { done(); resolve(data); };
    s.onerror = () => { done(); reject(new Error("network")); };
    s.src = `${url}&output=jsonp&callback=${cb}`;
    document.head.append(s);
  });
}

async function findCover(d) {
  const artist = cleanArtist(d.artist), title = cleanTitle(d.title);
  const queries = [`artist:"${artist}" album:"${title}"`, `${artist} ${title}`];
  for (const q of queries) {
    const res = await jsonp(`https://api.deezer.com/search/album?limit=5&q=${encodeURIComponent(q)}`);
    if (res.error) throw new Error(res.error.message);  // límite de consultas: no cachear, se reintenta después
    const hit = (res.data || []).find(album => matches(artist, title, album));
    if (hit) return hit.cover_medium;
  }
  return null;
}

function applyCover(id) {
  const url = covers.get(id);
  if (!url) return;
  document.querySelectorAll(`[data-sleeve="${id}"]`).forEach(el => {
    const img = el.querySelector("img");
    if (img.src === url) return;
    img.onload = () => el.classList.add("has-cover");
    img.src = url;
  });
}

async function coverWorker() {
  while (coverQueue.length) {
    const d = coverQueue.shift();
    if (covers.has(d.id)) { applyCover(d.id); continue; }
    try { covers.set(d.id, await findCover(d)); applyCover(d.id); }
    catch { /* sin tapa esta vez */ }
  }
}

let coverWorkers = 0;
// llamar después de pintar la lista: reemplaza la cola con los discos en pantalla
function loadCovers(list) {
  list.forEach(d => applyCover(d.id));
  coverQueue = list.filter(d => !covers.has(d.id));
  while (coverWorkers < WORKERS && coverQueue.length) {
    coverWorkers++;
    coverWorker().finally(() => coverWorkers--);
  }
}
