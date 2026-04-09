/**
 * League table calculation from played matches only.
 */

function calculateStandingsForSeason(state, seasonId) {
  const season = findSeasonById(state, seasonId);
  if (!season) {
    return [];
  }
  const playerIds = Array.isArray(season.playerIds) ? season.playerIds : [];
  const tableRowsByPlayerId = {};
  for (const playerId of playerIds) {
    tableRowsByPlayerId[playerId] = {
      playerId,
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };
  }
  const playedMatches = state.matches.filter(
    (match) =>
      match.seasonId === seasonId &&
      match.status === "played" &&
      match.homeScore != null &&
      match.awayScore != null
  );
  for (const match of playedMatches) {
    const homeRow = tableRowsByPlayerId[match.homePlayerId];
    const awayRow = tableRowsByPlayerId[match.awayPlayerId];
    if (!homeRow || !awayRow) {
      continue;
    }
    const homeGoals = match.homeScore;
    const awayGoals = match.awayScore;
    homeRow.played += 1;
    awayRow.played += 1;
    homeRow.goalsFor += homeGoals;
    homeRow.goalsAgainst += awayGoals;
    awayRow.goalsFor += awayGoals;
    awayRow.goalsAgainst += homeGoals;
    if (homeGoals > awayGoals) {
      homeRow.wins += 1;
      homeRow.points += 3;
      awayRow.losses += 1;
    } else if (homeGoals < awayGoals) {
      awayRow.wins += 1;
      awayRow.points += 3;
      homeRow.losses += 1;
    } else {
      homeRow.draws += 1;
      awayRow.draws += 1;
      homeRow.points += 1;
      awayRow.points += 1;
    }
  }
  const standings = Object.values(tableRowsByPlayerId).map((row) => ({
    ...row,
    goalDifference: row.goalsFor - row.goalsAgainst,
  }));
  standings.sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    if (b.goalsFor !== a.goalsFor) {
      return b.goalsFor - a.goalsFor;
    }
    return String(a.playerId).localeCompare(String(b.playerId));
  });
  return standings.map((row, index) => ({
    ...row,
    position: index + 1,
  }));
}
