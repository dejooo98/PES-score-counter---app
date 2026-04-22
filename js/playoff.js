/**
 * Playoff (plej-of) — polufinala 1v4 i 2v3, pa finale.
 * Seedovi se računaju iz tabele (standings). Rezultati se čuvaju na sezoni:
 *   season.playoff = {
 *     sf1: { homeScore, awayScore, penaltyWinner: "home"|"away"|null, playedAt },
 *     sf2: { ... },
 *     final: { ... }
 *   }
 * Pre nego što se odigra ceo regularni deo — bracket se prikazuje kao
 * projekcija (read-only, bez mogućnosti unosa).
 */

const PES_PLAYOFF_STAGES = ["sf1", "sf2", "final"];

function isRegularSeasonFullyPlayed(state, seasonId) {
	if (!seasonId) {
		return false;
	}
	const season = findSeasonById(state, seasonId);
	if (!season) {
		return false;
	}
	const seasonMatches = state.matches.filter(
		(match) => match.seasonId === seasonId && match.matchKind !== "oneVsOne",
	);
	if (seasonMatches.length === 0) {
		return false;
	}
	return seasonMatches.every((match) => match.status === "played");
}

function getPlayoffSeedsFromStandings(state, seasonId) {
	if (!seasonId) {
		return [];
	}
	const standings =
		typeof calculateStandingsForSeason === "function"
			? calculateStandingsForSeason(state, seasonId)
			: [];
	return standings.slice(0, 4).map((row) => row.playerId);
}

function ensurePlayoffStructure(season) {
	const base = {
		sf1: null,
		sf2: null,
		final: null,
	};
	if (!season || !season.playoff) {
		return base;
	}
	return {
		sf1: season.playoff.sf1 || null,
		sf2: season.playoff.sf2 || null,
		final: season.playoff.final || null,
	};
}

function getStageWinnerPlayerId(stageData, homePlayerId, awayPlayerId) {
	if (!stageData || !homePlayerId || !awayPlayerId) {
		return null;
	}
	if (stageData.homeScore == null || stageData.awayScore == null) {
		return null;
	}
	if (stageData.homeScore > stageData.awayScore) {
		return homePlayerId;
	}
	if (stageData.awayScore > stageData.homeScore) {
		return awayPlayerId;
	}
	if (stageData.penaltyWinner === "home") {
		return homePlayerId;
	}
	if (stageData.penaltyWinner === "away") {
		return awayPlayerId;
	}
	return null;
}

/**
 * Glavna struktura bracket-a za prikaz/obradu.
 */
function getPlayoffBracketForSeason(state, seasonId) {
	const season = findSeasonById(state, seasonId);
	const seeds = getPlayoffSeedsFromStandings(state, seasonId);
	const hasEnoughSeeds = seeds.length >= 4;
	const fullyPlayed = isRegularSeasonFullyPlayed(state, seasonId);
	const phase = !hasEnoughSeeds
		? "empty"
		: fullyPlayed
			? "active"
			: "projection";
	const stored = ensurePlayoffStructure(season);

	const seed1 = seeds[0] || null;
	const seed2 = seeds[1] || null;
	const seed3 = seeds[2] || null;
	const seed4 = seeds[3] || null;

	const sf1 = {
		stage: "sf1",
		seedHomeLabel: 1,
		seedAwayLabel: 4,
		homePlayerId: seed1,
		awayPlayerId: seed4,
		data: phase === "active" ? stored.sf1 : null,
	};
	sf1.winnerPlayerId = getStageWinnerPlayerId(
		sf1.data,
		sf1.homePlayerId,
		sf1.awayPlayerId,
	);

	const sf2 = {
		stage: "sf2",
		seedHomeLabel: 2,
		seedAwayLabel: 3,
		homePlayerId: seed2,
		awayPlayerId: seed3,
		data: phase === "active" ? stored.sf2 : null,
	};
	sf2.winnerPlayerId = getStageWinnerPlayerId(
		sf2.data,
		sf2.homePlayerId,
		sf2.awayPlayerId,
	);

	const finalHomePlayerId =
		phase === "active" ? sf1.winnerPlayerId : null;
	const finalAwayPlayerId =
		phase === "active" ? sf2.winnerPlayerId : null;

	const finalStage = {
		stage: "final",
		homePlayerId: finalHomePlayerId,
		awayPlayerId: finalAwayPlayerId,
		data:
			phase === "active" && sf1.winnerPlayerId && sf2.winnerPlayerId
				? stored.final
				: null,
		canEnter:
			phase === "active" &&
			Boolean(sf1.winnerPlayerId) &&
			Boolean(sf2.winnerPlayerId),
	};
	finalStage.winnerPlayerId = getStageWinnerPlayerId(
		finalStage.data,
		finalStage.homePlayerId,
		finalStage.awayPlayerId,
	);

	return {
		phase,
		seeds: { first: seed1, second: seed2, third: seed3, fourth: seed4 },
		sf1,
		sf2,
		final: finalStage,
		championPlayerId: finalStage.winnerPlayerId || null,
	};
}

