/**
 * Per-player and global statistics derived from played matches.
 */

function listPlayedMatchesForPlayerInSeason(state, seasonId, playerId) {
  return state.matches
    .filter(
      (match) =>
        match.seasonId === seasonId &&
        match.status === "played" &&
        (match.homePlayerId === playerId || match.awayPlayerId === playerId)
    )
    .sort((a, b) => {
      const aTime = new Date(a.playedAt || 0).getTime();
      const bTime = new Date(b.playedAt || 0).getTime();
      return aTime - bTime;
    });
}

function determineOutcomeForPlayer(match, playerId) {
  const isHome = match.homePlayerId === playerId;
  const homeGoals = match.homeScore;
  const awayGoals = match.awayScore;
  if (homeGoals == null || awayGoals == null) {
    return "unknown";
  }
  if (homeGoals === awayGoals) {
    return "draw";
  }
  if (isHome) {
    return homeGoals > awayGoals ? "win" : "loss";
  }
  return awayGoals > homeGoals ? "win" : "loss";
}

function buildFormStringForLastMatches(outcomes, maxMatches) {
  const slice = outcomes.slice(-maxMatches);
  return slice
    .map((outcome) => {
      if (outcome === "win") {
        return "W";
      }
      if (outcome === "draw") {
        return "D";
      }
      if (outcome === "loss") {
        return "L";
      }
      return "?";
    })
    .join(" ");
}

function calculatePlayerStatisticsForSeason(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return [];
  }
  const playerIds = Array.isArray(season.playerIds) ? season.playerIds : [];
  const results = [];
  for (const playerId of playerIds) {
    const matches = listPlayedMatchesForPlayerInSeason(
      state,
      seasonId,
      playerId
    );
    let wins = 0;
    let draws = 0;
    let losses = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;
    const outcomes = [];
    for (const match of matches) {
      const outcome = determineOutcomeForPlayer(match, playerId);
      outcomes.push(outcome);
      if (outcome === "win") {
        wins += 1;
      } else if (outcome === "draw") {
        draws += 1;
      } else if (outcome === "loss") {
        losses += 1;
      }
      if (match.homePlayerId === playerId) {
        goalsFor += match.homeScore;
        goalsAgainst += match.awayScore;
      } else {
        goalsFor += match.awayScore;
        goalsAgainst += match.homeScore;
      }
    }
    const matchCount = matches.length;
    const averageGoalsPerMatch =
      matchCount === 0 ? 0 : goalsFor / matchCount;
    const formLastFive = buildFormStringForLastMatches(outcomes, 5);
    results.push({
      playerId,
      matchCount,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      averageGoalsPerMatch,
      formLastFive,
    });
  }
  return results;
}

function calculateGlobalStatisticsForSeason(state, seasonId) {
  const playedMatches = state.matches.filter(
    (match) =>
      match.seasonId === seasonId &&
      match.status === "played" &&
      match.homeScore != null &&
      match.awayScore != null
  );
  const totalMatches = playedMatches.length;
  let totalGoals = 0;
  for (const match of playedMatches) {
    totalGoals += match.homeScore + match.awayScore;
  }
  const averageGoalsPerMatch =
    totalMatches === 0 ? 0 : totalGoals / totalMatches;
  const standings = calculateStandingsForSeason(state, seasonId);
  const playerStats = calculatePlayerStatisticsForSeason(state, seasonId);
  let bestAttackPlayerId = null;
  let bestAttackGoals = -1;
  for (const row of playerStats) {
    if (row.matchCount === 0) {
      continue;
    }
    if (row.goalsFor > bestAttackGoals) {
      bestAttackGoals = row.goalsFor;
      bestAttackPlayerId = row.playerId;
    }
  }
  let bestDefensePlayerId = null;
  let bestDefenseConceded = Number.POSITIVE_INFINITY;
  for (const row of playerStats) {
    if (row.matchCount === 0) {
      continue;
    }
    if (row.goalsAgainst < bestDefenseConceded) {
      bestDefenseConceded = row.goalsAgainst;
      bestDefensePlayerId = row.playerId;
    }
  }
  const topPointsRow =
    standings.length > 0
      ? standings.reduce((best, row) => {
          if (!best) {
            return row;
          }
          if (row.points > best.points) {
            return row;
          }
          return best;
        }, null)
      : null;
  return {
    totalMatches,
    totalGoals,
    averageGoalsPerMatch,
    bestAttackPlayerId,
    bestAttackGoals: bestAttackPlayerId ? bestAttackGoals : 0,
    bestDefensePlayerId,
    bestDefenseConceded: bestDefensePlayerId ? bestDefenseConceded : 0,
    topPointsPlayerId: topPointsRow ? topPointsRow.playerId : null,
    topPoints: topPointsRow ? topPointsRow.points : 0,
  };
}

function aggregateCareerStatsFromPlayedMatches(playedMatches, playerId) {
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  const opponentCounter = {};
  for (const match of playedMatches) {
    const outcome = determineOutcomeForPlayer(match, playerId);
    if (outcome === "win") {
      wins += 1;
    } else if (outcome === "draw") {
      draws += 1;
    } else if (outcome === "loss") {
      losses += 1;
    }
    const isHome = match.homePlayerId === playerId;
    goalsFor += isHome ? match.homeScore : match.awayScore;
    goalsAgainst += isHome ? match.awayScore : match.homeScore;
    const opponentId = isHome ? match.awayPlayerId : match.homePlayerId;
    opponentCounter[opponentId] = (opponentCounter[opponentId] || 0) + 1;
  }
  const opponentEntries = Object.entries(opponentCounter);
  let mostPlayedAgainstPlayerId = null;
  let mostPlayedAgainstCount = 0;
  for (const [opponentId, count] of opponentEntries) {
    if (count > mostPlayedAgainstCount) {
      mostPlayedAgainstPlayerId = opponentId;
      mostPlayedAgainstCount = count;
    }
  }
  return {
    playedMatches: playedMatches.length,
    goalsFor,
    goalsAgainst,
    goalDifference: goalsFor - goalsAgainst,
    wins,
    draws,
    losses,
    mostPlayedAgainstPlayerId,
    mostPlayedAgainstCount,
  };
}

function filterPlayedCareerMatchesForPlayer(state, playerId, kind) {
  return state.matches.filter((match) => {
    if (
      match.status !== "played" ||
      match.homeScore == null ||
      match.awayScore == null
    ) {
      return false;
    }
    if (match.homePlayerId !== playerId && match.awayPlayerId !== playerId) {
      return false;
    }
    const isDuel = match.matchKind === "oneVsOne";
    if (kind === "league" && isDuel) {
      return false;
    }
    if (kind === "oneVsOne" && !isDuel) {
      return false;
    }
    return true;
  });
}

function calculateCareerProfileStatsForPlayer(state, playerId) {
  const playedMatches = filterPlayedCareerMatchesForPlayer(state, playerId, "league");
  return aggregateCareerStatsFromPlayedMatches(playedMatches, playerId);
}

function calculateOneVsOneProfileStatsForPlayer(state, playerId) {
  const playedMatches = filterPlayedCareerMatchesForPlayer(
    state,
    playerId,
    "oneVsOne"
  );
  return aggregateCareerStatsFromPlayedMatches(playedMatches, playerId);
}
