/**
 * Korisnička podešavanja aplikacije (localStorage), primena na DOM i pomoćnici.
 */

const PES_APP_SETTINGS_STORAGE_KEY = "pesLeagueAppSettings_v1";
const PES_APP_LAST_VIEW_STORAGE_KEY = "pesAppLastView_v1";

const PES_APP_SETTINGS_DEFAULTS = {
  uiDensity: "comfortable",
  reduceMotion: "system",
  textScale: "md",
  strongFocus: false,
  largeTouch: false,
  cloudPullIntervalSec: 15,
  confirmDangerousActions: true,
  toastDurationKey: "normal",
  suppressSuccessToasts: false,
  dateFormat: "eu",
  exportLeagueSlug: "",
  language: "sr",
  startupView: "dashboard",
};

let pesAppSettingsCache = { ...PES_APP_SETTINGS_DEFAULTS };

function sanitizePesAppSettings(raw) {
  const next = {};
  if (raw && typeof raw === "object") {
    if (raw.uiDensity === "compact" || raw.uiDensity === "comfortable") {
      next.uiDensity = raw.uiDensity;
    }
    if (raw.reduceMotion === "system" || raw.reduceMotion === "on" || raw.reduceMotion === "off") {
      next.reduceMotion = raw.reduceMotion;
    }
    if (raw.textScale === "sm" || raw.textScale === "md" || raw.textScale === "lg") {
      next.textScale = raw.textScale;
    }
    next.strongFocus = Boolean(raw.strongFocus);
    next.largeTouch = Boolean(raw.largeTouch);
    const pull = Number(raw.cloudPullIntervalSec);
    if (pull === 0 || pull === 15 || pull === 30 || pull === 60) {
      next.cloudPullIntervalSec = pull;
    }
    next.confirmDangerousActions = raw.confirmDangerousActions !== false;
    if (raw.toastDurationKey === "short" || raw.toastDurationKey === "normal" || raw.toastDurationKey === "long") {
      next.toastDurationKey = raw.toastDurationKey;
    }
    next.suppressSuccessToasts = Boolean(raw.suppressSuccessToasts);
    if (raw.dateFormat === "eu" || raw.dateFormat === "iso") {
      next.dateFormat = raw.dateFormat;
    }
    next.exportLeagueSlug = String(raw.exportLeagueSlug || "").slice(0, 80);
    if (raw.language === "sr" || raw.language === "en") {
      next.language = raw.language;
    }
    const allowedStartup = new Set([
      "dashboard",
      "last",
      "players",
      "teams",
      "seasons",
      "fixtures",
      "results",
      "table",
      "rankings",
      "statistics",
      "oneVsOne",
    ]);
    if (allowedStartup.has(raw.startupView)) {
      next.startupView = raw.startupView;
    }
  }
  return next;
}

function loadPesAppSettingsFromStorage() {
  try {
    const raw = window.localStorage.getItem(PES_APP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      pesAppSettingsCache = { ...PES_APP_SETTINGS_DEFAULTS };
      return;
    }
    const parsed = JSON.parse(raw);
    pesAppSettingsCache = {
      ...PES_APP_SETTINGS_DEFAULTS,
      ...sanitizePesAppSettings(parsed),
    };
  } catch {
    pesAppSettingsCache = { ...PES_APP_SETTINGS_DEFAULTS };
  }
}

function getPesAppSettings() {
  return { ...pesAppSettingsCache };
}

function persistPesAppSettings() {
  try {
    window.localStorage.setItem(
      PES_APP_SETTINGS_STORAGE_KEY,
      JSON.stringify(pesAppSettingsCache)
    );
  } catch {
    // ignore
  }
}

function updatePesAppSettings(partial) {
  const merged = { ...pesAppSettingsCache, ...sanitizePesAppSettings(partial) };
  pesAppSettingsCache = { ...PES_APP_SETTINGS_DEFAULTS, ...merged };
  persistPesAppSettings();
  applyPesAppSettingsToDom();
  try {
    document.dispatchEvent(
      new CustomEvent("pes-app-settings-changed", { detail: getPesAppSettings() })
    );
  } catch {
    // ignore
  }
}

function getPesToastDurationMs() {
  const k = pesAppSettingsCache.toastDurationKey;
  if (k === "short") {
    return 2200;
  }
  if (k === "long") {
    return 6500;
  }
  return 4200;
}

function shouldSuppressPesSuccessToasts() {
  return pesAppSettingsCache.suppressSuccessToasts === true;
}

function getPesCloudPullIntervalMs() {
  const sec = Number(pesAppSettingsCache.cloudPullIntervalSec);
  if (!sec || sec <= 0) {
    return 0;
  }
  return sec * 1000;
}

