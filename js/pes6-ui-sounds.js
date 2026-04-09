/**
 * Kratak UI zvuk (PES6-style meni) — Web Audio API, bez eksternih fajlova.
 * Radi posle prvog klika korisnika (browser AudioContext pravilo).
 */

(function pes6UiSoundsModule() {
  const PES_UI_SOUND_ENABLED_STORAGE_KEY = "pesUiSoundEnabled_v1";
  let audioContext = null;
  let hoverThrottleAt = 0;
  const HOVER_GAP_MS = 95;
  let resumeBound = false;
  let enabled = true;

  function loadEnabledPreference() {
    try {
      const raw = window.localStorage.getItem(PES_UI_SOUND_ENABLED_STORAGE_KEY);
      if (raw === "0" || raw === "false") {
        enabled = false;
      } else if (raw === "1" || raw === "true") {
        enabled = true;
      }
    } catch {
      // ignore storage access errors
    }
  }

  function persistEnabledPreference() {
    try {
      window.localStorage.setItem(PES_UI_SOUND_ENABLED_STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // ignore storage access errors
    }
  }

  function updateSoundToggleButtonUi() {
    const button = document.getElementById("pes-ui-sound-toggle");
    if (!button) {
      return;
    }
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.textContent = enabled ? "Zvuk: ON" : "Zvuk: OFF";
  }

  function setUiSoundEnabled(nextValue) {
    enabled = Boolean(nextValue);
    persistEnabledPreference();
    updateSoundToggleButtonUi();
  }

  function isUiSoundEnabled() {
    return enabled;
  }

  function getAudioContext() {
    if (!audioContext) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        return null;
      }
      audioContext = new AC();
    }
    return audioContext;
  }

  function ensureAudioResumes() {
    if (resumeBound) {
      return;
    }
    resumeBound = true;
    const resume = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        void ctx.resume();
      }
    };
    document.body.addEventListener("click", resume, { once: true, capture: true });
    document.body.addEventListener("keydown", resume, { once: true, capture: true });
  }

  function scheduleBlip(ctx, startTime, frequencyHz, durationSec, peakGain, type) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, startTime);
    filter.Q.setValueAtTime(0.7, startTime);

    osc.type = type;
    osc.frequency.setValueAtTime(frequencyHz, startTime);

    const g0 = Math.max(peakGain, 0.0001);
    gain.gain.setValueAtTime(g0, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0008, startTime + durationSec);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + durationSec + 0.02);
  }

  function playNavHoverSound() {
    if (!enabled) {
      return;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - hoverThrottleAt < HOVER_GAP_MS) {
      return;
    }
    hoverThrottleAt = now;

    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }
    const t = ctx.currentTime;
    scheduleBlip(ctx, t, 1180, 0.038, 0.022, "square");
  }

  function playLinkHoverSound() {
    if (!enabled) {
      return;
    }
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - hoverThrottleAt < HOVER_GAP_MS) {
      return;
    }
    hoverThrottleAt = now;

    const ctx = getAudioContext();
    if (!ctx || ctx.state !== "running") {
      return;
    }
    const t = ctx.currentTime;
    scheduleBlip(ctx, t, 920, 0.045, 0.018, "triangle");
  }

  function runAfterContextRunning(ctx, fn) {
    if (!ctx) {
      return;
    }
    if (ctx.state === "running") {
      fn(ctx);
      return;
    }
    void ctx.resume().then(() => {
      if (ctx.state === "running") {
        fn(ctx);
      }
    });
  }

  function playNavClickSound() {
    if (!enabled) {
      return;
    }
    const ctx = getAudioContext();
    runAfterContextRunning(ctx, (c) => {
      const t = c.currentTime;
      scheduleBlip(c, t, 740, 0.055, 0.055, "square");
      scheduleBlip(c, t + 0.032, 1180, 0.05, 0.04, "square");
    });
  }

  function playLinkClickSound() {
    if (!enabled) {
      return;
    }
    const ctx = getAudioContext();
    runAfterContextRunning(ctx, (c) => {
      const t = c.currentTime;
      scheduleBlip(c, t, 620, 0.06, 0.045, "square");
      scheduleBlip(c, t + 0.028, 980, 0.055, 0.035, "triangle");
    });
  }

  function isExternalOrUsableLink(anchor) {
    if (!anchor || anchor.tagName !== "A") {
      return false;
    }
    const href = anchor.getAttribute("href");
    if (!href || href === "#" || href.startsWith("javascript:")) {
      return false;
    }
    return true;
  }

  window.initPes6UiSounds = function initPes6UiSounds() {
    loadEnabledPreference();
    updateSoundToggleButtonUi();
    ensureAudioResumes();

    const toggleButton = document.getElementById("pes-ui-sound-toggle");
    if (toggleButton) {
      toggleButton.addEventListener("click", () => {
        setUiSoundEnabled(!enabled);
      });
    }

    document.addEventListener(
      "mouseover",
      (event) => {
        let target = event.target;
        if (target.nodeType === Node.TEXT_NODE) {
          target = target.parentElement;
        }
        if (!(target instanceof Element)) {
          return;
        }
        const related = event.relatedTarget;

        const navBtn = target.closest("[data-pes-nav]");
        if (navBtn) {
          if (related instanceof Element && navBtn.contains(related)) {
            return;
          }
          playNavHoverSound();
          return;
        }

        const anchor = target.closest("a[href]");
        if (anchor && isExternalOrUsableLink(anchor)) {
          if (related instanceof Element && anchor.contains(related)) {
            return;
          }
          playLinkHoverSound();
        }
      },
      true
    );

    document.addEventListener(
      "click",
      (event) => {
        let target = event.target;
        if (target.nodeType === Node.TEXT_NODE) {
          target = target.parentElement;
        }
        if (!(target instanceof Element)) {
          return;
        }
        if (target.closest("[data-pes-nav]")) {
          playNavClickSound();
          return;
        }
        const anchor = target.closest("a[href]");
        if (anchor && isExternalOrUsableLink(anchor)) {
          playLinkClickSound();
        }
      },
      true
    );
  };

  window.setPes6UiSoundEnabled = setUiSoundEnabled;
  window.getPes6UiSoundEnabled = isUiSoundEnabled;
})();
