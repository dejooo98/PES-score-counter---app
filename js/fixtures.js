/**
 * Round-robin schedule generation and match result persistence.
 */

function rotateTeamsArrayForRoundRobin(teams) {
  const fixedParticipant = teams[0];
  const rotatingParticipants = teams.slice(1);
  rotatingParticipants.unshift(rotatingParticipants.pop());
  return [fixedParticipant, ...rotatingParticipants];
}

function buildRandomizedRoundRobinRounds(participantIds) {
  const teams = participantIds.slice();
  shuffleArrayInPlace(teams);
  const isOdd = teams.length % 2 === 1;
  if (isOdd) {
    teams.push(null);
  }
  const teamCount = teams.length;
  const roundCount = teamCount - 1;
  const halfSize = teamCount / 2;
  const rounds = [];
  let currentTeams = teams.slice();
  for (let roundIndex = 0; roundIndex < roundCount; roundIndex += 1) {
    const roundMatches = [];
    for (let pairIndex = 0; pairIndex < halfSize; pairIndex += 1) {
      const homeParticipant = currentTeams[pairIndex];
      const awayParticipant = currentTeams[teamCount - 1 - pairIndex];
      if (homeParticipant !== null && awayParticipant !== null) {
        const swapSides = Math.random() < 0.5;
        roundMatches.push({
          homePlayerId: swapSides ? awayParticipant : homeParticipant,
          awayPlayerId: swapSides ? homeParticipant : awayParticipant,
        });
      }
    }
    shuffleArrayInPlace(roundMatches);
    rounds.push(roundMatches);
    currentTeams = rotateTeamsArrayForRoundRobin(currentTeams);
  }
  shuffleArrayInPlace(rounds);
  return rounds;
}

function expandRoundsForDoubleRoundRobin(rounds) {
  const secondLeg = rounds.map((round) =>
    round.map((match) => ({
      homePlayerId: match.awayPlayerId,
      awayPlayerId: match.homePlayerId,
    }))
  );
  shuffleArrayInPlace(secondLeg);
  return rounds.concat(secondLeg);
}

function attachTeamIdsToMatchSkeleton(state, matchSkeleton) {
  const homePlayer = findPlayerById(state, matchSkeleton.homePlayerId);
  const awayPlayer = findPlayerById(state, matchSkeleton.awayPlayerId);
  if (!homePlayer || !awayPlayer) {
    return null;
  }
  return {
    homeTeamId: homePlayer.teamId,
    awayTeamId: awayPlayer.teamId,
  };
}

function generateLeagueFixturesForSeason(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return { ok: false, message: t("error.fixtureSeasonNotFound") };
  }
  if (season.status !== "draft") {
    return {
      ok: false,
      message: t("error.fixtureDraftOnly"),
    };
  }
  const existingForSeason = state.matches.filter(
    (match) => match.seasonId === seasonId
  );
  if (existingForSeason.length > 0) {
    return {
      ok: false,
      message: t("error.fixtureExists"),
    };
  }
  const playerIds = Array.isArray(season.playerIds) ? season.playerIds : [];
  if (playerIds.length < 2) {
    return { ok: false, message: t("error.fixtureMinPlayers") };
  }
  let rounds = buildRandomizedRoundRobinRounds(playerIds);
  if (season.isDoubleRoundRobin) {
    rounds = expandRoundsForDoubleRoundRobin(rounds);
  }
  const newMatches = [];
  let roundNumber = 1;
  for (const round of rounds) {
    for (const skeleton of round) {
      const teamInfo = attachTeamIdsToMatchSkeleton(state, skeleton);
      if (!teamInfo) {
        return { ok: false, message: t("error.fixtureTeamLink") };
      }
      newMatches.push({
        id: generateUniqueId(),
        seasonId,
        round: roundNumber,
        homePlayerId: skeleton.homePlayerId,
        awayPlayerId: skeleton.awayPlayerId,
        homeTeamId: teamInfo.homeTeamId,
        awayTeamId: teamInfo.awayTeamId,
        status: "scheduled",
        homeScore: null,
        awayScore: null,
        playedAt: null,
      });
    }
    roundNumber += 1;
  }
  const nextState = cloneDeepJson(state);
  nextState.matches = nextState.matches.concat(newMatches);
  const seasonIndex = nextState.seasons.findIndex((item) => item.id === seasonId);
  const totalRounds = rounds.length;
  nextState.seasons[seasonIndex] = {
    ...nextState.seasons[seasonIndex],
    roundCount: totalRounds,
    participantCount: playerIds.length,
    status: "active",
  };
  return { ok: true, state: nextState, createdMatchesCount: newMatches.length };
}

function findMatchById(state, matchId) {
  return state.matches.find((match) => match.id === matchId) || null;
}

function listMatchesForSeason(state, seasonId) {
  return state.matches
    .filter((match) => match.seasonId === seasonId)
    .sort((a, b) => {
      if (a.round !== b.round) {
        return a.round - b.round;
      }
      return String(a.id).localeCompare(String(b.id));
    });
}

