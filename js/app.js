/**
 * Application wiring: navigation, forms, and delegation to domain + persistence.
 */

let pesLeagueCloudPullIntervalId = null;
let pesLastVisibilityCloudPullAt = 0;
let pesDiscoveredTeamsFromApi = [];
const PES_WIKIPEDIA_LOGO_CACHE = {};

const PES_TEAM_DISCOVERY_LEAGUES = [
  "English Premier League",
  "Spanish La Liga",
  "Italian Serie A",
  "German Bundesliga",
  "French Ligue 1",
  "UEFA Champions League",
  "Serbian SuperLiga",
  "Portuguese Primeira Liga",
  "Dutch Eredivisie",
  "Turkish Super Lig",
];

function applyPesLeagueStateAndRefresh(nextState) {
  replacePesLeagueApplicationState(nextState);
  refreshEntireUi();
  refreshCloudSyncStatusUi();
}

function openPlayerModal(playerId) {
  const state = getPesLeagueApplicationState();
  const player = findPlayerById(state, playerId);
  if (!player) {
    return;
  }
  const modal = document.getElementById("pes-player-modal");
  document.getElementById("pes-edit-player-id").value = player.id;
  document.getElementById("pes-edit-player-first-name").value = player.firstName;
  document.getElementById("pes-edit-player-last-name").value =
    player.lastNameOrNickname || "";
  const editAvatarInput = document.getElementById("pes-edit-player-avatar");
  if (editAvatarInput) {
    editAvatarInput.value = "";
  }
  refreshTeamSelectElements();
  const teamSelect = document.getElementById("pes-edit-player-team");
  if (teamSelect) {
    teamSelect.value = player.teamId;
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closePlayerModal() {
  const modal = document.getElementById("pes-player-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function openTeamModal(teamId) {
  const state = getPesLeagueApplicationState();
  const team = findTeamById(state, teamId);
  if (!team) {
    return;
  }
  const modal = document.getElementById("pes-team-modal");
  document.getElementById("pes-edit-team-id").value = team.id;
  document.getElementById("pes-edit-team-name").value = team.name;
  document.getElementById("pes-edit-team-logo").value = team.logoUrl || "";
  document.getElementById("pes-edit-team-league").value = team.league || "";
  document.getElementById("pes-edit-team-country").value = team.country || "";
  document.getElementById("pes-edit-team-stadium").value = team.stadium || "";
  document.getElementById("pes-edit-team-founded").value = team.foundedYear || "";
  document.getElementById("pes-edit-team-website").value = team.website || "";
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeTeamModal() {
  const modal = document.getElementById("pes-team-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function navigateToView(viewId) {
  window.location.hash = `#/${viewId}`;
}

function handleHashChange() {
  refreshEntireUi();
}

function refreshCloudSyncStatusUi() {
  const pill = document.getElementById("pes-cloud-status-pill");
  if (!pill) {
    return;
  }
  if (!isPesLeagueCloudSyncEnabled()) {
    pill.className =
      "rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-600";
    pill.textContent = t("cloud.pillOffline");
    return;
  }
  const updatedAt = getPesLeagueLastCloudUpdatedAt();
  pill.className =
    "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700";
  pill.textContent = updatedAt
    ? t("cloud.pillOnTime", { time: new Date(updatedAt).toLocaleTimeString() })
    : t("cloud.pillOn");
}

function closeHeaderMobileMenu() {
  const panel = document.getElementById("pes-header-tools-panel");
  const toggle = document.getElementById("pes-header-menu-toggle");
  const backdrop = document.getElementById("pes-header-menu-backdrop");
  if (panel) {
    panel.classList.remove("pes6-header-tools-panel--open");
  }
  if (toggle) {
    toggle.classList.remove("pes6-header-menu-btn--open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", t("header.menuOpen"));
  }
  if (backdrop) {
    backdrop.classList.add("hidden");
    backdrop.setAttribute("aria-hidden", "true");
  }
  document.body.classList.remove("pes6-header-menu-locked");
}

function setHeaderMobileMenuOpen(open) {
  const panel = document.getElementById("pes-header-tools-panel");
  const toggle = document.getElementById("pes-header-menu-toggle");
  const backdrop = document.getElementById("pes-header-menu-backdrop");
  if (!panel || !toggle) {
    return;
  }
  if (window.matchMedia("(min-width: 640px)").matches) {
    closeHeaderMobileMenu();
    return;
  }
  if (open) {
    panel.classList.add("pes6-header-tools-panel--open");
    toggle.classList.add("pes6-header-menu-btn--open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", t("header.menuClose"));
    if (backdrop) {
      backdrop.classList.remove("hidden");
      backdrop.setAttribute("aria-hidden", "false");
    }
    document.body.classList.add("pes6-header-menu-locked");
    return;
  }
  closeHeaderMobileMenu();
}

function bindHeaderMobileMenu() {
  const toggle = document.getElementById("pes-header-menu-toggle");
  const backdrop = document.getElementById("pes-header-menu-backdrop");
  const panel = document.getElementById("pes-header-tools-panel");
  if (!toggle || !panel) {
    return;
  }
  toggle.addEventListener("click", () => {
    const nextOpen = !panel.classList.contains("pes6-header-tools-panel--open");
    setHeaderMobileMenuOpen(nextOpen);
  });
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeHeaderMobileMenu();
    });
  }
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      const appModal = document.getElementById("pes-app-settings-modal");
      if (appModal && appModal.classList.contains("flex")) {
        closeAppSettingsModal();
        return;
      }
      closeHeaderMobileMenu();
    }
  });
  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 640px)").matches) {
      closeHeaderMobileMenu();
    }
  });
  const seasonSelect = document.getElementById("pes-global-season-select");
  if (seasonSelect) {
    seasonSelect.addEventListener("change", () => {
      closeHeaderMobileMenu();
    });
  }
}

