/**
 * Persistence and single in-memory application state for the PES league manager.
 */

const PES_LEAGUE_STORAGE_KEY = "pesLeagueManagerState_v1";
const PES_LEAGUE_CLOUD_SETTINGS_STORAGE_KEY = "pesLeagueCloudSettings_v1";
const PES_LEAGUE_CLOUD_SYNC_METADATA_KEY = "pesLeagueCloudSyncMetadata_v1";

let pesLeagueApplicationState = createEmptyPesLeagueState();
let pesLeagueCloudSettings = loadPesLeagueCloudSettingsFromStorage();
let pesLeagueLastCloudUpdatedAt = loadLastCloudUpdatedAtFromStorage();

function createEmptyPesLeagueState() {
  return {
    schemaVersion: 1,
    players: [],
    teams: [],
    seasons: [],
    matches: [],
  };
}

function getPesLeagueApplicationState() {
  return pesLeagueApplicationState;
}

function replacePesLeagueApplicationState(nextState) {
  pesLeagueApplicationState = nextState;
  persistPesLeagueStateToStorage();
  void persistPesLeagueStateToCloudIfEnabled();
}

function loadPesLeagueStateFromStorage() {
  try {
    const raw = window.localStorage.getItem(PES_LEAGUE_STORAGE_KEY);
    if (!raw) {
      pesLeagueApplicationState = createEmptyPesLeagueState();
      return;
    }
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      pesLeagueApplicationState = createEmptyPesLeagueState();
      return;
    }
    pesLeagueApplicationState = migratePesLeagueStateIfNeeded(parsed);
    persistPesLeagueStateToStorage();
  } catch {
    pesLeagueApplicationState = createEmptyPesLeagueState();
  }
}

function persistPesLeagueStateToStorage() {
  try {
    const serialized = JSON.stringify(pesLeagueApplicationState);
    window.localStorage.setItem(PES_LEAGUE_STORAGE_KEY, serialized);
  } catch {
    // Storage full or disabled — keep in-memory state only.
  }
}

function loadPesLeagueCloudSettingsFromStorage() {
  try {
    const raw = window.localStorage.getItem(PES_LEAGUE_CLOUD_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return {
        supabaseUrl: "",
        supabaseAnonKey: "",
        leagueId: "",
      };
    }
    const parsed = JSON.parse(raw);
    return {
      supabaseUrl: String(parsed.supabaseUrl || "").trim(),
      supabaseAnonKey: String(parsed.supabaseAnonKey || "").trim(),
      leagueId: String(parsed.leagueId || "").trim(),
    };
  } catch {
    return {
      supabaseUrl: "",
      supabaseAnonKey: "",
      leagueId: "",
    };
  }
}

function savePesLeagueCloudSettingsToStorage() {
  try {
    window.localStorage.setItem(
      PES_LEAGUE_CLOUD_SETTINGS_STORAGE_KEY,
      JSON.stringify(pesLeagueCloudSettings)
    );
  } catch {
    // ignore
  }
}

function loadLastCloudUpdatedAtFromStorage() {
  try {
    return window.localStorage.getItem(PES_LEAGUE_CLOUD_SYNC_METADATA_KEY) || "";
  } catch {
    return "";
  }
}

function saveLastCloudUpdatedAtToStorage(isoString) {
  pesLeagueLastCloudUpdatedAt = isoString || "";
  try {
    if (!isoString) {
      window.localStorage.removeItem(PES_LEAGUE_CLOUD_SYNC_METADATA_KEY);
      return;
    }
    window.localStorage.setItem(PES_LEAGUE_CLOUD_SYNC_METADATA_KEY, isoString);
  } catch {
    // ignore
  }
}

function getPesLeagueCloudSettings() {
  return {
    ...pesLeagueCloudSettings,
  };
}

function setPesLeagueCloudSettings(
  supabaseUrl,
  supabaseAnonKey,
  leagueId
) {
  pesLeagueCloudSettings = {
    supabaseUrl: String(supabaseUrl || "").trim().replace(/\/+$/, ""),
    supabaseAnonKey: String(supabaseAnonKey || "").trim(),
    leagueId: String(leagueId || "").trim(),
  };
  savePesLeagueCloudSettingsToStorage();
}