function parsePlayoffScore(input) {
	if (typeof parseNonNegativeIntegerOrNull === "function") {
		return parseNonNegativeIntegerOrNull(input);
	}
	const n = Number.parseInt(String(input != null ? input : ""), 10);
	return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * Perzistira rezultat za SF1 / SF2 / Final. Očekuje se da je regularni deo odigran.
 * Ako je rezultat nerešen, penaltyWinner ("home" | "away") je obavezan.
 * Čuvanje brisa kasnije faze ako se ranija promeni (finale se reseta kad se promeni SF).
 */
function setPlayoffStageResultInState(
	state,
	seasonId,
	stage,
	homeScoreInput,
	awayScoreInput,
	penaltyWinner,
) {
	if (!PES_PLAYOFF_STAGES.includes(stage)) {
		return { ok: false, message: t("playoff.err.badStage") };
	}
	const season = findSeasonById(state, seasonId);
	if (!season) {
		return { ok: false, message: t("error.seasonNotFound") };
	}
	if (!isRegularSeasonFullyPlayed(state, seasonId)) {
		return { ok: false, message: t("playoff.err.notReady") };
	}
	const bracket = getPlayoffBracketForSeason(state, seasonId);
	if (stage === "final" && !bracket.final.canEnter) {
		return { ok: false, message: t("playoff.err.finalBlocked") };
	}
	const home = parsePlayoffScore(homeScoreInput);
	const away = parsePlayoffScore(awayScoreInput);
	if (home === null || away === null) {
		return { ok: false, message: t("error.scoreInt") };
	}
	let winner = null;
	if (home === away) {
		if (penaltyWinner !== "home" && penaltyWinner !== "away") {
			return { ok: false, message: t("playoff.err.penaltyPick") };
		}
		winner = penaltyWinner;
	}
	const nextState = cloneDeepJson(state);
	const seasonIndex = nextState.seasons.findIndex(
		(item) => item.id === seasonId,
	);
	if (seasonIndex === -1) {
		return { ok: false, message: t("error.seasonNotFound") };
	}
	const playoff = {
		sf1: nextState.seasons[seasonIndex].playoff?.sf1 || null,
		sf2: nextState.seasons[seasonIndex].playoff?.sf2 || null,
		final: nextState.seasons[seasonIndex].playoff?.final || null,
	};
	playoff[stage] = {
		homeScore: home,
		awayScore: away,
		penaltyWinner: winner,
		playedAt: new Date().toISOString(),
	};
	if (stage === "sf1" || stage === "sf2") {
		playoff.final = null;
	}
	nextState.seasons[seasonIndex] = {
		...nextState.seasons[seasonIndex],
		playoff,
	};
	return { ok: true, state: nextState };
}

function getSeasonChampionPlayerIdOrNull(state, seasonId) {
	const bracket =
		typeof getPlayoffBracketForSeason === "function"
			? getPlayoffBracketForSeason(state, seasonId)
			: null;
	if (!bracket) {
		return null;
	}
	return bracket.championPlayerId || null;
}

function listChampionshipTitlesForPlayer(state, playerId) {
	if (!playerId || !state || !Array.isArray(state.seasons)) {
		return [];
	}
	const titles = [];
	for (const season of state.seasons) {
		if (!season || !season.id) {
			continue;
		}
		const champ = getSeasonChampionPlayerIdOrNull(state, season.id);
		if (champ && champ === playerId) {
			titles.push({
				seasonId: season.id,
				seasonName: season.name || "",
				at:
					(season.playoff &&
						season.playoff.final &&
						season.playoff.final.playedAt) ||
					null,
			});
		}
	}
	titles.sort((a, b) => {
		const at = a.at ? new Date(a.at).getTime() : 0;
		const bt = b.at ? new Date(b.at).getTime() : 0;
		return bt - at;
	});
	return titles;
}

function getChampionshipCountForPlayer(state, playerId) {
	return listChampionshipTitlesForPlayer(state, playerId).length;
}

/**
 * SVG za "Zlatni penis" trofej. size = 'hero' | 'md' | 'inline'.
 * Napomena: namerno stilizovan (pegla + glave + baza), zlatni gradient + odsjaj.
 */
function buildGoldenPenisTrophySvg(size) {
	const kind = size === "inline" ? "inline" : size === "md" ? "md" : "hero";
	const width = kind === "inline" ? 18 : kind === "md" ? 28 : 120;
	const height = kind === "inline" ? 26 : kind === "md" ? 40 : 170;
	const ariaLabel =
		typeof t === "function" ? t("playoff.trophy.name") : "Zlatni penis";
	const uid = `p${Math.random().toString(36).slice(2, 8)}`;
	return `
    <svg viewBox="0 0 120 170" width="${width}" height="${height}" role="img" aria-label="${ariaLabel}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${uid}-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fff7b0"/>
          <stop offset="35%" stop-color="#f3d554"/>
          <stop offset="70%" stop-color="#c4911a"/>
          <stop offset="100%" stop-color="#6b4a0a"/>
        </linearGradient>
        <linearGradient id="${uid}-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="50%" stop-color="#ffffff" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
        </linearGradient>
        <radialGradient id="${uid}-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6c8" stop-opacity="0.85"/>
          <stop offset="100%" stop-color="#fff6c8" stop-opacity="0"/>
        </radialGradient>
        <filter id="${uid}-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2"/>
        </filter>
      </defs>
      <!-- Glow halo -->
      <ellipse cx="60" cy="78" rx="56" ry="70" fill="url(#${uid}-glow)"/>
      <!-- Pedestal (classic trophy base) -->
      <rect x="22" y="150" width="76" height="12" rx="2" fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.5"/>
      <rect x="32" y="140" width="56" height="12" rx="1.5" fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.5"/>
      <!-- Base balls (pair) -->
      <ellipse cx="46" cy="128" rx="16" ry="14" fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.5"/>
      <ellipse cx="74" cy="128" rx="16" ry="14" fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.5"/>
      <!-- Shaft -->
      <path d="M44 128
               C 44 90, 42 60, 48 38
               C 54 20, 66 20, 72 38
               C 78 60, 76 90, 76 128
               Z"
            fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.6"/>
      <!-- Glans (rounded head) -->
      <ellipse cx="60" cy="30" rx="17" ry="19" fill="url(#${uid}-gold)" stroke="#5c4810" stroke-width="1.6"/>
      <!-- Crown ridge where glans meets shaft -->
      <path d="M45 40 Q 60 52 75 40" fill="none" stroke="#5c4810" stroke-width="1.3" opacity="0.75"/>
      <!-- Tip detail -->
      <path d="M60 14 L60 22" stroke="#5c4810" stroke-width="1.6" stroke-linecap="round"/>
      <!-- Shine stripe -->
      <rect x="47" y="30" width="5" height="92" rx="2.5" fill="url(#${uid}-shine)" filter="url(#${uid}-soft)"/>
      <!-- Star highlights -->
      <circle cx="68" cy="24" r="1.8" fill="#fff6d6"/>
      <circle cx="40" cy="126" r="1.4" fill="#fff6d6"/>
      <!-- Subtle base rim -->
      <rect x="22" y="150" width="76" height="3" fill="#fff6a8" opacity="0.6"/>
    </svg>
  `;
}

function buildPlayerChampionshipBadgesHtml(state, playerId, options) {
	const count =
		typeof getChampionshipCountForPlayer === "function"
			? getChampionshipCountForPlayer(state, playerId)
			: 0;
	if (!count) {
		return "";
	}
	const opts = options || {};
	const size = opts.size || "inline";
	const trophyName =
		typeof t === "function" ? t("playoff.trophy.name") : "Zlatni penis";
	const titleText =
		typeof t === "function"
			? t("playoff.badge.title", { n: String(count), trophy: trophyName })
			: `${trophyName} × ${count}`;

	if (count <= 3) {
		const icons = Array.from({ length: count })
			.map(() => buildGoldenPenisTrophySvg(size))
			.join("");
		return `<span class="pes-champ-badges" title="${escapeHtmlSafe(titleText)}" aria-label="${escapeHtmlSafe(titleText)}">${icons}</span>`;
	}
	return `<span class="pes-champ-badges pes-champ-badges--compact" title="${escapeHtmlSafe(titleText)}" aria-label="${escapeHtmlSafe(titleText)}">${buildGoldenPenisTrophySvg(size)}<span class="pes-champ-badges__count">×${count}</span></span>`;
}

function escapeHtmlSafe(value) {
	if (typeof escapeHtml === "function") {
		return escapeHtml(value);
	}
	return String(value == null ? "" : value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function clearPlayoffStageInState(state, seasonId, stage) {
	if (!PES_PLAYOFF_STAGES.includes(stage)) {
		return { ok: false, message: t("playoff.err.badStage") };
	}
	const nextState = cloneDeepJson(state);
	const seasonIndex = nextState.seasons.findIndex(
		(item) => item.id === seasonId,
	);
	if (seasonIndex === -1) {
		return { ok: false, message: t("error.seasonNotFound") };
	}
	const playoff = {
		sf1: nextState.seasons[seasonIndex].playoff?.sf1 || null,
		sf2: nextState.seasons[seasonIndex].playoff?.sf2 || null,
		final: nextState.seasons[seasonIndex].playoff?.final || null,
	};
	playoff[stage] = null;
	if (stage === "sf1" || stage === "sf2") {
		playoff.final = null;
	}
	nextState.seasons[seasonIndex] = {
		...nextState.seasons[seasonIndex],
		playoff,
	};
	return { ok: true, state: nextState };
}
