/**
 * Season / tournament lifecycle (no fixture geometry — see fixtures.js).
 */

function listAllSeasonsSortedByCreatedAt(state) {
  const seasons = Array.isArray(state.seasons) ? state.seasons.slice() : [];
  seasons.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
  return seasons;
}

function findSeasonById(state, seasonId) {
  return state.seasons.find((season) => season.id === seasonId) || null;
}

function createDraftSeasonInState(state, name, playerIds) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) {
    return { ok: false, message: "Naziv sezone je obavezan." };
  }
  const uniquePlayerIds = Array.from(new Set(playerIds || [])).filter(Boolean);
  if (uniquePlayerIds.length < 2) {
    return {
      ok: false,
      message: "Potrebna su najmanje 2 igrača za sezonu.",
    };
  }
  for (const playerId of uniquePlayerIds) {
    if (!findPlayerById(state, playerId)) {
      return { ok: false, message: "Jedan od igrača ne postoji." };
    }
  }
  const newSeason = {
    id: generateUniqueId(),
    name: trimmedName,
    roundCount: 0,
    participantCount: uniquePlayerIds.length,
    createdAt: new Date().toISOString(),
    status: "draft",
    playerIds: uniquePlayerIds,
    isDoubleRoundRobin: false,
  };
  const nextState = cloneDeepJson(state);
  nextState.seasons.push(newSeason);
  return { ok: true, state: nextState, season: newSeason };
}

function updateSeasonDoubleRoundRobinFlag(state, seasonId, isDoubleRoundRobin) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return { ok: false, message: "Sezona nije pronađena." };
  }
  if (season.status !== "draft") {
    return {
      ok: false,
      message: "Dupli krug može da se podešava samo u nacrtu pre generisanja rasporeda.",
    };
  }
  const nextState = cloneDeepJson(state);
  const index = nextState.seasons.findIndex((item) => item.id === seasonId);
  nextState.seasons[index] = {
    ...nextState.seasons[index],
    isDoubleRoundRobin: Boolean(isDoubleRoundRobin),
  };
  return { ok: true, state: nextState };
}

function setSeasonStatusInState(state, seasonId, status) {
  const allowed = ["draft", "active", "finished"];
  if (!allowed.includes(status)) {
    return { ok: false, message: "Nepoznat status sezone." };
  }
  const nextState = cloneDeepJson(state);
  const index = nextState.seasons.findIndex((season) => season.id === seasonId);
  if (index === -1) {
    return { ok: false, message: "Sezona nije pronađena." };
  }
  nextState.seasons[index] = {
    ...nextState.seasons[index],
    status,
  };
  return { ok: true, state: nextState };
}

function resetSeasonToDraftInState(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return { ok: false, message: "Sezona nije pronađena." };
  }
  const played = state.matches.some(
    (match) => match.seasonId === seasonId && match.status === "played"
  );
  if (played) {
    return {
      ok: false,
      message:
        "Reset nije moguć jer postoje odigrane utakmice. Završite ili arhivirajte sezonu drugačije.",
    };
  }
  const nextState = cloneDeepJson(state);
  nextState.matches = nextState.matches.filter(
    (match) => match.seasonId !== seasonId
  );
  const index = nextState.seasons.findIndex((item) => item.id === seasonId);
  nextState.seasons[index] = {
    ...nextState.seasons[index],
    roundCount: 0,
    status: "draft",
  };
  return { ok: true, state: nextState };
}

function createNewDraftSeasonWithSamePlayersFromFinishedSeason(
  state,
  sourceSeasonId,
  newName
) {
  const source = findSeasonById(state, sourceSeasonId);
  if (!source) {
    return { ok: false, message: "Izvorna sezona ne postoji." };
  }
  const trimmedName = String(newName || "").trim();
  if (!trimmedName) {
    return { ok: false, message: "Naziv nove sezone je obavezan." };
  }
  const playerIds = Array.isArray(source.playerIds) ? source.playerIds.slice() : [];
  const stillExisting = playerIds.filter((playerId) =>
    Boolean(findPlayerById(state, playerId))
  );
  if (stillExisting.length < 2) {
    return {
      ok: false,
      message: "Nedovoljno postojećih igrača za novu sezonu.",
    };
  }
  return createDraftSeasonInState(state, trimmedName, stillExisting);
}

function getActiveSeasonOrNull(state) {
  return state.seasons.find((season) => season.status === "active") || null;
}
