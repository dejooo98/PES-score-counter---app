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
    return { ok: false, message: t("error.seasonNameRequired") };
  }
  const uniquePlayerIds = Array.from(new Set(playerIds || [])).filter(Boolean);
  if (uniquePlayerIds.length < 2) {
    return {
      ok: false,
      message: t("error.seasonMinPlayers"),
    };
  }
  for (const playerId of uniquePlayerIds) {
    if (!findPlayerById(state, playerId)) {
      return { ok: false, message: t("error.seasonPlayerMissing") };
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
    return { ok: false, message: t("error.seasonNotFound") };
  }
  if (season.status !== "draft") {
    return {
      ok: false,
      message: t("error.doubleRoundDraft"),
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
    return { ok: false, message: t("error.seasonBadStatus") };
  }
  const nextState = cloneDeepJson(state);
  const index = nextState.seasons.findIndex((season) => season.id === seasonId);
  if (index === -1) {
    return { ok: false, message: t("error.seasonNotFound") };
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
    return { ok: false, message: t("error.seasonNotFound") };
  }
  const played = state.matches.some(
    (match) => match.seasonId === seasonId && match.status === "played"
  );
  if (played) {
    return {
      ok: false,
      message: t("error.resetHasPlayed"),
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
    return { ok: false, message: t("error.sourceSeasonMissing") };
  }
  const trimmedName = String(newName || "").trim();
  if (!trimmedName) {
    return { ok: false, message: t("error.newSeasonNameRequired") };
  }
  const playerIds = Array.isArray(source.playerIds) ? source.playerIds.slice() : [];
  const stillExisting = playerIds.filter((playerId) =>
    Boolean(findPlayerById(state, playerId))
  );
  if (stillExisting.length < 2) {
    return {
      ok: false,
      message: t("error.newSeasonPlayers"),
    };
  }
  return createDraftSeasonInState(state, trimmedName, stillExisting);
}

function getActiveSeasonOrNull(state) {
  return state.seasons.find((season) => season.status === "active") || null;
}

function canReplacePlayerInSeason(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  if (!season || season.status !== "active") {
    return false;
  }
  if (typeof getSeasonChampionPlayerIdOrNull === "function") {
    if (getSeasonChampionPlayerIdOrNull(state, seasonId)) {
      return false;
    }
  }
  return true;
}

function listPlayersInSeasonSortedByName(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  const ids = season && Array.isArray(season.playerIds) ? season.playerIds : [];
  const players = ids
    .map((playerId) => findPlayerById(state, playerId))
    .filter(Boolean);
  players.sort((a, b) =>
    getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), undefined, {
      sensitivity: "base",
    }),
  );
  return players;
}

function listPlayersAvailableToJoinSeason(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  const inSeason = new Set(
    season && Array.isArray(season.playerIds) ? season.playerIds : [],
  );
  const players = listAllPlayersSortedByCreatedAt(state).filter(
    (player) => !inSeason.has(player.id),
  );
  players.sort((a, b) =>
    getPlayerDisplayName(a).localeCompare(getPlayerDisplayName(b), undefined, {
      sensitivity: "base",
    }),
  );
  return players;
}

function replacePlayerInSeasonInState(
  state,
  seasonId,
  outgoingPlayerId,
  incomingPlayerId,
) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return { ok: false, message: t("error.seasonNotFound") };
  }
  if (season.status !== "active") {
    return { ok: false, message: t("error.replaceSeasonNotActive") };
  }
  if (
    typeof getSeasonChampionPlayerIdOrNull === "function" &&
    getSeasonChampionPlayerIdOrNull(state, seasonId)
  ) {
    return { ok: false, message: t("error.replaceSeasonChampionSet") };
  }
  const outgoingId = String(outgoingPlayerId || "").trim();
  const incomingId = String(incomingPlayerId || "").trim();
  if (!outgoingId || !incomingId) {
    return { ok: false, message: t("error.replacePickBoth") };
  }
  if (outgoingId === incomingId) {
    return { ok: false, message: t("error.replaceSamePlayer") };
  }
  const playerIds = Array.isArray(season.playerIds) ? season.playerIds : [];
  if (!playerIds.includes(outgoingId)) {
    return { ok: false, message: t("error.replaceOutgoingNotInSeason") };
  }
  if (playerIds.includes(incomingId)) {
    return { ok: false, message: t("error.replaceIncomingInSeason") };
  }
  const outgoingPlayer = findPlayerById(state, outgoingId);
  const incomingPlayer = findPlayerById(state, incomingId);
  if (!outgoingPlayer || !incomingPlayer) {
    return { ok: false, message: t("error.playerNotFound") };
  }
  const nextState = cloneDeepJson(state);
  const seasonIndex = nextState.seasons.findIndex((item) => item.id === seasonId);
  if (seasonIndex === -1) {
    return { ok: false, message: t("error.seasonNotFound") };
  }
  const nextPlayerIds = playerIds.map((id) =>
    id === outgoingId ? incomingId : id,
  );
  nextState.seasons[seasonIndex] = {
    ...nextState.seasons[seasonIndex],
    playerIds: nextPlayerIds,
    participantCount: nextPlayerIds.length,
  };
  nextState.matches = nextState.matches.map((match) => {
    if (match.seasonId !== seasonId || match.matchKind === "oneVsOne") {
      return match;
    }
    let changed = false;
    const nextMatch = { ...match };
    if (nextMatch.homePlayerId === outgoingId) {
      nextMatch.homePlayerId = incomingId;
      nextMatch.homeTeamId = incomingPlayer.teamId;
      changed = true;
    }
    if (nextMatch.awayPlayerId === outgoingId) {
      nextMatch.awayPlayerId = incomingId;
      nextMatch.awayTeamId = incomingPlayer.teamId;
      changed = true;
    }
    return changed ? nextMatch : match;
  });
  return {
    ok: true,
    state: nextState,
    outgoingPlayer,
    incomingPlayer,
  };
}

function deleteSeasonFromState(state, seasonId) {
  const id = String(seasonId || "").trim();
  if (!id) {
    return { ok: false, message: t("error.seasonNotFound") };
  }
  const season = findSeasonById(state, id);
  if (!season) {
    return { ok: false, message: t("error.seasonNotFound") };
  }
  const nextState = cloneDeepJson(state);
  nextState.seasons = nextState.seasons.filter((item) => item.id !== id);
  nextState.matches = nextState.matches.filter((match) => match.seasonId !== id);
  return { ok: true, state: nextState };
}