function syncAppSettingsFormFromState() {
  const s = window.getPesAppSettings();
  const setVal = (id, value) => {
    const el = document.getElementById(id);
    if (el) {
      el.value = value;
    }
  };
  setVal("pes-app-set-density", s.uiDensity);
  setVal("pes-app-set-motion", s.reduceMotion);
  setVal("pes-app-set-text", s.textScale);
  setVal("pes-app-set-cloud-pull", String(s.cloudPullIntervalSec));
  setVal("pes-app-set-toast-dur", s.toastDurationKey);
  setVal("pes-app-set-date", s.dateFormat);
  setVal("pes-app-set-slug", s.exportLeagueSlug);
  setVal("pes-app-set-lang", s.language);
  setVal("pes-app-set-startup", s.startupView);
  const strong = document.getElementById("pes-app-set-strong-focus");
  if (strong) {
    strong.checked = Boolean(s.strongFocus);
  }
  const touch = document.getElementById("pes-app-set-large-touch");
  if (touch) {
    touch.checked = Boolean(s.largeTouch);
  }
  const confirmEl = document.getElementById("pes-app-set-confirm");
  if (confirmEl) {
    confirmEl.checked = s.confirmDangerousActions !== false;
  }
  const hideSucc = document.getElementById("pes-app-set-hide-success");
  if (hideSucc) {
    hideSucc.checked = Boolean(s.suppressSuccessToasts);
  }
}

function openAppSettingsModal() {
  closeHeaderMobileMenu();
  const cloudModal = document.getElementById("pes-cloud-modal");
  if (cloudModal) {
    cloudModal.classList.add("hidden");
    cloudModal.classList.remove("flex");
  }
  syncAppSettingsFormFromState();
  applyPesI18nToDocument();
  const modal = document.getElementById("pes-app-settings-modal");
  if (!modal) {
    return;
  }
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeAppSettingsModal() {
  const modal = document.getElementById("pes-app-settings-modal");
  if (!modal) {
    return;
  }
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function bindAppSettingsModal() {
  const openBtn = document.getElementById("pes-app-settings-open");
  const modal = document.getElementById("pes-app-settings-modal");
  const closeBtn = document.getElementById("pes-app-settings-modal-close");
  const form = document.getElementById("pes-app-settings-form");
  if (!openBtn || !modal || !form) {
    return;
  }
  openBtn.addEventListener("click", () => {
    openAppSettingsModal();
  });
  const close = () => {
    closeAppSettingsModal();
  };
  if (closeBtn) {
    closeBtn.addEventListener("click", close);
  }
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      close();
    }
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.updatePesAppSettings({
      uiDensity: document.getElementById("pes-app-set-density").value,
      reduceMotion: document.getElementById("pes-app-set-motion").value,
      textScale: document.getElementById("pes-app-set-text").value,
      strongFocus: document.getElementById("pes-app-set-strong-focus").checked,
      largeTouch: document.getElementById("pes-app-set-large-touch").checked,
      cloudPullIntervalSec: Number.parseInt(
        document.getElementById("pes-app-set-cloud-pull").value,
        10
      ),
      confirmDangerousActions: document.getElementById("pes-app-set-confirm").checked,
      toastDurationKey: document.getElementById("pes-app-set-toast-dur").value,
      suppressSuccessToasts: document.getElementById("pes-app-set-hide-success").checked,
      dateFormat: document.getElementById("pes-app-set-date").value,
      exportLeagueSlug: String(document.getElementById("pes-app-set-slug").value || "").trim(),
      language: document.getElementById("pes-app-set-lang").value,
      startupView: document.getElementById("pes-app-set-startup").value,
    });
    close();
    showToastMessage(t("toast.settingsSaved"), "success", true);
  });
}

function openCloudModal() {
  closeHeaderMobileMenu();
  closeAppSettingsModal();
  const settings = getPesLeagueCloudSettings();
  const leagueEl = document.getElementById("pes-cloud-league-id");
  const introSimple = document.getElementById("pes-cloud-intro-simple");
  const introPresetMissing = document.getElementById("pes-cloud-intro-preset-missing");
  const submitBtn = document.getElementById("pes-cloud-submit");

  leagueEl.value = settings.leagueId;

  const presetOk = isPesCloudPresetComplete();
  if (presetOk) {
    introSimple.classList.remove("hidden");
    introPresetMissing.classList.add("hidden");
  } else {
    introSimple.classList.add("hidden");
    introPresetMissing.classList.remove("hidden");
  }
  if (submitBtn) {
    submitBtn.disabled = !presetOk;
  }

  const modal = document.getElementById("pes-cloud-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeCloudModal() {
  const modal = document.getElementById("pes-cloud-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function restartCloudPullLoop() {
  if (pesLeagueCloudPullIntervalId) {
    window.clearInterval(pesLeagueCloudPullIntervalId);
    pesLeagueCloudPullIntervalId = null;
  }
  if (!isPesLeagueCloudSyncEnabled()) {
    return;
  }
  const ms =
    typeof window.getPesCloudPullIntervalMs === "function"
      ? window.getPesCloudPullIntervalMs()
      : 3600000;
  if (!ms || ms <= 0) {
    return;
  }
  pesLeagueCloudPullIntervalId = window.setInterval(async () => {
    const result = await pullCloudStateIfNewerAndReplaceLocal();
    if (result.ok && result.changed) {
      refreshEntireUi();
      refreshCloudSyncStatusUi();
      showToastMessage(t("toast.cloudPulled"), "success");
    }
  }, ms);
}

function runCloudPullAfterTabVisible() {
  if (!isPesLeagueCloudSyncEnabled()) {
    return;
  }
  const intervalMs =
    typeof window.getPesCloudPullIntervalMs === "function"
      ? window.getPesCloudPullIntervalMs()
      : 0;
  if (!intervalMs || intervalMs <= 0) {
    return;
  }
  const now = Date.now();
  if (now - pesLastVisibilityCloudPullAt < 45000) {
    return;
  }
  pesLastVisibilityCloudPullAt = now;
  void (async () => {
    const result = await pullCloudStateIfNewerAndReplaceLocal();
    if (result.ok && result.changed) {
      refreshEntireUi();
      refreshCloudSyncStatusUi();
      showToastMessage(t("toast.cloudPulled"), "success");
    } else if (result.ok) {
      refreshCloudSyncStatusUi();
    }
  })();
}

function bindVisibilityCloudPull() {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    runCloudPullAfterTabVisible();
  });
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      runCloudPullAfterTabVisible();
    }
  });
}

