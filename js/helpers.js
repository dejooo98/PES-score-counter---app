/**
 * Shared pure helpers (no DOM, no storage).
 */

function generateUniqueId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function shuffleArrayInPlace(array) {
  for (let index = array.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    const temporary = array[index];
    array[index] = array[randomIndex];
    array[randomIndex] = temporary;
  }
  return array;
}

function cloneDeepJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function normalizeTeamNameForComparison(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text == null ? "" : String(text);
  return div.innerHTML;
}

function formatIsoDateToDisplay(isoString) {
  if (!isoString) {
    return "—";
  }
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleString();
  } catch {
    return isoString;
  }
}

function formatDateOnly(isoString) {
  if (!isoString) {
    return "—";
  }
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
    return date.toLocaleDateString();
  } catch {
    return isoString;
  }
}

function parseNonNegativeIntegerOrNull(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  return parsed;
}

function buildCsvRow(cells) {
  return cells
    .map((cell) => {
      const text = cell == null ? "" : String(cell);
      const escaped = text.replace(/"/g, '""');
      if (/[",\n]/.test(escaped)) {
        return `"${escaped}"`;
      }
      return escaped;
    })
    .join(",");
}

function normalizeExternalImageUrl(rawUrl) {
  const initial = String(rawUrl || "").trim().replace(/^['"]|['"]$/g, "");
  if (!initial) {
    return "";
  }
  if (initial.startsWith("data:")) {
    return initial;
  }
  let value = initial.replace(/\\/g, "/");
  if (value.startsWith("/images/")) {
    value = `https://www.thesportsdb.com${value}`;
  } else if (value.startsWith("//")) {
    value = `https:${value}`;
  } else if (!/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value)) {
    if (value.startsWith("www.")) {
      value = `https://${value}`;
    } else if (/^[^\s]+\.[^\s]+/.test(value)) {
      value = `https://${value}`;
    }
  }
  value = value.replace(/^https?:\/\/https?:\/\//i, "https://");
  if (value.startsWith("http://")) {
    value = `https://${value.slice("http://".length)}`;
  }
  return sanitizeAbsoluteHttpUrl(value);
}

function normalizeWebsiteUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) {
    return "";
  }
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return sanitizeAbsoluteHttpUrl(value);
  }
  return sanitizeAbsoluteHttpUrl(`https://${value}`);
}

function sanitizeAbsoluteHttpUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }
  try {
    const parsedUrl = new URL(value);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return "";
    }
    if (!parsedUrl.hostname || parsedUrl.hostname === "localhost") {
      return "";
    }
    return parsedUrl.toString();
  } catch {
    return "";
  }
}

function extractHostnameFromUrl(rawUrl) {
  const safeUrl = sanitizeAbsoluteHttpUrl(rawUrl);
  if (!safeUrl) {
    return "";
  }
  try {
    return new URL(safeUrl).hostname || "";
  } catch {
    return "";
  }
}

function buildClearbitLogoUrlFromWebsite(websiteUrl) {
  const hostname = extractHostnameFromUrl(websiteUrl);
  if (!hostname) {
    return "";
  }
  return `https://logo.clearbit.com/${hostname}`;
}

function sanitizeLogoCandidateUrls(candidateUrls) {
  const normalized = (candidateUrls || [])
    .map((item) => normalizeExternalImageUrl(item))
    .filter((item) => Boolean(item));
  return Array.from(new Set(normalized));
}

function sanitizePlayerAvatarDataUrl(rawValue) {
  const value = String(rawValue || "").trim();
  if (!value) {
    return "";
  }
  if (!/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);/i.test(value)) {
    return "";
  }
  return value;
}

function buildDefaultPlayerAvatarDataUrl(displayName, seed) {
  const palettes = [
    ["#40567a", "#2f3e57"],
    ["#2e6f66", "#1f4f49"],
    ["#72523b", "#533b2a"],
    ["#5f4f7e", "#43385a"],
    ["#6e3f52", "#512d3c"],
    ["#36617a", "#29465a"],
  ];
  const hashSource = `${displayName || "IG"}|${seed || ""}`;
  let hash = 0;
  for (let i = 0; i < hashSource.length; i += 1) {
    hash = (hash << 5) - hash + hashSource.charCodeAt(i);
    hash |= 0;
  }
  const safeIndex = Math.abs(hash) % palettes.length;
  const palette = palettes[safeIndex];
  const initials = String(displayName || "IG")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "IG";
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="100%" stop-color="${palette[1]}"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="16" fill="url(#g)"/>
  <circle cx="64" cy="52" r="22" fill="rgba(255,255,255,0.18)"/>
  <path d="M24 112c4-20 19-33 40-33s36 13 40 33" fill="rgba(255,255,255,0.18)"/>
  <text x="64" y="118" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="22" fill="#f8f8f8" font-weight="700">${initials}</text>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolvePlayerAvatarUrl(player) {
  const explicit = sanitizePlayerAvatarDataUrl(player && player.avatarDataUrl);
  if (explicit) {
    return explicit;
  }
  const name = player ? getPlayerDisplayName(player) : "Igrac";
  const seed = player ? player.id : "";
  return buildDefaultPlayerAvatarDataUrl(name, seed);
}

function readImageFileAsAvatarDataUrl(file, maxSizePx) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (!String(file.type || "").startsWith("image/")) {
      reject(new Error("Podržane su samo image datoteke."));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Neuspešno čitanje slike."));
    reader.onload = () => {
      const source = String(reader.result || "");
      if (!source) {
        resolve("");
        return;
      }
      const image = new Image();
      image.onerror = () => reject(new Error("Neuspešno učitavanje slike."));
      image.onload = () => {
        const max = Number(maxSizePx || 192);
        const ratio = Math.min(1, max / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * ratio));
        const height = Math.max(1, Math.round(image.height * ratio));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(source);
          return;
        }
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/webp", 0.86));
      };
      image.src = source;
    };
    reader.readAsDataURL(file);
  });
}