function resolvePesReduceMotionEffective() {
  const mode = pesAppSettingsCache.reduceMotion;
  if (mode === "on") {
    return true;
  }
  if (mode === "off") {
    return false;
  }
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function applyPesAppSettingsToDom() {
  const root = document.getElementById("pes-app-root");
  const motion = resolvePesReduceMotionEffective();
  document.body.classList.toggle("pes6-setting-density-compact", pesAppSettingsCache.uiDensity === "compact");
  document.body.classList.toggle("pes6-setting-reduce-motion", motion);
  document.body.classList.remove("pes6-setting-text-sm", "pes6-setting-text-lg");
  if (pesAppSettingsCache.textScale === "sm") {
    document.body.classList.add("pes6-setting-text-sm");
  } else if (pesAppSettingsCache.textScale === "lg") {
    document.body.classList.add("pes6-setting-text-lg");
  }
  document.body.classList.toggle("pes6-setting-strong-focus", pesAppSettingsCache.strongFocus === true);
  document.body.classList.toggle("pes6-setting-large-touch", pesAppSettingsCache.largeTouch === true);

  if (root) {
    root.classList.toggle("pes6-setting-density-compact", pesAppSettingsCache.uiDensity === "compact");
  }

  document.documentElement.lang = pesAppSettingsCache.language === "en" ? "en" : "sr";
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function formatPesAppInstantInternal(isoString, variant) {
  if (!isoString) {
    return "—";
  }
  let date;
  try {
    date = new Date(isoString);
  } catch {
    return String(isoString);
  }
  if (Number.isNaN(date.getTime())) {
    return String(isoString);
  }
  const isoLike =
    pesAppSettingsCache.dateFormat === "iso"
      ? variant === "date"
        ? date.toISOString().slice(0, 10)
        : date.toISOString()
      : null;
  if (isoLike != null) {
    return isoLike;
  }
  const d = pad2(date.getDate());
  const m = pad2(date.getMonth() + 1);
  const y = date.getFullYear();
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  if (variant === "date") {
    return `${d}.${m}.${y}`;
  }
  if (variant === "csv") {
    return `${d}.${m}.${y} ${hh}:${mm}`;
  }
  return `${d}.${m}.${y}. ${hh}:${mm}`;
}

window.formatPesAppDateTimeForDisplay = function formatPesAppDateTimeForDisplay(isoString) {
  return formatPesAppInstantInternal(isoString, "datetime");
};

window.formatPesAppDateForDisplay = function formatPesAppDateForDisplay(isoString) {
  return formatPesAppInstantInternal(isoString, "date");
};

window.formatPesAppCsvDateTime = function formatPesAppCsvDateTime(isoString) {
  return formatPesAppInstantInternal(isoString, "csv");
};

function pesExportSlugSanitized() {
  return String(pesAppSettingsCache.exportLeagueSlug || "")
    .trim()
    .replace(/[^\w\-]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildPesExportCsvFilename(kind, seasonSafeName) {
  const slug = pesExportSlugSanitized();
  const lang = pesAppSettingsCache.language === "en" ? "en" : "sr";
  const part = {
    standings: lang === "en" ? "standings" : "tabela",
    rankings: lang === "en" ? "rankings" : "poredak",
    results: lang === "en" ? "results" : "rezultati",
  }[kind];
  const safe = seasonSafeName || "season";
  if (slug) {
    return `pes-${slug}-${part}-${safe}.csv`;
  }
  return `pes-${part}-${safe}.csv`;
}

function confirmPesDangerous(message) {
  if (!pesAppSettingsCache.confirmDangerousActions) {
    return true;
  }
  return window.confirm(message);
}

function rememberPesLastViewFromHash() {
  try {
    const h = window.location.hash;
    if (h && /^#\/[a-z-]+$/i.test(h)) {
      window.localStorage.setItem(PES_APP_LAST_VIEW_STORAGE_KEY, h);
    }
  } catch {
    // ignore
  }
}

function applyPesStartupViewFromSettings() {
  const sv = pesAppSettingsCache.startupView;
  const hasHash = Boolean(window.location.hash && window.location.hash.length > 2);
  if (hasHash) {
    return;
  }
  if (sv === "last") {
    try {
      const last = window.localStorage.getItem(PES_APP_LAST_VIEW_STORAGE_KEY);
      if (last && /^#\/[a-z-]+$/i.test(last)) {
        window.location.hash = last;
        return;
      }
    } catch {
      // ignore
    }
    window.location.hash = "#/dashboard";
    return;
  }
  if (sv && sv !== "dashboard") {
    window.location.hash = `#/${sv}`;
    return;
  }
  window.location.hash = "#/dashboard";
}

try {
  window
    .matchMedia("(prefers-reduced-motion: reduce)")
    .addEventListener("change", () => {
      if (pesAppSettingsCache.reduceMotion === "system") {
        applyPesAppSettingsToDom();
      }
    });
} catch {
  // older browsers
}

loadPesAppSettingsFromStorage();

window.getPesAppSettings = getPesAppSettings;
window.updatePesAppSettings = updatePesAppSettings;
window.applyPesAppSettingsToDom = applyPesAppSettingsToDom;
window.getPesToastDurationMs = getPesToastDurationMs;
window.shouldSuppressPesSuccessToasts = shouldSuppressPesSuccessToasts;
window.confirmPesDangerous = confirmPesDangerous;
window.buildPesExportCsvFilename = buildPesExportCsvFilename;
window.rememberPesLastViewFromHash = rememberPesLastViewFromHash;
window.applyPesStartupViewFromSettings = applyPesStartupViewFromSettings;
window.getPesCloudPullIntervalMs = getPesCloudPullIntervalMs;