function downloadTextFile(filename, text, mimeType) {
  const blob = new Blob([text], { type: mimeType || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function buildStandingsCsvForSeason(state, seasonId) {
  const standings = calculateStandingsForSeason(state, seasonId);
  const header = [
    "position",
    "player",
    "team",
    "played",
    "wins",
    "draws",
    "losses",
    "goalsFor",
    "goalsAgainst",
    "goalDifference",
    "points",
  ];
  const lines = [buildCsvRow(header)];
  for (const row of standings) {
    const player = findPlayerById(state, row.playerId);
    const team = player ? findTeamById(state, player.teamId) : null;
    lines.push(
      buildCsvRow([
        row.position,
        player ? getPlayerDisplayName(player) : "",
        team ? team.name : "",
        row.played,
        row.wins,
        row.draws,
        row.losses,
        row.goalsFor,
        row.goalsAgainst,
        row.goalDifference,
        row.points,
      ])
    );
  }
  return lines.join("\n");
}

function buildResultsCsvForSeason(state, seasonId) {
  const matches = listMatchesForSeason(state, seasonId);
  const header = [
    "round",
    "homePlayer",
    "awayPlayer",
    "homeTeam",
    "awayTeam",
    "status",
    "homeScore",
    "awayScore",
    "playedAt",
  ];
  const lines = [buildCsvRow(header)];
  for (const match of matches) {
    const homePlayer = findPlayerById(state, match.homePlayerId);
    const awayPlayer = findPlayerById(state, match.awayPlayerId);
    const homeTeam = findTeamById(state, match.homeTeamId);
    const awayTeam = findTeamById(state, match.awayTeamId);
    lines.push(
      buildCsvRow([
        match.round,
        homePlayer ? getPlayerDisplayName(homePlayer) : "",
        awayPlayer ? getPlayerDisplayName(awayPlayer) : "",
        homeTeam ? homeTeam.name : "",
        awayTeam ? awayTeam.name : "",
        match.status,
        match.homeScore != null ? match.homeScore : "",
        match.awayScore != null ? match.awayScore : "",
        match.playedAt
          ? typeof window.formatPesAppCsvDateTime === "function"
            ? window.formatPesAppCsvDateTime(match.playedAt)
            : match.playedAt
          : "",
      ])
    );
  }
  return lines.join("\n");
}

function bindNavigationButtons() {
  const buttons = document.querySelectorAll("[data-pes-nav]");
  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const viewId = button.getAttribute("data-pes-nav");
      navigateToView(viewId);
    });
  });
}

function bindGlobalSeasonSelect() {
  const select = document.getElementById("pes-global-season-select");
  if (!select) {
    return;
  }
  select.addEventListener("change", () => {
    setSelectedSeasonIdToSession(select.value || null);
    refreshEntireUi();
  });
}

function bindFixtureFilterDelegation() {
  document.body.addEventListener("change", (event) => {
    const target = event.target;
    if (!target || !target.id) {
      return;
    }
    if (
      target.id === "pes-fixture-round-filter" ||
      target.id === "pes-fixture-unplayed-only"
    ) {
      refreshEntireUi();
    }
  });
}

function bindPlayerSearchInput() {
  const input = document.getElementById("pes-player-search-input");
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    const state = getPesLeagueApplicationState();
    renderPlayersView(state);
  });
}

function isPesKeyboardTypingTarget(node) {
  if (!node || typeof node !== "object") {
    return false;
  }
  const tag = node.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }
  try {
    if (node.isContentEditable) {
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

function isAnyPesDialogOpen() {
  return ["pes-app-settings-modal", "pes-cloud-modal", "pes-player-modal", "pes-team-modal"].some(
    (id) => {
      const el = document.getElementById(id);
      return el && el.classList.contains("flex");
    }
  );
}

function focusPesPlayerSearchInput() {
  const input = document.getElementById("pes-player-search-input");
  if (!input) {
    return;
  }
  input.focus();
  if (typeof input.select === "function" && input.type !== "number") {
    try {
      input.select();
    } catch {
      // ignore
    }
  }
}

function bindGlobalPlayerSearchShortcut() {
  window.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) {
      return;
    }
    if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }
    if (isPesKeyboardTypingTarget(event.target)) {
      return;
    }
    if (isAnyPesDialogOpen()) {
      return;
    }
    event.preventDefault();
    closeHeaderMobileMenu();
    const viewId = typeof getViewIdFromHash === "function" ? getViewIdFromHash() : "dashboard";
    if (viewId !== "players") {
      navigateToView("players");
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          focusPesPlayerSearchInput();
        });
      });
      return;
    }
    focusPesPlayerSearchInput();
  });
}