function clearPesLeagueCloudSettings() {
  setPesLeagueCloudSettings("", "", "");
}

function getPesCloudPresetDefaults() {
  try {
    const preset = window.PES_CLOUD_PRESET;
    if (!preset || typeof preset !== "object") {
      return { supabaseUrl: "", supabaseAnonKey: "" };
    }
    return {
      supabaseUrl: String(preset.supabaseUrl || "")
        .trim()
        .replace(/\/+$/, ""),
      supabaseAnonKey: String(preset.supabaseAnonKey || "").trim(),
    };
  } catch {
    return { supabaseUrl: "", supabaseAnonKey: "" };
  }
}

function isPesCloudPresetComplete() {
  const d = getPesCloudPresetDefaults();
  return Boolean(d.supabaseUrl && d.supabaseAnonKey);
}

function isPesLeagueCloudSyncEnabled() {
  return Boolean(
    pesLeagueCloudSettings.supabaseUrl &&
      pesLeagueCloudSettings.supabaseAnonKey &&
      pesLeagueCloudSettings.leagueId
  );
}

function buildSupabaseHeaders() {
  return {
    apikey: pesLeagueCloudSettings.supabaseAnonKey,
    Authorization: `Bearer ${pesLeagueCloudSettings.supabaseAnonKey}`,
    "Content-Type": "application/json",
  };
}

function buildSupabaseLeagueTableUrl() {
  return `${pesLeagueCloudSettings.supabaseUrl}/rest/v1/pes_leagues`;
}

async function fetchCloudLeagueRowOrNull() {
  if (!isPesLeagueCloudSyncEnabled()) {
    return null;
  }
  const base = buildSupabaseLeagueTableUrl();
  const url =
    `${base}?league_id=eq.${encodeURIComponent(pesLeagueCloudSettings.leagueId)}` +
    "&select=league_id,state_json,updated_at";
  const response = await window.fetch(url, {
    method: "GET",
    headers: buildSupabaseHeaders(),
  });
  if (!response.ok) {
    throw new Error(`Cloud read failed (${response.status})`);
  }
  const rows = await response.json();
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  return rows[0];
}

