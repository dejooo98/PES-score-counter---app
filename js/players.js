/**
 * Player (member) domain operations.
 */

function listAllPlayersSortedByCreatedAt(state) {
  const players = Array.isArray(state.players) ? state.players.slice() : [];
  players.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    return aTime - bTime;
  });
  return players;
}

function findPlayerById(state, playerId) {
  return state.players.find((player) => player.id === playerId) || null;
}

function countPlayedMatchesForPlayer(state, playerId) {
  return state.matches.filter((match) => {
    if (match.status !== "played") {
      return false;
    }
    return match.homePlayerId === playerId || match.awayPlayerId === playerId;
  }).length;
}

function addPlayerWithTeamChoice(
  state,
  firstName,
  lastNameOrNickname,
  existingTeamId,
  newTeamName,
  avatarDataUrl
) {
  const resolved = resolveOrCreateTeamForPlayer(
    state,
    newTeamName,
    existingTeamId
  );
  if (!resolved.ok) {
    return resolved;
  }
  return addPlayerToState(
    resolved.state,
    firstName,
    lastNameOrNickname,
    resolved.team.id,
    avatarDataUrl
  );
}

function addPlayerToState(
  state,
  firstName,
  lastNameOrNickname,
  teamId,
  avatarDataUrl
) {
  const trimmedFirst = String(firstName || "").trim();
  if (!trimmedFirst) {
    return { ok: false, message: "Ime je obavezno." };
  }
  const team = findTeamById(state, teamId);
  if (!team) {
    return { ok: false, message: "Izaberite validan tim." };
  }
  const newPlayer = {
    id: generateUniqueId(),
    firstName: trimmedFirst,
    lastNameOrNickname: String(lastNameOrNickname || "").trim(),
    teamId,
    avatarDataUrl: sanitizePlayerAvatarDataUrl(avatarDataUrl),
    createdAt: new Date().toISOString(),
  };
  const nextState = cloneDeepJson(state);
  nextState.players.push(newPlayer);
  return { ok: true, state: nextState, player: newPlayer };
}

function updatePlayerInState(
  state,
  playerId,
  firstName,
  lastNameOrNickname,
  teamId,
  avatarDataUrl
) {
  const trimmedFirst = String(firstName || "").trim();
  if (!trimmedFirst) {
    return { ok: false, message: "Ime je obavezno." };
  }
  const team = findTeamById(state, teamId);
  if (!team) {
    return { ok: false, message: "Izaberite validan tim." };
  }
  const index = state.players.findIndex((player) => player.id === playerId);
  if (index === -1) {
    return { ok: false, message: "Igrač nije pronađen." };
  }
  const nextState = cloneDeepJson(state);
  nextState.players[index] = {
    ...nextState.players[index],
    firstName: trimmedFirst,
    lastNameOrNickname: String(lastNameOrNickname || "").trim(),
    teamId,
    avatarDataUrl: sanitizePlayerAvatarDataUrl(avatarDataUrl),
  };
  return { ok: true, state: nextState };
}

function deletePlayerFromState(state, playerId) {
  const playedCount = countPlayedMatchesForPlayer(state, playerId);
  if (playedCount > 0) {
    return {
      ok: false,
      message:
        "Brisanje nije dozvoljeno jer igrač ima odigrane utakmice. Uklonite ili izmenite rezultate prvo.",
    };
  }
  const matchRefs = state.matches.some(
    (match) =>
      match.homePlayerId === playerId || match.awayPlayerId === playerId
  );
  if (matchRefs) {
    return {
      ok: false,
      message:
        "Igrač se pojavljuje u rasporedu. Resetujte sezonu ili obrišite utakmice pre brisanja igrača.",
    };
  }
  const nextState = cloneDeepJson(state);
  nextState.players = nextState.players.filter((player) => player.id !== playerId);
  nextState.seasons = nextState.seasons.map((season) => ({
    ...season,
    playerIds: Array.isArray(season.playerIds)
      ? season.playerIds.filter((id) => id !== playerId)
      : [],
    participantCount: Array.isArray(season.playerIds)
      ? season.playerIds.filter((id) => id !== playerId).length
      : 0,
  }));
  return { ok: true, state: nextState };
}

function filterPlayersBySearchQuery(players, query) {
  const trimmed = String(query || "").trim().toLowerCase();
  if (!trimmed) {
    return players.slice();
  }
  return players.filter((player) => {
    const full = `${player.firstName} ${player.lastNameOrNickname}`.toLowerCase();
    return full.includes(trimmed);
  });
}

function getPlayerDisplayName(player) {
  if (!player) {
    return "—";
  }
  const last = String(player.lastNameOrNickname || "").trim();
  if (!last) {
    return player.firstName;
  }
  return `${player.firstName} ${last}`;
}