function bindForms() {
  const addTeamForm = document.getElementById("pes-add-team-form");
  if (addTeamForm) {
    addTeamForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(addTeamForm);
      const state = getPesLeagueApplicationState();
      const result = addTeamToState(
        state,
        formData.get("name"),
        formData.get("logoUrl"),
        {
          league: formData.get("league"),
          country: formData.get("country"),
          stadium: formData.get("stadium"),
          foundedYear: formData.get("foundedYear"),
          website: formData.get("website"),
        }
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      addTeamForm.reset();
      showToastMessage(t("toast.teamSaved"), "success");
    });
  }

  const addPlayerForm = document.getElementById("pes-add-player-form");
  if (addPlayerForm) {
    addPlayerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(addPlayerForm);
      const state = getPesLeagueApplicationState();
      const chosenExistingId = String(formData.get("existingTeamId") || "").trim();
      const newTeamName = String(formData.get("newTeamName") || "").trim();
      let avatarDataUrl = "";
      try {
        const avatarInput = document.getElementById("pes-player-avatar-file");
        const file =
          avatarInput && avatarInput.files && avatarInput.files[0]
            ? avatarInput.files[0]
            : null;
        avatarDataUrl = await readImageFileAsAvatarDataUrl(file, 192);
      } catch (error) {
        showToastMessage(
          t("toast.avatarError", {
            detail: error instanceof Error ? error.message : t("discovery.unknownErr"),
          }),
          "error"
        );
        return;
      }
      const result = addPlayerWithTeamChoice(
        state,
        formData.get("firstName"),
        formData.get("lastNameOrNickname"),
        chosenExistingId || null,
        chosenExistingId ? "" : newTeamName,
        avatarDataUrl
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      addPlayerForm.reset();
      showToastMessage(t("toast.playerSaved"), "success");
    });
  }

  const createSeasonForm = document.getElementById("pes-create-season-form");
  if (createSeasonForm) {
    createSeasonForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("pes-season-name").value;
      const select = document.getElementById("pes-season-participant-ids");
      const selectedIds = Array.from(select.selectedOptions).map(
        (option) => option.value
      );
      if (selectedIds.length < 2) {
        showToastMessage(t("toast.playerNeedsTeam"), "error");
        return;
      }
      const state = getPesLeagueApplicationState();
      const result = createDraftSeasonInState(state, name, selectedIds);
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      createSeasonForm.reset();
      showToastMessage(t("toast.seasonDraft"), "success");
    });
  }

  const editPlayerForm = document.getElementById("pes-edit-player-form");
  if (editPlayerForm) {
    editPlayerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const playerId = document.getElementById("pes-edit-player-id").value;
      const teamId = document.getElementById("pes-edit-player-team").value;
      const state = getPesLeagueApplicationState();
      const existingPlayer = findPlayerById(state, playerId);
      let avatarDataUrl = existingPlayer ? existingPlayer.avatarDataUrl || "" : "";
      try {
        const avatarInput = document.getElementById("pes-edit-player-avatar");
        const file =
          avatarInput && avatarInput.files && avatarInput.files[0]
            ? avatarInput.files[0]
            : null;
        if (file) {
          avatarDataUrl = await readImageFileAsAvatarDataUrl(file, 192);
        }
      } catch (error) {
        showToastMessage(
          t("toast.avatarError", {
            detail: error instanceof Error ? error.message : t("discovery.unknownErr"),
          }),
          "error"
        );
        return;
      }
      const result = updatePlayerInState(
        state,
        playerId,
        document.getElementById("pes-edit-player-first-name").value,
        document.getElementById("pes-edit-player-last-name").value,
        teamId,
        avatarDataUrl
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      closePlayerModal();
      showToastMessage(t("toast.playerUpdated"), "success");
    });
  }

  const editTeamForm = document.getElementById("pes-edit-team-form");
  if (editTeamForm) {
    editTeamForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const teamId = document.getElementById("pes-edit-team-id").value;
      const state = getPesLeagueApplicationState();
      const result = updateTeamInState(
        state,
        teamId,
        document.getElementById("pes-edit-team-name").value,
        document.getElementById("pes-edit-team-logo").value,
        {
          league: document.getElementById("pes-edit-team-league").value,
          country: document.getElementById("pes-edit-team-country").value,
          stadium: document.getElementById("pes-edit-team-stadium").value,
          foundedYear: document.getElementById("pes-edit-team-founded").value,
          website: document.getElementById("pes-edit-team-website").value,
        }
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      closeTeamModal();
      showToastMessage(t("toast.teamUpdated"), "success");
    });
  }

  const oneVsOneForm = document.getElementById("pes-one-vs-one-form");
  if (oneVsOneForm) {
    oneVsOneForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(oneVsOneForm);
      const state = getPesLeagueApplicationState();
      const discipline = parseMatchDisciplineFromResultForm(oneVsOneForm);
      const result = recordOneVsOneMatchInState(
        state,
        formData.get("homePlayerId"),
        formData.get("awayPlayerId"),
        formData.get("homeScore"),
        formData.get("awayScore"),
        discipline
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      oneVsOneForm.reset();
      showToastMessage(t("toast.oneVsOneSaved"), "success");
    });
  }
}

function setTeamDiscoveryStatus(message, isError) {
  const statusElement = document.getElementById("pes-team-discovery-status");
  if (!statusElement) {
    return;
  }
  statusElement.textContent = message || "";
  statusElement.className = `mt-3 text-xs font-medium ${
    isError ? "text-rose-600" : "text-slate-500"
  }`;
}

function renderDiscoveredTeamResults(teams) {
  const root = document.getElementById("pes-team-discovery-results");
  if (!root) {
    return;
  }
  if (!Array.isArray(teams) || teams.length === 0) {
    root.innerHTML =
      '<div class="rounded-lg bg-white p-3 text-sm text-slate-500">Nema rezultata.</div>';
    return;
  }
  root.innerHTML = teams
    .map((team, index) => {
      const candidateUrls = sanitizeLogoCandidateUrls(
        []
          .concat(team.logoUrl ? [team.logoUrl] : [])
          .concat(team.logoCandidates || [])
          .concat(team.website ? [buildClearbitLogoUrlFromWebsite(team.website)] : [])
      );
      const normalizedLogoUrl = candidateUrls[0] || "";
      const fallbackLogoUrls = candidateUrls.slice(1);
      const initials = escapeHtml(String(team.name || "TM").slice(0, 2).toUpperCase());
      const logo = normalizedLogoUrl
        ? `<div class="relative h-8 w-8">
            <img
              src="${escapeHtml(normalizedLogoUrl)}"
              data-fallback-list="${escapeHtml(fallbackLogoUrls.join("||"))}"
              alt=""
              class="h-8 w-8 rounded object-cover"
              onerror="
                const list = (this.dataset.fallbackList || '').split('||').filter(Boolean);
                if (list.length > 0) {
                  const nextSrc = list.shift();
                  this.dataset.fallbackList = list.join('||');
                  this.src = nextSrc;
                  return;
                }
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
              "
            />
            <div class="hidden h-8 w-8 items-center justify-center rounded bg-slate-200 text-[10px] font-semibold text-slate-600">${initials}</div>
          </div>`
        : `<div class="flex h-8 w-8 items-center justify-center rounded bg-slate-200 text-[10px] font-semibold text-slate-600">${initials}</div>`;
      return `
      <div class="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-2">
        <div class="flex min-w-0 items-center gap-3">
          ${logo}
          <div class="min-w-0">
            <div class="truncate text-sm font-medium text-slate-800">${escapeHtml(team.name)}</div>
            <div class="truncate text-xs text-slate-500">${escapeHtml(team.league || "Liga nepoznata")} · ${escapeHtml(team.country || "—")}</div>
            <div class="truncate text-xs text-slate-400">${escapeHtml(team.stadium || "Stadion nepoznat")}${team.foundedYear ? ` · osn. ${escapeHtml(team.foundedYear)}` : ""}</div>
          </div>
        </div>
        <button
          type="button"
          class="pes-add-discovered-team rounded-lg bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
          data-discovered-index="${index}"
        >
          Dodaj
        </button>
      </div>
    `;
    })
    .join("");
}