function parseMatchDisciplineFromResultForm(form) {
  if (!form || !(form instanceof HTMLFormElement)) {
    return { cards: [], injured: [] };
  }
  const cards = [];
  form.querySelectorAll("[data-pes-card-row]").forEach((row) => {
    const nameInput = row.querySelector(".pes-card-player-name");
    const playerName = String(nameInput && nameInput.value ? nameInput.value : "").trim();
    if (!playerName) {
      return;
    }
    const yEl = row.querySelector(".pes-card-yellow");
    let yellow = Number.parseInt(String(yEl && yEl.value != null ? yEl.value : "0"), 10);
    if (!Number.isFinite(yellow) || yellow < 0) {
      yellow = 0;
    }
    if (yellow > 2) {
      yellow = 2;
    }
    const redEl = row.querySelector(".pes-card-red");
    let red = 0;
    if (redEl && redEl instanceof HTMLInputElement) {
      if (redEl.type === "checkbox") {
        red = redEl.checked ? 1 : 0;
      } else {
        red = Number.parseInt(String(redEl.value != null ? redEl.value : "0"), 10);
        if (!Number.isFinite(red) || red < 0) {
          red = 0;
        }
        if (red > 1) {
          red = 1;
        }
      }
    }
    const carryEl = row.querySelector(".pes-card-carryover");
    cards.push({
      playerName,
      yellow,
      red,
      carryoverNextRound: Boolean(carryEl && carryEl.checked),
    });
  });
  const injured = [];
  form.querySelectorAll("[data-pes-injury-row]").forEach((row) => {
    const nameInput = row.querySelector(".pes-injured-name");
    const playerName = String(nameInput && nameInput.value ? nameInput.value : "").trim();
    if (playerName) {
      injured.push({ playerName });
    }
  });
  return sanitizeMatchDiscipline({ cards, injured });
}

function getCarriedPlayerNamesFromPreviousRound(state, seasonId, round) {
  if (!seasonId || round <= 1) {
    return [];
  }
  const prevMatches = listMatchesForSeason(state, seasonId).filter(
    (m) => m.round === round - 1 && m.status === "played"
  );
  const names = [];
  for (const m of prevMatches) {
    const d = sanitizeMatchDiscipline(m.discipline);
    for (const c of d.cards) {
      if (c.carryoverNextRound && c.playerName) {
        names.push(c.playerName.trim());
      }
    }
  }
  return names;
}

function playerDisplayNameMatchesCarryover(displayName, carriedNames) {
  const a = String(displayName || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (!a) {
    return false;
  }
  return carriedNames.some((raw) => {
    const b = String(raw || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
    if (!b || b.length < 2) {
      return false;
    }
    return a === b || a.includes(b) || b.includes(a);
  });
}

function saveMatchResult(
  state,
  matchId,
  homeScoreInput,
  awayScoreInput,
  disciplinePayload
) {
  const homeScore = parseNonNegativeIntegerOrNull(homeScoreInput);
  const awayScore = parseNonNegativeIntegerOrNull(awayScoreInput);
  if (homeScore === null || awayScore === null) {
    return {
      ok: false,
      message: t("error.scoreInt"),
    };
  }
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: t("error.matchNotFound") };
  }
  const discipline =
    disciplinePayload !== undefined
      ? sanitizeMatchDiscipline(disciplinePayload)
      : { cards: [], injured: [] };
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "played",
    homeScore,
    awayScore,
    playedAt: new Date().toISOString(),
    discipline,
  };
  return { ok: true, state: nextState };
}

function skipMatchToPlayLater(state, matchId) {
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: t("error.matchNotFound") };
  }
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "skipped",
    homeScore: null,
    awayScore: null,
    playedAt: null,
    discipline: null,
  };
  return { ok: true, state: nextState };
}

function revertMatchToScheduled(state, matchId) {
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: t("error.matchNotFound") };
  }
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    playedAt: null,
    discipline: null,
  };
  return { ok: true, state: nextState };
}

function listOneVsOneMatchesSorted(state) {
  return state.matches
    .filter(
      (m) =>
        m.matchKind === "oneVsOne" &&
        m.status === "played" &&
        m.homeScore != null &&
        m.awayScore != null
    )
    .sort((a, b) => {
      const at = new Date(a.playedAt || 0).getTime();
      const bt = new Date(b.playedAt || 0).getTime();
      return bt - at;
    });
}

function recordOneVsOneMatchInState(
  state,
  homePlayerId,
  awayPlayerId,
  homeScoreInput,
  awayScoreInput,
  disciplinePayload
) {
  const homeId = String(homePlayerId || "").trim();
  const awayId = String(awayPlayerId || "").trim();
  if (!homeId || !awayId || homeId === awayId) {
    return { ok: false, message: t("error.oneVsOnePickTwo") };
  }
  const homeScore = parseNonNegativeIntegerOrNull(homeScoreInput);
  const awayScore = parseNonNegativeIntegerOrNull(awayScoreInput);
  if (homeScore === null || awayScore === null) {
    return {
      ok: false,
      message: t("error.scoreInt"),
    };
  }
  const homePlayer = findPlayerById(state, homeId);
  const awayPlayer = findPlayerById(state, awayId);
  if (!homePlayer || !awayPlayer) {
    return { ok: false, message: t("error.playerNotFound") };
  }
  const discipline =
    disciplinePayload !== undefined
      ? sanitizeMatchDiscipline(disciplinePayload)
      : { cards: [], injured: [] };
  const newMatch = {
    id: generateUniqueId(),
    matchKind: "oneVsOne",
    seasonId: null,
    round: 0,
    homePlayerId: homeId,
    awayPlayerId: awayId,
    homeTeamId: homePlayer.teamId,
    awayTeamId: awayPlayer.teamId,
    status: "played",
    homeScore,
    awayScore,
    playedAt: new Date().toISOString(),
    discipline,
  };
  const nextState = cloneDeepJson(state);
  nextState.matches.push(newMatch);
  return { ok: true, state: nextState };
}
