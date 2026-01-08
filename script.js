/* Invita Premium — plantilla reusable
   - Edita config.json para personalizar (cuando uses servidor)
   - Si abres index.html con doble clic (file://), usará el JSON embebido en el HTML.
*/
const $ = (sel) => document.querySelector(sel);

function getEmbeddedConfig() {
  const el = document.getElementById("invite-config");
  if (!el) return null;
  try { return JSON.parse(el.textContent); } catch { return null; }
}

async function loadConfig() {
  const embedded = getEmbeddedConfig();
  if (embedded) return embedded;

  const res = await fetch("config.json", { cache: "no-store" });
  if (!res.ok) throw new Error("No se pudo cargar config.json");
  return await res.json();
}

function setCSSVars(palette) {
  const root = document.documentElement;
  root.style.setProperty("--blush", palette.blush);
  root.style.setProperty("--blush-deep", palette.blushDeep);
  root.style.setProperty("--gold", palette.gold);
  root.style.setProperty("--text", palette.text);
  root.style.setProperty("--muted", palette.muted);
  root.style.setProperty("--white", palette.white);
}

function buildWhatsAppLink(numberE164, prefill) {
  const digits = String(numberE164).replace(/[^\d]/g, "");
  const text = encodeURIComponent(prefill || "");
  return `https://wa.me/${digits}?text=${text}`;
}

function buildMapsLinks(query) {
  const q = encodeURIComponent(query);
  const maps = `https://www.google.com/maps/search/?api=1&query=${q}`;
  const embed = `https://www.google.com/maps?q=${q}&output=embed`;
  return { maps, embed };
}

function formatHeroDate(display, year) {
  const parts = display.replace(/\s+/g, " ").trim();
  const m = parts.match(/^(\d{1,2})\s+de\s+(.+)$/i);
  if (!m) return `${display} · ${year || ""}`.trim();
  const day = m[1];
  const month = m[2].charAt(0).toUpperCase() + m[2].slice(1);
  return `${day} · ${month} · ${year || ""}`.trim();
}

function initGallery(urls) {
  const gallery = $("#gallery");
  gallery.innerHTML = "";

  urls.forEach((url, i) => {
    const item = document.createElement("div");
    item.className = "gallery__item";
    item.setAttribute("role", "button");
    item.setAttribute("tabindex", "0");
    item.setAttribute("aria-label", `Abrir foto ${i + 1}`);

    const img = document.createElement("img");
    img.loading = "lazy";
    img.src = url;
    img.alt = `Foto ${i + 1}`;

    item.appendChild(img);
    item.addEventListener("click", () => openLightbox(url));
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") openLightbox(url);
    });

    gallery.appendChild(item);
  });
}

function openLightbox(src) {
  const lb = $("#lightbox");
  const img = $("#lightboxImg");
  img.src = src;
  lb.classList.add("show");
  lb.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}
function closeLightbox() {
  const lb = $("#lightbox");
  lb.classList.remove("show");
  lb.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function showToast(msg) {
  const toast = $("#toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 1600);
}

function initCountdown(targetISO) {
  const target = new Date(targetISO).getTime();
  const els = {
    d: $("#cdDays"),
    h: $("#cdHours"),
    m: $("#cdMins"),
    s: $("#cdSecs"),
  };

  function tick() {
    const now = Date.now();
    const diff = Math.max(0, target - now);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    els.d.textContent = String(days);
    els.h.textContent = String(hours).padStart(2, "0");
    els.m.textContent = String(mins).padStart(2, "0");
    els.s.textContent = String(secs).padStart(2, "0");

    if (diff <= 0) {
      $("#countdownHint").textContent = "¡Hoy es el gran día! ✨";
      clearInterval(timer);
    }
  }

  tick();
  const timer = setInterval(tick, 1000);
}

function initMusic(musicCfg) {
  const btn = $("#musicBtn");
  const audio = $("#bgMusic");
  if (!musicCfg?.enabled) {
    btn.style.display = "none";
    return;
  }

  audio.src = musicCfg.file;

  let isOn = false;
  function setBtnState(on) {
    isOn = on;
    btn.setAttribute("aria-label", on ? "Pausar música" : "Reproducir música");
    btn.querySelector(".label").textContent = on ? "Pausar" : "Música";
    btn.querySelector(".icon").textContent = on ? "❚❚" : "♪";
  }

  btn.addEventListener("click", async () => {
    try{
      if (!isOn) {
        await audio.play();
        setBtnState(true);
      } else {
        audio.pause();
        setBtnState(false);
      }
    } catch (e) {
      showToast("Toca de nuevo para reproducir");
    }
  });

  setBtnState(false);
}

async function main() {
  const cfg = await loadConfig();
  setCSSVars(cfg.palette);

  $("#brandText").textContent = cfg.celebrantName;

  $("#eventType").textContent = cfg.eventType;
  $("#celebrantName").textContent = cfg.celebrantName;
  $("#heroDate").textContent = formatHeroDate(cfg.eventDateDisplay, cfg.eventYearDisplay);

  $("#quoteText").textContent = cfg.quote;

  $("#dateDisplay").textContent = cfg.eventDateDisplay + (cfg.eventYearDisplay ? ` · ${cfg.eventYearDisplay}` : "");
  $("#timeDisplay").textContent = cfg.eventTimeDisplay;
  $("#venueDisplay").textContent = cfg.venueName;
  $("#dressCodeTitle").textContent = cfg.dressCodeTitle || "Vestimenta";
  $("#dressCodeText").textContent = cfg.dressCodeText;

  $("#heroImg").src = cfg.photos.hero;
  $("#editorialImg").src = cfg.photos.editorial;

  const mapsLinks = buildMapsLinks(cfg.mapsQuery);
  $("#mapsBtnTop").href = mapsLinks.maps;
  $("#mapsBtn").href = mapsLinks.maps;
  $("#mapsEmbed").src = mapsLinks.embed;

  $("#venueName").textContent = cfg.venueName;
  $("#addressLine1").textContent = cfg.addressLine1;
  $("#addressLine2").textContent = cfg.addressLine2;

  $("#copyAddressBtn").addEventListener("click", async () => {
    const full = `${cfg.venueName}, ${cfg.addressLine1}, ${cfg.addressLine2}`;
    try{
      await navigator.clipboard.writeText(full);
      showToast("Dirección copiada ✨");
    } catch (e) {
      showToast("No se pudo copiar");
    }
  });

  const wa = buildWhatsAppLink(cfg.whatsAppNumberE164, cfg.whatsAppPrefill);
  $("#rsvpBtn").href = wa;
  $("#rsvpBtnTop").href = wa;

  initGallery(cfg.photos.gallery || []);
  $("#lightboxClose").addEventListener("click", closeLightbox);
  $("#lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  initCountdown(cfg.eventDateISO);
  initMusic(cfg.music);

  $("#footerName").textContent = "Lucía & familia";
}

main().catch((err) => {
  console.error(err);
  alert("Error cargando la invitación. Tip: si abriste con doble clic, usa la versión v2 (esta) o abre con servidor local.");
});
