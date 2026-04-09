/**
 * Team domain operations and de-duplication by normalized name.
 */

function listAllTeamsSortedByName(state) {
  const teams = Array.isArray(state.teams) ? state.teams.slice() : [];
  teams.sort((a, b) => String(a.name).localeCompare(String(b.name), "sr"));
  return teams;
}

function findTeamById(state, teamId) {
  return state.teams.find((team) => team.id === teamId) || null;
}

function findExistingTeamByNormalizedName(state, name) {
  const normalized = normalizeTeamNameForComparison(name);
  if (!normalized) {
    return null;
  }
  return (
    state.teams.find(
      (team) => normalizeTeamNameForComparison(team.name) === normalized
    ) || null
  );
}

function addTeamToState(
  state,
  name,
  logoUrl,
  metadata
) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) {
    return { ok: false, message: "Naziv tima je obavezan." };
  }
  const duplicate = findExistingTeamByNormalizedName(state, trimmedName);
  if (duplicate) {
    return {
      ok: false,
      message: "Tim sa istim ili sličnim nazivom već postoji. Izaberite postojeći tim.",
      existingTeam: duplicate,
    };
  }
  const logo = normalizeExternalImageUrl(logoUrl);
  const safeMetadata = metadata || {};
  const safeLogoCandidates = sanitizeLogoCandidateUrls(safeMetadata.logoCandidates || []);
  const newTeam = {
    id: generateUniqueId(),
    name: trimmedName,
    logoUrl: logo || "",
    logoCandidates: safeLogoCandidates,
    league: String(safeMetadata.league || "").trim(),
    country: String(safeMetadata.country || "").trim(),
    stadium: String(safeMetadata.stadium || "").trim(),
    foundedYear: String(safeMetadata.foundedYear || "").trim(),
    website: normalizeWebsiteUrl(safeMetadata.website),
    createdAt: new Date().toISOString(),
  };
  const nextState = cloneDeepJson(state);
  nextState.teams.push(newTeam);
  return { ok: true, state: nextState, team: newTeam };
}

function updateTeamInState(
  state,
  teamId,
  name,
  logoUrl,
  metadata
) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) {
    return { ok: false, message: "Naziv tima je obavezan." };
  }
  const index = state.teams.findIndex((team) => team.id === teamId);
  if (index === -1) {
    return { ok: false, message: "Tim nije pronađen." };
  }
  const otherDuplicate = state.teams.find(
    (team, teamIndex) =>
      teamIndex !== index &&
      normalizeTeamNameForComparison(team.name) ===
        normalizeTeamNameForComparison(trimmedName)
  );
  if (otherDuplicate) {
    return {
      ok: false,
      message: "Drugi tim već koristi ovaj naziv.",
    };
  }
  const safeMetadata = metadata || {};
  const safeLogoCandidates = sanitizeLogoCandidateUrls(safeMetadata.logoCandidates || []);
  const nextState = cloneDeepJson(state);
  nextState.teams[index] = {
    ...nextState.teams[index],
    name: trimmedName,
    logoUrl: normalizeExternalImageUrl(logoUrl),
    logoCandidates: safeLogoCandidates,
    league: String(safeMetadata.league || "").trim(),
    country: String(safeMetadata.country || "").trim(),
    stadium: String(safeMetadata.stadium || "").trim(),
    foundedYear: String(safeMetadata.foundedYear || "").trim(),
    website: normalizeWebsiteUrl(safeMetadata.website),
  };
  return { ok: true, state: nextState };
}

function deleteTeamFromState(state, teamId) {
  const usedByPlayer = state.players.some((player) => player.teamId === teamId);
  if (usedByPlayer) {
    return {
      ok: false,
      message: "Tim se koristi kod igrača. Dodelite drugi tim igračima pre brisanja.",
    };
  }
  const nextState = cloneDeepJson(state);
  nextState.teams = nextState.teams.filter((team) => team.id !== teamId);
  return { ok: true, state: nextState };
}

function resolveOrCreateTeamForPlayer(
  state,
  teamNameInput,
  existingTeamId
) {
  if (existingTeamId) {
    const team = findTeamById(state, existingTeamId);
    if (!team) {
      return { ok: false, message: "Izabrani tim ne postoji." };
    }
    return { ok: true, team, state };
  }
  const trimmed = String(teamNameInput || "").trim();
  if (!trimmed) {
    return { ok: false, message: "Unesite naziv novog tima ili izaberite postojeći." };
  }
  const existing = findExistingTeamByNormalizedName(state, trimmed);
  if (existing) {
    return { ok: true, team: existing, state };
  }
  const created = addTeamToState(state, trimmed, "");
  if (!created.ok) {
    return created;
  }
  return { ok: true, team: created.team, state: created.state };
}