function mapApiTeamToLocalModel(apiTeam) {
  const website = normalizeWebsiteUrl(apiTeam.strWebsite);
  const badgeCandidates = [
    apiTeam.strTeamBadge,
    apiTeam.strBadge,
    apiTeam.strLogo,
    apiTeam.strTeamLogo,
    apiTeam.strTeamJersey,
    apiTeam.strTeamFanart1,
  ];
  const constructedByIdCandidates = [
    apiTeam.idTeam ? `https://www.thesportsdb.com/images/media/team/badge/${apiTeam.idTeam}.png` : "",
    apiTeam.idTeam ? `https://www.thesportsdb.com/images/media/team/logo/${apiTeam.idTeam}.png` : "",
    apiTeam.idTeam ? `https://www.thesportsdb.com/images/media/team/badge/${apiTeam.idTeam}.jpg` : "",
  ];
  const logoCandidates = sanitizeLogoCandidateUrls(
    []
      .concat(badgeCandidates)
      .concat(constructedByIdCandidates)
      .concat(website ? [buildClearbitLogoUrlFromWebsite(website)] : [])
  );
  const badgeUrl = logoCandidates[0] || "";
  return {
    id: String(apiTeam.idTeam || ""),
    name: String(apiTeam.strTeam || "").trim(),
    league: String(apiTeam.strLeague || "").trim(),
    country: String(apiTeam.strCountry || "").trim(),
    logoUrl: sanitizeAbsoluteHttpUrl(badgeUrl),
    logoCandidates,
    stadium: String(apiTeam.strStadium || "").trim(),
    foundedYear: String(apiTeam.intFormedYear || "").trim(),
    website,
  };
}

async function fetchWikipediaTeamLogoUrl(teamName) {
  const cacheKey = String(teamName || "").trim().toLowerCase();
  if (!cacheKey) {
    return "";
  }
  if (Object.prototype.hasOwnProperty.call(PES_WIKIPEDIA_LOGO_CACHE, cacheKey)) {
    return PES_WIKIPEDIA_LOGO_CACHE[cacheKey];
  }

  const baseName = String(teamName || "").trim().replace(/\s+/g, " ");
  const titleCandidates = [
    `${baseName} F.C.`,
    `${baseName} FC`,
    baseName,
  ]
    .map((item) => item.replace(/\s+/g, "_"))
    .map((item) => encodeURIComponent(item));

  for (const encodedTitle of titleCandidates) {
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodedTitle}`;
      const data = await fetchApiJsonWithTimeout(url, 7000);
      if (data && data.thumbnail && data.thumbnail.source) {
        const logoUrl = normalizeExternalImageUrl(data.thumbnail.source);
        if (logoUrl) {
          PES_WIKIPEDIA_LOGO_CACHE[cacheKey] = logoUrl;
          return logoUrl;
        }
      }
    } catch {
      // try next title candidate
    }
  }
  PES_WIKIPEDIA_LOGO_CACHE[cacheKey] = "";
  return "";
}

async function enrichTeamsWithWikipediaLogoFallback(teams) {
  const enriched = [];
  for (const team of teams) {
    const hasAnyLogo =
      Boolean(team.logoUrl) ||
      (Array.isArray(team.logoCandidates) && team.logoCandidates.length > 0);
    if (hasAnyLogo) {
      enriched.push(team);
      continue;
    }
    const wikipediaLogo = await fetchWikipediaTeamLogoUrl(team.name);
    if (!wikipediaLogo) {
      enriched.push(team);
      continue;
    }
    enriched.push({
      ...team,
      logoUrl: wikipediaLogo,
      logoCandidates: [wikipediaLogo],
    });
  }
  return enriched;
}

async function fetchApiJsonWithTimeout(url, timeoutMilliseconds) {
  const candidateUrls = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  let lastError = null;
  for (const candidateUrl of candidateUrls) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, timeoutMilliseconds);
    try {
      const response = await window.fetch(candidateUrl, {
        method: "GET",
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`API status ${response.status}`);
      }
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("application/json") && !contentType.includes("text/plain")) {
        throw new Error("Neočekivan API format.");
      }
      return await response.json();
    } catch (error) {
      lastError = error;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
  throw lastError || new Error("Neuspešno učitavanje API podataka.");
}

function initializeTeamDiscoveryLeagueSelect() {
  const select = document.getElementById("pes-team-league-select");
  if (!select) {
    return;
  }
  select.innerHTML = "";
  for (const leagueName of PES_TEAM_DISCOVERY_LEAGUES) {
    const option = document.createElement("option");
    option.value = leagueName;
    option.textContent = leagueName;
    select.appendChild(option);
  }
}

function bindTeamDiscoveryControls() {
  initializeTeamDiscoveryLeagueSelect();

  const searchForm = document.getElementById("pes-team-search-form");
  if (searchForm) {
    searchForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const queryInput = document.getElementById("pes-team-search-query");
      const query = String(queryInput ? queryInput.value : "").trim();
      if (!query) {
        setTeamDiscoveryStatus(t("discovery.enterQuery"), true);
        return;
      }
      try {
        setTeamDiscoveryStatus(t("discovery.loadingSearch"), false);
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(query)}`;
        const data = await fetchApiJsonWithTimeout(url, 10000);
        const teams = Array.isArray(data.teams)
          ? data.teams.map(mapApiTeamToLocalModel).filter((team) => Boolean(team.name))
          : [];
        const enrichedTeams = await enrichTeamsWithWikipediaLogoFallback(teams);
        pesDiscoveredTeamsFromApi = enrichedTeams;
        renderDiscoveredTeamResults(enrichedTeams);
        setTeamDiscoveryStatus(t("discovery.foundCount", { n: String(enrichedTeams.length) }), false);
      } catch (error) {
        const isFileProtocol = window.location.protocol === "file:";
        const hint = isFileProtocol ? t("discovery.fileHint") : "";
        const msg = error instanceof Error ? error.message : t("discovery.unknownErr");
        setTeamDiscoveryStatus(t("discovery.searchFailed", { hint, msg }), true);
      }
    });
  }

  const browseForm = document.getElementById("pes-league-browse-form");
  if (browseForm) {
    browseForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const select = document.getElementById("pes-team-league-select");
      const leagueName = String(select ? select.value : "").trim();
      if (!leagueName) {
        setTeamDiscoveryStatus(t("discovery.pickLeague"), true);
        return;
      }
      try {
        setTeamDiscoveryStatus(t("discovery.loadingLeague"), false);
        const url = `https://www.thesportsdb.com/api/v1/json/3/search_all_teams.php?l=${encodeURIComponent(
          leagueName
        )}`;
        const data = await fetchApiJsonWithTimeout(url, 12000);
        const teams = Array.isArray(data.teams)
          ? data.teams.map(mapApiTeamToLocalModel).filter((team) => Boolean(team.name))
          : [];
        const enrichedTeams = await enrichTeamsWithWikipediaLogoFallback(teams);
        pesDiscoveredTeamsFromApi = enrichedTeams;
        renderDiscoveredTeamResults(enrichedTeams);
        setTeamDiscoveryStatus(
          t("discovery.leagueCount", { name: leagueName, n: String(enrichedTeams.length) }),
          false
        );
      } catch (error) {
        const isFileProtocol = window.location.protocol === "file:";
        const hint = isFileProtocol ? t("discovery.fileHint") : "";
        const msg = error instanceof Error ? error.message : t("discovery.unknownErr");
        setTeamDiscoveryStatus(t("discovery.leagueFailed", { hint, msg }), true);
      }
    });
  }
}

