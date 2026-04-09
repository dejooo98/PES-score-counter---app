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
    return { ok: false, message: "Sezona nije pronađena." };
  }
  if (season.status !== "draft") {
    return {
      ok: false,
      message: "Raspored se može generisati samo za sezonu u statusu nacrt.",
    };
  }
  const existingForSeason = state.matches.filter(
    (match) => match.seasonId === seasonId
  );
  if (existingForSeason.length > 0) {
    return {
      ok: false,
      message: "Raspored već postoji. Resetujte sezonu pre ponovnog generisanja.",
    };
  }
  const playerIds = Array.isArray(season.playerIds) ? season.playerIds : [];
  if (playerIds.length < 2) {
    return { ok: false, message: "Premalo učesnika za raspored." };
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
        return { ok: false, message: "Nije moguće povezati timove za meč." };
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

function saveMatchResult(
  state,
  matchId,
  homeScoreInput,
  awayScoreInput
) {
  const homeScore = parseNonNegativeIntegerOrNull(homeScoreInput);
  const awayScore = parseNonNegativeIntegerOrNull(awayScoreInput);
  if (homeScore === null || awayScore === null) {
    return {
      ok: false,
      message: "Rezultat mora biti ceo broj ≥ 0.",
    };
  }
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: "Utakmica nije pronađena." };
  }
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "played",
    homeScore,
    awayScore,
    playedAt: new Date().toISOString(),
  };
  return { ok: true, state: nextState };
}

function skipMatchToPlayLater(state, matchId) {
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: "Utakmica nije pronađena." };
  }
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "skipped",
    homeScore: null,
    awayScore: null,
    playedAt: null,
  };
  return { ok: true, state: nextState };
}

function revertMatchToScheduled(state, matchId) {
  const matchIndex = state.matches.findIndex((item) => item.id === matchId);
  if (matchIndex === -1) {
    return { ok: false, message: "Utakmica nije pronađena." };
  }
  const nextState = cloneDeepJson(state);
  const target = nextState.matches[matchIndex];
  nextState.matches[matchIndex] = {
    ...target,
    status: "scheduled",
    homeScore: null,
    awayScore: null,
    playedAt: null,
  };
  return { ok: true, state: nextState };
}