async function upsertCloudLeagueRow(stateObject) {
  if (!isPesLeagueCloudSyncEnabled()) {
    return null;
  }
  const base = buildSupabaseLeagueTableUrl();
  const response = await window.fetch(base, {
    method: "POST",
    headers: {
      ...buildSupabaseHeaders(),
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    body: JSON.stringify([
      {
        league_id: pesLeagueCloudSettings.leagueId,
        state_json: stateObject,
      },
    ]),
  });
  if (!response.ok) {
    throw new Error(`Cloud write failed (${response.status})`);
  }
  const rows = await response.json();
  if (Array.isArray(rows) && rows[0] && rows[0].updated_at) {
    saveLastCloudUpdatedAtToStorage(rows[0].updated_at);
  }
  return rows;
}

async function hydratePesLeagueStateFromCloudIfEnabled() {
  if (!isPesLeagueCloudSyncEnabled()) {
    return {
      ok: false,
      message: t("error.cloudNotConfigured"),
    };
  }
  try {
    const row = await fetchCloudLeagueRowOrNull();
    if (!row) {
      await upsertCloudLeagueRow(pesLeagueApplicationState);
      return {
        ok: true,
        source: "cloud-init",
      };
    }
    const migrated = migratePesLeagueStateIfNeeded(row.state_json || {});
    pesLeagueApplicationState = migrated;
    persistPesLeagueStateToStorage();
    saveLastCloudUpdatedAtToStorage(row.updated_at || "");
    return {
      ok: true,
      source: "cloud-read",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Cloud read failed.",
    };
  }
}

async function persistPesLeagueStateToCloudIfEnabled() {
  if (!isPesLeagueCloudSyncEnabled()) {
    return {
      ok: false,
      message: t("error.cloudNotConfigured"),
    };
  }
  try {
    await upsertCloudLeagueRow(pesLeagueApplicationState);
    return {
      ok: true,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Cloud write failed.",
    };
  }
}

async function pullCloudStateIfNewerAndReplaceLocal() {
  if (!isPesLeagueCloudSyncEnabled()) {
    return {
      ok: false,
      message: t("error.cloudNotConfigured"),
    };
  }
  try {
    const row = await fetchCloudLeagueRowOrNull();
    if (!row) {
      return {
        ok: true,
        changed: false,
      };
    }
    const remoteTimestamp = row.updated_at || "";
    if (remoteTimestamp && pesLeagueLastCloudUpdatedAt === remoteTimestamp) {
      return {
        ok: true,
        changed: false,
      };
    }
    const migrated = migratePesLeagueStateIfNeeded(row.state_json || {});
    pesLeagueApplicationState = migrated;
    persistPesLeagueStateToStorage();
    saveLastCloudUpdatedAtToStorage(remoteTimestamp);
    return {
      ok: true,
      changed: true,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Cloud pull failed.",
    };
  }
}

function migratePesLeagueStateIfNeeded(parsed) {
  const base = createEmptyPesLeagueState();
  const rawSeasons = Array.isArray(parsed.seasons) ? parsed.seasons : base.seasons;
  const normalizedSeasons = rawSeasons.map((season) => ({
    ...season,
    playerIds: Array.isArray(season.playerIds) ? season.playerIds : [],
    isDoubleRoundRobin: Boolean(season.isDoubleRoundRobin),
    participantCount:
      typeof season.participantCount === "number"
        ? season.participantCount
        : Array.isArray(season.playerIds)
          ? season.playerIds.length
          : 0,
  }));
  const normalizedMatches = Array.isArray(parsed.matches)
    ? parsed.matches.map((match) => {
        const rawStatus = String(match.status || "scheduled");
        const safeStatus =
          rawStatus === "played" || rawStatus === "scheduled" || rawStatus === "skipped"
            ? rawStatus
            : "scheduled";
        const shouldKeepScore = safeStatus === "played";
        return {
          ...match,
          status: safeStatus,
          homeScore: shouldKeepScore ? match.homeScore : null,
          awayScore: shouldKeepScore ? match.awayScore : null,
          playedAt: shouldKeepScore ? match.playedAt || null : null,
          discipline: shouldKeepScore
            ? sanitizeMatchDiscipline(match.discipline)
            : null,
        };
      })
    : base.matches;
  return {
    schemaVersion: typeof parsed.schemaVersion === "number" ? parsed.schemaVersion : 1,
    players: Array.isArray(parsed.players)
      ? parsed.players.map((player) => ({
          ...player,
          firstName: String(player.firstName || "").trim(),
          lastNameOrNickname: String(player.lastNameOrNickname || "").trim(),
          teamId: String(player.teamId || "").trim(),
          avatarDataUrl: sanitizePlayerAvatarDataUrl(player.avatarDataUrl),
        }))
      : base.players,
    teams: Array.isArray(parsed.teams)
      ? parsed.teams.map((team) => ({
          ...team,
          logoUrl: normalizeExternalImageUrl(team.logoUrl),
          logoCandidates: sanitizeLogoCandidateUrls(team.logoCandidates || []),
          league: String(team.league || "").trim(),
          country: String(team.country || "").trim(),
          stadium: String(team.stadium || "").trim(),
          foundedYear: String(team.foundedYear || "").trim(),
          website: normalizeWebsiteUrl(team.website),
        }))
      : base.teams,
    seasons: normalizedSeasons,
    matches: normalizedMatches,
  };
}

function exportPesLeagueStateAsJsonString() {
  return JSON.stringify(pesLeagueApplicationState, null, 2);
}

function importPesLeagueStateFromJsonString(jsonString) {
  const parsed = JSON.parse(jsonString);
  const migrated = migratePesLeagueStateIfNeeded(parsed);
  replacePesLeagueApplicationState(migrated);
}

function resetPesLeagueStateToEmpty() {
  replacePesLeagueApplicationState(createEmptyPesLeagueState());
}

function getPesLeagueLastCloudUpdatedAt() {
  return pesLeagueLastCloudUpdatedAt;
}