function bindClickDelegation() {
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const editPlayerButton = target.closest(".pes-edit-player");
    if (editPlayerButton) {
      const playerId = editPlayerButton.getAttribute("data-player-id");
      if (playerId) {
        openPlayerModal(playerId);
      }
      return;
    }
    const openPlayerProfileButton = target.closest(".pes-open-player-profile");
    if (openPlayerProfileButton) {
      const playerId = openPlayerProfileButton.getAttribute("data-player-id");
      if (playerId) {
        setSelectedPlayerProfileIdToSession(playerId);
        refreshEntireUi();
      }
      return;
    }
    const deletePlayerButton = target.closest(".pes-delete-player");
    if (deletePlayerButton) {
      const playerId = deletePlayerButton.getAttribute("data-player-id");
      if (
        playerId &&
        window.confirmPesDangerous(t("confirm.deletePlayer"))
      ) {
        const state = getPesLeagueApplicationState();
        const result = deletePlayerFromState(state, playerId);
        if (!result.ok) {
          showToastMessage(result.message, "error");
          return;
        }
        applyPesLeagueStateAndRefresh(result.state);
        showToastMessage(t("toast.playerDeleted"), "success");
      }
      return;
    }
    const editTeamButton = target.closest(".pes-edit-team");
    if (editTeamButton) {
      const teamId = editTeamButton.getAttribute("data-team-id");
      if (teamId) {
        openTeamModal(teamId);
      }
      return;
    }
    const deleteTeamButton = target.closest(".pes-delete-team");
    if (deleteTeamButton) {
      const teamId = deleteTeamButton.getAttribute("data-team-id");
      if (
        teamId &&
        window.confirmPesDangerous(t("confirm.deleteTeam"))
      ) {
        const state = getPesLeagueApplicationState();
        const result = deleteTeamFromState(state, teamId);
        if (!result.ok) {
          showToastMessage(result.message, "error");
          return;
        }
        applyPesLeagueStateAndRefresh(result.state);
        showToastMessage(t("toast.teamDeleted"), "success");
      }
      return;
    }
    const generateFixturesButton = target.closest(".pes-generate-fixtures");
    if (generateFixturesButton) {
      const seasonId = generateFixturesButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const result = generateLeagueFixturesForSeason(state, seasonId);
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      setSelectedSeasonIdToSession(seasonId);
      showToastMessage(
        t("toast.fixturesGenerated", { count: String(result.createdMatchesCount) }),
        "success"
      );
      return;
    }
    const doubleRoundButton = target.closest(".pes-season-double");
    if (doubleRoundButton) {
      const seasonId = doubleRoundButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const season = findSeasonById(state, seasonId);
      if (!season) {
        return;
      }
      const nextFlag = !season.isDoubleRoundRobin;
      const result = updateSeasonDoubleRoundRobinFlag(
        state,
        seasonId,
        nextFlag
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      showToastMessage(nextFlag ? t("toast.doubleOn") : t("toast.doubleOff"), "success");
      return;
    }
    const resetSeasonButton = target.closest(".pes-reset-season");
    if (resetSeasonButton) {
      const seasonId = resetSeasonButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      if (!window.confirmPesDangerous(t("confirm.resetSeason"))) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const result = resetSeasonToDraftInState(state, seasonId);
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      showToastMessage(t("toast.seasonDraftReset"), "success");
      return;
    }
    const finishSeasonButton = target.closest(".pes-finish-season");
    if (finishSeasonButton) {
      const seasonId = finishSeasonButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const result = setSeasonStatusInState(state, seasonId, "finished");
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      showToastMessage(t("toast.seasonFinished"), "success");
      return;
    }
    const cloneSeasonButton = target.closest(".pes-clone-season");
    if (cloneSeasonButton) {
      const seasonId = cloneSeasonButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      const proposedName = window.prompt(t("prompt.newSeasonName"), t("prompt.newSeasonDefault"));
      if (proposedName === null) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const result = createNewDraftSeasonWithSamePlayersFromFinishedSeason(
        state,
        seasonId,
        proposedName
      );
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      if (result.season) {
        setSelectedSeasonIdToSession(result.season.id);
      }
      showToastMessage(t("toast.seasonCloned"), "success");
      return;
    }
    const deleteSeasonButton = target.closest(".pes-delete-season");
    if (deleteSeasonButton) {
      const seasonId = deleteSeasonButton.getAttribute("data-season-id");
      if (!seasonId) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const seasonRow = findSeasonById(state, seasonId);
      const seasonLabel = seasonRow ? seasonRow.name : seasonId;
      if (!window.confirmPesDangerous(t("confirm.deleteSeason", { name: seasonLabel }))) {
        return;
      }
      const result = deleteSeasonFromState(state, seasonId);
      if (!result.ok) {
        showToastMessage(result.message, "error");
        return;
      }
      const stored = getSelectedSeasonIdFromSession();
      if (stored === seasonId) {
        setSelectedSeasonIdToSession(null);
      }
      applyPesLeagueStateAndRefresh(result.state);
      showToastMessage(t("toast.seasonDeleted"), "success");
      return;
    }

    const discoveredTeamButton = target.closest(".pes-add-discovered-team");
    if (discoveredTeamButton) {
      const indexValue = discoveredTeamButton.getAttribute("data-discovered-index");
      const index = Number.parseInt(String(indexValue || ""), 10);
      if (!Number.isFinite(index) || !pesDiscoveredTeamsFromApi[index]) {
        showToastMessage(t("toast.apiTeamMissing"), "error");
        return;
      }
      const apiTeam = pesDiscoveredTeamsFromApi[index];
      const state = getPesLeagueApplicationState();
      const result = addTeamToState(
        state,
        apiTeam.name,
        apiTeam.logoUrl || "",
        {
          league: apiTeam.league,
          country: apiTeam.country,
          stadium: apiTeam.stadium,
          foundedYear: apiTeam.foundedYear,
          website: apiTeam.website,
          logoCandidates: apiTeam.logoCandidates || [],
        }
      );
      if (!result.ok) {
        if (result.existingTeam) {
          showToastMessage(t("toast.teamExists"), "success");
        } else {
          showToastMessage(result.message, "error");
        }
        return;
      }
      applyPesLeagueStateAndRefresh(result.state);
      showToastMessage(t("toast.teamAdded", { name: apiTeam.name }), "success");
      return;
    }
  });
}

