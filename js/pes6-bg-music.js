/**
 * Pozadinska muzika preko YouTube IFrame API (korisnikov link).
 * Nezavisno od UI „blip“ zvuka (pes6-ui-sounds.js).
 */

(function pes6BgMusicModule() {
  const STORAGE_KEY = "pesBgMusicEnabled_v1";
  const VIDEO_ID = "Z5r-u-CjYAM";
  const DEFAULT_VOLUME = 38;

  let enabled = false;
  let player = null;
  let resumeListenersBound = false;

  function loadPreference() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      enabled = raw === "1" || raw === "true";
    } catch {
      enabled = false;
    }
  }

  function savePreference() {
    try {
      window.localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {
      // ignore
    }
  }

  function updateMusicToggleButtonUi() {
    const button = document.getElementById("pes-bg-music-toggle");
    if (!button) {
      return;
    }
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    if (typeof window.t === "function") {
      button.textContent = enabled ? window.t("music.on") : window.t("music.off");
      const hint = window.t("music.ariaHint");
      if (hint && hint !== "music.ariaHint") {
        button.setAttribute("aria-label", hint);
      }
    } else {
      button.textContent = enabled ? "Muzika: ON" : "Muzika: OFF";
    }
  }

  function tryPlayIfEnabled() {
    if (!enabled || !player || typeof player.playVideo !== "function") {
      return;
    }
    try {
      player.setVolume(DEFAULT_VOLUME);
      if (typeof player.unMute === "function") {
        player.unMute();
      }
      player.playVideo();
    } catch {
      // ignore embed errors (adblock, itp.)
    }
  }

  function bindResumeOnUserGesture() {
    if (resumeListenersBound) {
      return;
    }
    resumeListenersBound = true;
    const kick = () => {
      tryPlayIfEnabled();
    };
    document.body.addEventListener("click", kick, { once: true, capture: true });
    document.body.addEventListener("keydown", kick, { once: true, capture: true });
  }

  function createYoutubePlayer() {
    if (player || typeof window.YT === "undefined" || !window.YT.Player) {
      return;
    }
    const mount = document.getElementById("pes-yt-player");
    if (!mount) {
      return;
    }
    player = new window.YT.Player("pes-yt-player", {
      videoId: VIDEO_ID,
      width: "240",
      height: "135",
      playerVars: {
        autoplay: 1,
        controls: 0,
        rel: 0,
        modestbranding: 1,
        loop: 1,
        playlist: VIDEO_ID,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          const p = event.target;
          if (!enabled) {
            try {
              if (typeof p.mute === "function") {
                p.mute();
              }
              if (typeof p.pauseVideo === "function") {
                p.pauseVideo();
              }
            } catch {
              // ignore
            }
            return;
          }
          tryPlayIfEnabled();
          bindResumeOnUserGesture();
        },
        onStateChange: (event) => {
          if (!enabled) {
            return;
          }
          const ended =
            window.YT && window.YT.PlayerState && event.data === window.YT.PlayerState.ENDED;
          if (ended) {
            tryPlayIfEnabled();
          }
        },
      },
    });
  }

  function injectIframeApi() {
    if (window.YT && window.YT.Player) {
      createYoutubePlayer();
      return;
    }
    if (document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      return;
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function pes6YouTubeIframeApiReady() {
      if (typeof prev === "function") {
        prev();
      }
      createYoutubePlayer();
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const first = document.getElementsByTagName("script")[0];
    first.parentNode.insertBefore(tag, first);
  }

  function setBgMusicEnabled(next) {
    enabled = Boolean(next);
    savePreference();
    updateMusicToggleButtonUi();
    if (!enabled) {
      try {
        if (player && typeof player.pauseVideo === "function") {
          player.pauseVideo();
        }
        if (player && typeof player.mute === "function") {
          player.mute();
        }
      } catch {
        // ignore
      }
      return;
    }
    injectIframeApi();
    if (player && typeof player.playVideo === "function") {
      tryPlayIfEnabled();
    }
    bindResumeOnUserGesture();
  }

  window.refreshPes6BgMusicLabels = updateMusicToggleButtonUi;

  window.initPes6BgMusic = function initPes6BgMusic() {
    loadPreference();
    updateMusicToggleButtonUi();
    const btn = document.getElementById("pes-bg-music-toggle");
    if (btn) {
      btn.addEventListener("click", () => {
        setBgMusicEnabled(!enabled);
      });
    }
    if (enabled) {
      injectIframeApi();
      bindResumeOnUserGesture();
    }
  };
})();