function bindDisciplineDynamicRows() {
  if (bindDisciplineDynamicRows._pesBound) {
    return;
  }
  bindDisciplineDynamicRows._pesBound = true;
  document.body.addEventListener("click", (event) => {
    const el = event.target;
    if (!(el instanceof HTMLElement)) {
      return;
    }
    const addCardBtn = el.closest(".pes-discipline-add-card");
    if (addCardBtn) {
      event.preventDefault();
      const block = addCardBtn.closest("[data-pes-discipline-block]");
      if (!block) {
        return;
      }
      const list = block.querySelector("[data-pes-cards-list]");
      if (!list || typeof buildDisciplineCardRowHtml !== "function") {
        return;
      }
      const showCarry = block.hasAttribute("data-pes-discipline-carryover");
      list.insertAdjacentHTML("beforeend", buildDisciplineCardRowHtml(showCarry, {}));
      return;
    }
    const addInjBtn = el.closest(".pes-discipline-add-injury");
    if (addInjBtn) {
      event.preventDefault();
      const block = addInjBtn.closest("[data-pes-discipline-block]");
      if (!block) {
        return;
      }
      const list = block.querySelector("[data-pes-injuries-list]");
      if (!list || typeof buildDisciplineInjuryRowHtml !== "function") {
        return;
      }
      list.insertAdjacentHTML("beforeend", buildDisciplineInjuryRowHtml({}));
      return;
    }
    const rmBtn = el.closest(".pes-discipline-remove-row");
    if (rmBtn) {
      event.preventDefault();
      const row = rmBtn.closest("[data-pes-card-row], [data-pes-injury-row]");
      if (!row || !row.parentElement) {
        return;
      }
      const list = row.parentElement;
      const sel = row.matches("[data-pes-card-row]")
        ? "[data-pes-card-row]"
        : "[data-pes-injury-row]";
      if (list.querySelectorAll(sel).length <= 1) {
        return;
      }
      row.remove();
    }
  });
}

function bindResultsDelegation() {
  document.body.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    if (!form.classList.contains("pes-result-form")) {
      return;
    }
    event.preventDefault();
    const matchId = form.getAttribute("data-match-id");
    const formData = new FormData(form);
    const state = getPesLeagueApplicationState();
    const discipline = parseMatchDisciplineFromResultForm(form);
    const result = saveMatchResult(
      state,
      matchId,
      formData.get("homeScore"),
      formData.get("awayScore"),
      discipline
    );
    if (!result.ok) {
      showToastMessage(result.message, "error");
      return;
    }
    applyPesLeagueStateAndRefresh(result.state);
    showToastMessage(t("toast.resultSaved"), "success");
  });
  document.body.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const revertButton = target.closest(".pes-revert-match");
    if (!revertButton) {
      const skipButton = target.closest(".pes-skip-match");
      if (!skipButton) {
        return;
      }
      const skipMatchId = skipButton.getAttribute("data-match-id");
      if (!skipMatchId) {
        return;
      }
      const state = getPesLeagueApplicationState();
      const skipResult = skipMatchToPlayLater(state, skipMatchId);
      if (!skipResult.ok) {
        showToastMessage(skipResult.message, "error");
        return;
      }
      applyPesLeagueStateAndRefresh(skipResult.state);
      showToastMessage(t("toast.matchSkipped"), "success");
      return;
    }
    const matchId = revertButton.getAttribute("data-match-id");
    if (!matchId) {
      return;
    }
    if (!window.confirmPesDangerous(t("confirm.revertMatch"))) {
      return;
    }
    const state = getPesLeagueApplicationState();
    const result = revertMatchToScheduled(state, matchId);
    if (!result.ok) {
      showToastMessage(result.message, "error");
      return;
    }
    applyPesLeagueStateAndRefresh(result.state);
    showToastMessage(t("toast.matchReverted"), "success");
  });
}

function bindExportButtons() {
  const standingsButton = document.getElementById("pes-export-standings-csv");
  if (standingsButton) {
    standingsButton.addEventListener("click", () => {
      const state = getPesLeagueApplicationState();
      const seasonId = resolveSelectedSeasonId(state);
      if (!seasonId) {
        showToastMessage(t("toast.pickSeason"), "error");
        return;
      }
      const csv = buildStandingsCsvForSeason(state, seasonId);
      const season = findSeasonById(state, seasonId);
      const safeName = (season ? season.name : "sezona").replace(/[^\w\-]+/g, "_");
      downloadTextFile(
        buildPesExportCsvFilename("standings", safeName),
        `\uFEFF${csv}`,
        "text/csv;charset=utf-8"
      );
    });
  }
  const rankingsButton = document.getElementById("pes-export-rankings-csv");
  if (rankingsButton) {
    rankingsButton.addEventListener("click", () => {
      const state = getPesLeagueApplicationState();
      const seasonId = resolveSelectedSeasonId(state);
      if (!seasonId) {
        showToastMessage(t("toast.pickSeason"), "error");
        return;
      }
      const csv = buildStandingsCsvForSeason(state, seasonId);
      const season = findSeasonById(state, seasonId);
      const safeName = (season ? season.name : "sezona").replace(/[^\w\-]+/g, "_");
      downloadTextFile(
        buildPesExportCsvFilename("rankings", safeName),
        `\uFEFF${csv}`,
        "text/csv;charset=utf-8"
      );
    });
  }
  const resultsButton = document.getElementById("pes-export-results-csv");
  if (resultsButton) {
    resultsButton.addEventListener("click", () => {
      const state = getPesLeagueApplicationState();
      const seasonId = resolveSelectedSeasonId(state);
      if (!seasonId) {
        showToastMessage(t("toast.pickSeason"), "error");
        return;
      }
      const csv = buildResultsCsvForSeason(state, seasonId);
      const season = findSeasonById(state, seasonId);
      const safeName = (season ? season.name : "sezona").replace(/[^\w\-]+/g, "_");
      downloadTextFile(
        buildPesExportCsvFilename("results", safeName),
        `\uFEFF${csv}`,
        "text/csv;charset=utf-8"
      );
    });
  }
}

function bindModalControls() {
  const closePlayer = document.getElementById("pes-player-modal-close");
  if (closePlayer) {
    closePlayer.addEventListener("click", () => {
      closePlayerModal();
    });
  }
  const closeTeam = document.getElementById("pes-team-modal-close");
  if (closeTeam) {
    closeTeam.addEventListener("click", () => {
      closeTeamModal();
    });
  }
  const playerModal = document.getElementById("pes-player-modal");
  if (playerModal) {
    playerModal.addEventListener("click", (event) => {
      if (event.target === playerModal) {
        closePlayerModal();
      }
    });
  }
  const teamModal = document.getElementById("pes-team-modal");
  if (teamModal) {
    teamModal.addEventListener("click", (event) => {
      if (event.target === teamModal) {
        closeTeamModal();
      }
    });
  }

  const cloudModal = document.getElementById("pes-cloud-modal");
  if (cloudModal) {
    cloudModal.addEventListener("click", (event) => {
      if (event.target === cloudModal) {
        closeCloudModal();
      }
    });
  }
}

function bindCloudControls() {
  const openButton = document.getElementById("pes-cloud-settings-open");
  if (openButton) {
    openButton.addEventListener("click", () => {
      openCloudModal();
    });
  }

  const closeButton = document.getElementById("pes-cloud-modal-close");
  if (closeButton) {
    closeButton.addEventListener("click", () => {
      closeCloudModal();
    });
  }

  const clearButton = document.getElementById("pes-cloud-clear");
  if (clearButton) {
    clearButton.addEventListener("click", async () => {
      if (!window.confirmPesDangerous(t("confirm.disableCloud"))) {
        return;
      }
      clearPesLeagueCloudSettings();
      restartCloudPullLoop();
      refreshCloudSyncStatusUi();
      closeCloudModal();
      showToastMessage(t("toast.cloudDisabled"), "success");
    });
  }

  const cloudForm = document.getElementById("pes-cloud-settings-form");
  if (cloudForm) {
    cloudForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const leagueId = String(document.getElementById("pes-cloud-league-id").value || "").trim();
      const preset = getPesCloudPresetDefaults();
      const supabaseUrl = preset.supabaseUrl;
      const supabaseAnonKey = preset.supabaseAnonKey;
      if (!leagueId) {
        showToastMessage(t("error.leagueIdRequired"), "error");
        return;
      }
      if (!supabaseUrl || !supabaseAnonKey) {
        showToastMessage(t("error.cloudIncomplete"), "error");
        return;
      }
      setPesLeagueCloudSettings(supabaseUrl, supabaseAnonKey, leagueId);
      const hydrateResult = await hydratePesLeagueStateFromCloudIfEnabled();
      if (!hydrateResult.ok) {
        showToastMessage(t("toast.cloudError", { detail: hydrateResult.message }), "error");
        refreshCloudSyncStatusUi();
        return;
      }
      refreshEntireUi();
      refreshCloudSyncStatusUi();
      restartCloudPullLoop();
      closeCloudModal();
      showToastMessage(t("toast.cloudActivated"), "success");
    });
  }

  const syncNowButton = document.getElementById("pes-cloud-sync-now");
  if (syncNowButton) {
    syncNowButton.addEventListener("click", async () => {
      closeHeaderMobileMenu();
      if (!isPesLeagueCloudSyncEnabled()) {
        showToastMessage(t("toast.cloudNotSet"), "error");
        return;
      }
      const result = await pullCloudStateIfNewerAndReplaceLocal();
      if (!result.ok) {
        showToastMessage(t("toast.syncError", { detail: result.message }), "error");
        return;
      }
      if (result.changed) {
        refreshEntireUi();
        showToastMessage(t("toast.cloudSynced"), "success");
      } else {
        showToastMessage(t("toast.cloudCurrent"), "success");
      }
      refreshCloudSyncStatusUi();
    });
  }
}

async function initializePesLeagueApplication() {
  window.applyPesAppSettingsToDom();
  applyPesI18nToDocument();
  loadPesLeagueStateFromStorage();
  window.applyPesStartupViewFromSettings();
  bindNavigationButtons();
  if (typeof initPes6UiSounds === "function") {
    initPes6UiSounds();
  }
  if (typeof window.initPes6BgMusic === "function") {
    window.initPes6BgMusic();
  }
  bindGlobalSeasonSelect();
  bindFixtureFilterDelegation();
  bindPlayerSearchInput();
  bindGlobalPlayerSearchShortcut();
  bindForms();
  bindClickDelegation();
  bindResultsDelegation();
  bindDisciplineDynamicRows();
  bindExportButtons();
  bindModalControls();
  bindCloudControls();
  bindAppSettingsModal();
  bindHeaderMobileMenu();
  bindTeamDiscoveryControls();
  bindVisibilityCloudPull();
  document.addEventListener("pes-app-settings-changed", () => {
    applyPesI18nToDocument();
    refreshCloudSyncStatusUi();
    refreshEntireUi();
    restartCloudPullLoop();
    if (typeof window.refreshPes6UiSoundLabels === "function") {
      window.refreshPes6UiSoundLabels();
    }
    if (typeof window.refreshPes6BgMusicLabels === "function") {
      window.refreshPes6BgMusicLabels();
    }
  });
  window.addEventListener("hashchange", () => {
    window.rememberPesLastViewFromHash();
    handleHashChange();
  });
  if (isPesLeagueCloudSyncEnabled()) {
    const hydrateResult = await hydratePesLeagueStateFromCloudIfEnabled();
    if (!hydrateResult.ok) {
      showToastMessage(t("toast.cloudError", { detail: hydrateResult.message }), "error");
    }
  }
  refreshEntireUi();
  refreshCloudSyncStatusUi();
  restartCloudPullLoop();
  window.rememberPesLastViewFromHash();
}

document.addEventListener("DOMContentLoaded", initializePesLeagueApplication);
