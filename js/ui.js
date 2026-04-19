/**
 * Presentation layer: builds DOM from application state (no business rules).
 */

const PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY = "pesLeagueSelectedSeasonId_v1";
const PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY =
	"pesLeagueSelectedPlayerProfileId_v1";

function getSelectedSeasonIdFromSession() {
	try {
		return window.sessionStorage.getItem(
			PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY,
		);
	} catch {
		return null;
	}
}

function setSelectedSeasonIdToSession(seasonId) {
	try {
		if (!seasonId) {
			window.sessionStorage.removeItem(PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY);
			return;
		}
		window.sessionStorage.setItem(
			PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY,
			seasonId,
		);
	} catch {
		// ignore
	}
}

function getSelectedPlayerProfileIdFromSession() {
	try {
		return window.sessionStorage.getItem(
			PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY,
		);
	} catch {
		return null;
	}
}

function setSelectedPlayerProfileIdToSession(playerId) {
	try {
		if (!playerId) {
			window.sessionStorage.removeItem(
				PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY,
			);
			return;
		}
		window.sessionStorage.setItem(
			PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY,
			playerId,
		);
	} catch {
		// ignore
	}
}

function resolveSelectedSeasonId(state) {
	const stored = getSelectedSeasonIdFromSession();
	if (stored && findSeasonById(state, stored)) {
		return stored;
	}
	const seasons = listAllSeasonsSortedByCreatedAt(state);
	return seasons.length > 0 ? seasons[0].id : null;
}

window.resolveSelectedSeasonId = resolveSelectedSeasonId;

function setViewHash(viewId) {
	window.location.hash = `#/${viewId}`;
}

function getViewIdFromHash() {
	const raw = window.location.hash.replace(/^#\/?/, "").trim();
	if (!raw) {
		return "dashboard";
	}
	return raw.split("/")[0] || "dashboard";
}

window.getViewIdFromHash = getViewIdFromHash;

function showOnlySection(viewId) {
	const sections = document.querySelectorAll("[data-pes-section]");
	sections.forEach((section) => {
		const isMatch = section.getAttribute("data-pes-section") === viewId;
		section.classList.toggle("hidden", !isMatch);
	});
	const navLinks = document.querySelectorAll("[data-pes-nav]");
	navLinks.forEach((link) => {
		const isMatch = link.getAttribute("data-pes-nav") === viewId;
		link.classList.toggle("bg-indigo-600", isMatch);
		link.classList.toggle("text-white", isMatch);
		link.classList.toggle("pes6-nav--active", isMatch);
	});
}

function fillSeasonSelectElement(selectElement, state, selectedSeasonId) {
	if (!selectElement) {
		return;
	}
	const previous = selectedSeasonId;
	selectElement.innerHTML = "";
	const seasons = listAllSeasonsSortedByCreatedAt(state);
	const placeholder = document.createElement("option");
	placeholder.value = "";
	placeholder.textContent = t("header.chooseSeason");
	selectElement.appendChild(placeholder);
	for (const season of seasons) {
		const option = document.createElement("option");
		option.value = season.id;
		option.textContent = `${season.name} (${translateSeasonStatus(season.status)})`;
		selectElement.appendChild(option);
	}
	if (previous && seasons.some((season) => season.id === previous)) {
		selectElement.value = previous;
	}
}

function renderDashboardView(state, selectedSeasonId) {
	const root = document.getElementById("pes-dashboard-root");
	if (!root) {
		return;
	}
	const playersCount = state.players.length;
	const teamsCount = state.teams.length;
	const seasonsCount = state.seasons.length;
	const season = selectedSeasonId
		? findSeasonById(state, selectedSeasonId)
		: null;
	const matchesForSeason = season ? listMatchesForSeason(state, season.id) : [];
	const playedCount = matchesForSeason.filter(
		(match) => match.status === "played",
	).length;
	const scheduledCount = matchesForSeason.filter(
		(match) => match.status === "scheduled",
	).length;
	const skippedCount = matchesForSeason.filter(
		(match) => match.status === "skipped",
	).length;
	const snapshotHtml = buildDashboardSeasonSnapshotHtml(
		state,
		selectedSeasonId,
	);
	const recentPlayedHtml = buildDashboardRecentPlayedHtml(
		state,
		selectedSeasonId,
	);
	const randomPickerHtml = buildDashboardRandomPickerHtml();
	root.innerHTML = `
    <div class="pes6-dashboard-stats grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
      ${renderStatCard(t("dash.tile.players"), String(playersCount), t("dash.tile.playersSub"))}
      ${renderStatCard(t("dash.tile.teams"), String(teamsCount), t("dash.tile.teamsSub"))}
      ${renderStatCard(t("dash.tile.seasons"), String(seasonsCount), t("dash.tile.seasonsSub"))}
      ${renderStatCard(
				t("dash.tile.activeSeason"),
				season ? escapeHtml(season.name) : t("common.dash"),
				season
					? t("dash.tile.seasonDetail", {
							status: translateSeasonStatus(season.status),
							rounds: String(season.roundCount),
							played: String(playedCount),
							total: String(matchesForSeason.length),
							sched: String(scheduledCount),
							skip: String(skippedCount),
						})
					: t("dash.tile.pickSeason"),
			)}
    </div>
    ${snapshotHtml}
    ${recentPlayedHtml}
    ${randomPickerHtml}
    <div class="pes6-menu-panel mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="pes6-panel-title text-sm font-semibold text-slate-800">${escapeHtml(t("dash.quickTitle"))}</h3>
      <ol class="pes6-help-list mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
        <li>${escapeHtml(t("dash.help1"))}</li>
        <li>${escapeHtml(t("dash.help2"))}</li>
        <li>${escapeHtml(t("dash.help3"))}</li>
        <li>${escapeHtml(t("dash.help4"))}</li>
      </ol>
    </div>
  `;
}

function renderStatCard(title, value, subtitle) {
	return `
    <div class="pes6-stat-tile rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
      <div class="pes6-stat-tile__inner">
        <div class="pes6-stat-tile__label text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">${escapeHtml(
					title,
				)}</div>
        <div class="pes6-stat-tile__value text-2xl font-bold text-slate-900">${value}</div>
        <div class="pes6-stat-tile__hint text-xs text-slate-500">${escapeHtml(subtitle)}</div>
      </div>
    </div>
  `;
}

function buildDashboardSeasonSnapshotHtml(state, selectedSeasonId) {
	if (!selectedSeasonId) {
		return `<div class="pes6-dashboard-snapshot mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">${escapeHtml(
			t("dash.snapshotNeedSeason"),
		)}</div>`;
	}
	const season = findSeasonById(state, selectedSeasonId);
	if (!season) {
		return `<div class="pes6-dashboard-snapshot mt-6 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-800">${escapeHtml(
			t("common.seasonNotFound"),
		)}</div>`;
	}
	const standings = calculateStandingsForSeason(state, season.id);
	const matches = listMatchesForSeason(state, season.id);
	const playedInSeason = matches.filter((m) => m.status === "played").length;
	const upcoming = matches.filter((m) => m.status === "scheduled").slice(0, 8);

	let leaderInner = "";
	if (!standings.length) {
		leaderInner = `<p class="text-sm text-slate-500">${escapeHtml(t("dash.leaderNoTable"))}</p>`;
	} else {
		const top = standings[0];
		const leaderPlayer = findPlayerById(state, top.playerId);
		const name = leaderPlayer ? getPlayerDisplayName(leaderPlayer) : "—";
		const diffStr =
			top.goalDifference > 0
				? `+${top.goalDifference}`
				: String(top.goalDifference);
		if (playedInSeason === 0) {
			leaderInner = `<p class="text-sm text-slate-700">${t(
				"dash.leaderBeforeFirstMatch",
				{
					name: escapeHtml(name),
				},
			)}</p>`;
		} else {
			leaderInner = `<p class="text-sm text-slate-700">${t(
				"dash.leaderSummary",
				{
					name: escapeHtml(name),
					points: String(top.points),
					played: String(top.played),
					diff: diffStr,
				},
			)}</p>`;
		}
	}

	const upcomingItems =
		upcoming.length === 0
			? `<li class="text-sm text-slate-500">${escapeHtml(t("dash.upcomingEmpty"))}</li>`
			: upcoming
					.map((m) => {
						const hp = findPlayerById(state, m.homePlayerId);
						const ap = findPlayerById(state, m.awayPlayerId);
						const hn = hp ? getPlayerDisplayName(hp) : "—";
						const an = ap ? getPlayerDisplayName(ap) : "—";
						return `<li class="text-sm text-slate-700"><span class="font-medium text-slate-500">${escapeHtml(
							t("dash.upcomingRound", { round: String(m.round) }),
						)}</span> ${escapeHtml(hn)} — ${escapeHtml(an)}</li>`;
					})
					.join("");

	return `
    <div class="pes6-dashboard-snapshot mt-6 grid gap-4 lg:grid-cols-2">
      <div class="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white p-4 shadow-sm">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-indigo-600">${escapeHtml(
					t("dash.leaderTitle"),
				)}</h3>
        <div class="mt-2">${leaderInner}</div>
      </div>
      <div class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
					t("dash.upcomingTitle"),
				)}</h3>
        <ul class="mt-2 list-none space-y-1.5">${upcomingItems}</ul>
      </div>
    </div>`;
}

function buildDashboardRandomPickerHtml() {
	return `
    <div class="pes6-dashboard-random mt-6 rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-50/90 to-white p-4 shadow-sm ring-1 ring-amber-100">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-amber-800">${escapeHtml(
				t("dash.randomTitle"),
			)}</h3>
      <p class="mt-1 text-[11px] leading-relaxed text-amber-900/80">${escapeHtml(t("dash.randomHint"))}</p>
      <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <div class="flex min-w-0 flex-col gap-1 sm:shrink-0">
          <span class="text-xs font-medium text-slate-600">${escapeHtml(t("dash.randomScopeLabel"))}</span>
          <select
            id="pes-dashboard-random-scope"
            class="w-full min-w-[12rem] rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm sm:w-auto"
          >
            <option value="all">${escapeHtml(t("dash.randomScopeAll"))}</option>
            <option value="season">${escapeHtml(t("dash.randomScopeSeason"))}</option>
          </select>
        </div>
        <button
          type="button"
          class="pes-dashboard-random-draw rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-amber-500"
        >
          ${escapeHtml(t("dash.randomButton"))}
        </button>
      </div>
      <div
        id="pes-dashboard-random-result"
        class="mt-3 min-h-[2.5rem] rounded-lg border border-amber-200/60 bg-white/80 px-3 py-2 text-center text-lg font-bold text-amber-950"
        aria-live="polite"
      ></div>
    </div>`;
}

function buildDashboardRecentPlayedHtml(state, selectedSeasonId) {
	if (!selectedSeasonId) {
		return "";
	}
	if (!findSeasonById(state, selectedSeasonId)) {
		return "";
	}
	const recent = listMatchesForSeason(state, selectedSeasonId)
		.filter(
			(m) =>
				m.status === "played" &&
				m.homeScore != null &&
				m.awayScore != null,
		)
		.sort((a, b) => {
			const ta = new Date(a.playedAt || 0).getTime();
			const tb = new Date(b.playedAt || 0).getTime();
			return tb - ta;
		})
		.slice(0, 8);
	if (!recent.length) {
		return `<div class="pes6-dashboard-recent mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
				t("dash.recentPlayedTitle"),
			)}</h3>
      <p class="mt-2 text-sm text-slate-500">${escapeHtml(t("dash.recentPlayedEmpty"))}</p>
    </div>`;
	}
	const items = recent
		.map((m) => {
			const hp = findPlayerById(state, m.homePlayerId);
			const ap = findPlayerById(state, m.awayPlayerId);
			const hn = hp ? escapeHtml(getPlayerDisplayName(hp)) : "—";
			const an = ap ? escapeHtml(getPlayerDisplayName(ap)) : "—";
			const sc = escapeHtml(`${m.homeScore}:${m.awayScore}`);
			const when = m.playedAt
				? escapeHtml(formatIsoDateToDisplay(m.playedAt))
				: escapeHtml(t("common.dash"));
			return `<li class="text-sm leading-relaxed text-slate-700">
        <span class="font-medium text-slate-500">${escapeHtml(
					t("dash.upcomingRound", { round: String(m.round) }),
				)}</span>
        ${hn} ${escapeHtml(t("dash.recentVs"))} ${an}
        <span class="font-mono font-semibold text-indigo-700"> ${sc} </span>
        <span class="text-xs text-slate-500">· ${when}</span>
      </li>`;
		})
		.join("");
	return `<div class="pes6-dashboard-recent mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <h3 class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
			t("dash.recentPlayedTitle"),
		)}</h3>
    <ul class="mt-2 list-none space-y-1">${items}</ul>
  </div>`;
}

function buildStatComparePanelHtml(state, seasonId) {
	const season = findSeasonById(state, seasonId);
	const ids =
		season && Array.isArray(season.playerIds) ? season.playerIds.slice() : [];
	if (ids.length < 2) {
		return `<div class="pes-stat-compare mb-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">${escapeHtml(
			t("stats.compareNeedParticipants"),
		)}</div>`;
	}
	ids.sort((a, b) => {
		const pa = findPlayerById(state, a);
		const pb = findPlayerById(state, b);
		const na = pa ? getPlayerDisplayName(pa) : "";
		const nb = pb ? getPlayerDisplayName(pb) : "";
		return na.localeCompare(nb, undefined, { sensitivity: "base" });
	});
	const options = ids
		.map((id) => {
			const p = findPlayerById(state, id);
			const label = p ? escapeHtml(getPlayerDisplayName(p)) : escapeHtml(id);
			return `<option value="${escapeHtml(id)}">${label}</option>`;
		})
		.join("");
	return `
    <div class="pes-stat-compare mb-8 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white p-4 shadow-sm ring-1 ring-indigo-100">
      <h3 class="text-sm font-semibold text-slate-800">${escapeHtml(t("stats.compareTitle"))}</h3>
      <p class="mt-1 text-xs text-slate-500">${escapeHtml(t("stats.compareHint"))}</p>
      <div class="mt-3 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <label class="block min-w-0 flex-1 text-xs font-medium text-slate-600">${escapeHtml(
					t("stats.comparePickA"),
				)}
          <select id="pes-stat-compare-a" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">${options}</select>
        </label>
        <label class="block min-w-0 flex-1 text-xs font-medium text-slate-600">${escapeHtml(
					t("stats.comparePickB"),
				)}
          <select id="pes-stat-compare-b" class="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm">${options}</select>
        </label>
        <button type="button" class="pes-stat-compare-run shrink-0 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">${escapeHtml(
					t("stats.compareButton"),
				)}</button>
      </div>
      <div id="pes-stat-compare-out" class="mt-4"></div>
    </div>`;
}

function renderPesStatCompareOutput(state, seasonId, idA, idB) {
	const out = document.getElementById("pes-stat-compare-out");
	if (!out) {
		return;
	}
	const h2h = calculateLeagueHeadToHeadPairInSeason(state, seasonId, idA, idB);
	const rows = calculatePlayerStatisticsForSeason(state, seasonId);
	const rowA = rows.find((r) => r.playerId === idA) || null;
	const rowB = rows.find((r) => r.playerId === idB) || null;
	const pa = findPlayerById(state, idA);
	const pb = findPlayerById(state, idB);
	const na = pa ? escapeHtml(getPlayerDisplayName(pa)) : "?";
	const nb = pb ? escapeHtml(getPlayerDisplayName(pb)) : "?";
	const dash = escapeHtml(t("common.dash"));
	const fmt = (r) =>
		r
			? {
					pl: escapeHtml(String(r.matchCount)),
					wdl: escapeHtml(`${r.wins}-${r.draws}-${r.losses}`),
					gf: escapeHtml(String(r.goalsFor)),
					ga: escapeHtml(String(r.goalsAgainst)),
					form: escapeHtml(r.formLastFive || "—"),
				}
			: { pl: dash, wdl: dash, gf: dash, ga: dash, form: dash };
	const a = fmt(rowA);
	const b = fmt(rowB);
	const h2hBody =
		h2h.played > 0
			? `<tbody>
          <tr class="border-t border-slate-100">
            <td class="px-2 py-2 text-xs font-medium text-slate-600">${escapeHtml(
							t("stats.compareH2hMatches"),
						)}</td>
            <td class="px-2 py-2 text-sm text-slate-800">${h2h.played}</td>
            <td class="px-2 py-2 text-sm text-slate-800">${h2h.played}</td>
          </tr>
          <tr class="border-t border-slate-100">
            <td class="px-2 py-2 text-xs font-medium text-slate-600">${escapeHtml(
							t("stats.compareH2hWins"),
						)}</td>
            <td class="px-2 py-2 text-sm font-semibold text-slate-900">${h2h.winsA}</td>
            <td class="px-2 py-2 text-sm font-semibold text-slate-900">${h2h.winsB}</td>
          </tr>
          <tr class="border-t border-slate-100">
            <td class="px-2 py-2 text-xs font-medium text-slate-600">${escapeHtml(
							t("stats.compareH2hDraws"),
						)}</td>
            <td class="px-2 py-2 text-center text-sm text-slate-800 sm:px-2" colspan="2">${h2h.draws}</td>
          </tr>
          <tr class="border-t border-slate-100">
            <td class="px-2 py-2 text-xs font-medium text-slate-600">${escapeHtml(
							t("stats.compareH2hGoals"),
						)}</td>
            <td class="px-2 py-2 text-sm text-slate-800">${h2h.goalsA}</td>
            <td class="px-2 py-2 text-sm text-slate-800">${h2h.goalsB}</td>
          </tr>
        </tbody>`
			: `<tbody><tr><td colspan="3" class="px-2 py-3 text-center text-sm text-slate-500">${escapeHtml(
					t("stats.compareH2hNone"),
				)}</td></tr></tbody>`;
	const mkSeasonRow = (label, va, vb) => `<tr class="border-t border-slate-100">
    <td class="px-2 py-2 text-xs font-medium text-slate-600">${escapeHtml(label)}</td>
    <td class="px-2 py-2 text-sm text-slate-800">${va}</td>
    <td class="px-2 py-2 text-sm text-slate-800">${vb}</td>
  </tr>`;
	out.innerHTML = `
    <div class="space-y-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">${escapeHtml(
					t("stats.compareH2hTitle"),
				)}</p>
        <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-[10px] uppercase text-slate-500">
              <tr>
                <th class="px-2 py-2">${escapeHtml(t("stats.compareThStat"))}</th>
                <th class="px-2 py-2">${na}</th>
                <th class="px-2 py-2">${nb}</th>
              </tr>
            </thead>
            ${h2hBody}
          </table>
        </div>
      </div>
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
					t("stats.compareSeasonBlock"),
				)}</p>
        <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table class="min-w-full text-left text-sm">
            <thead class="bg-slate-50 text-[10px] uppercase text-slate-500">
              <tr>
                <th class="px-2 py-2">${escapeHtml(t("stats.compareThStat"))}</th>
                <th class="px-2 py-2">${na}</th>
                <th class="px-2 py-2">${nb}</th>
              </tr>
            </thead>
            <tbody>
              ${mkSeasonRow(t("stats.comparePl"), a.pl, b.pl)}
              ${mkSeasonRow(t("stats.compareWdl"), a.wdl, b.wdl)}
              ${mkSeasonRow(t("stats.th.gf"), a.gf, b.gf)}
              ${mkSeasonRow(t("stats.th.ga"), a.ga, b.ga)}
              ${mkSeasonRow(t("stats.th.form"), a.form, b.form)}
            </tbody>
          </table>
        </div>
      </div>
    </div>`;
}

function renderPlayersView(state) {
	const tableBody = document.getElementById("pes-players-table-body");
	const cardsRoot = document.getElementById("pes-players-cards-root");
	const profileRoot = document.getElementById("pes-player-profile-root");
	const searchInput = document.getElementById("pes-player-search-input");
	if (!tableBody || !profileRoot) {
		return;
	}
	const query = searchInput ? searchInput.value : "";
	const allPlayers = listAllPlayersSortedByCreatedAt(state);
	const players = filterPlayersBySearchQuery(allPlayers, query);
	const rows = players
		.map((player) => {
			const team = findTeamById(state, player.teamId);
			const teamLabel = team ? team.name : "—";
			const avatarUrl = resolvePlayerAvatarUrl(player);
			return `
      <tr class="border-t border-slate-200">
        <td class="px-3 py-2 text-sm text-slate-800">
          <div class="flex items-center gap-2">
            <img src="${escapeHtml(avatarUrl)}" alt="" class="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
            <span>${escapeHtml(getPlayerDisplayName(player))}</span>
          </div>
        </td>
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(teamLabel)}</td>
        <td class="px-3 py-2 text-xs text-slate-500">${formatDateOnly(
					player.createdAt,
				)}</td>
        <td class="px-3 py-2 text-right text-sm">
          <button type="button" class="text-indigo-600 hover:underline pes-open-player-profile" data-player-id="${escapeHtml(
						player.id,
					)}">${escapeHtml(t("players.profile"))}</button>
          <button type="button" class="text-indigo-600 hover:underline pes-edit-player" data-player-id="${escapeHtml(
						player.id,
					)}">${escapeHtml(t("players.edit"))}</button>
          <button type="button" class="ml-3 text-rose-600 hover:underline pes-delete-player" data-player-id="${escapeHtml(
						player.id,
					)}">${escapeHtml(t("players.delete"))}</button>
        </td>
      </tr>
    `;
		})
		.join("");
	tableBody.innerHTML =
		rows ||
		`<tr><td colspan="4" class="px-3 py-6 text-center text-sm text-slate-500">${escapeHtml(
			t("players.empty"),
		)}</td></tr>`;

	if (cardsRoot) {
		const cards = players
			.map((player) => {
				const team = findTeamById(state, player.teamId);
				const teamLabel = team ? team.name : "—";
				const avatarUrl = resolvePlayerAvatarUrl(player);
				const name = escapeHtml(getPlayerDisplayName(player));
				const dateStr = formatDateOnly(player.createdAt);
				return `
      <article class="pes-player-card rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div class="flex gap-3">
          <img src="${escapeHtml(avatarUrl)}" alt="" class="h-12 w-12 shrink-0 rounded-lg object-cover ring-1 ring-slate-200" />
          <div class="min-w-0 flex-1">
            <div class="text-base font-semibold leading-snug text-slate-900">${name}</div>
            <div class="mt-1 text-sm text-slate-600">
              <span class="font-medium text-slate-500">${escapeHtml(t("players.card.team"))}</span>
              ${escapeHtml(teamLabel)}
            </div>
            <div class="mt-0.5 text-xs text-slate-500">
              <span class="font-medium text-slate-500">${escapeHtml(t("players.card.added"))}</span>
              ${escapeHtml(dateStr)}
            </div>
            <div class="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-3">
              <button type="button" class="text-sm font-medium text-indigo-600 hover:underline pes-open-player-profile" data-player-id="${escapeHtml(
								player.id,
							)}">${escapeHtml(t("players.profile"))}</button>
              <button type="button" class="text-sm font-medium text-indigo-600 hover:underline pes-edit-player" data-player-id="${escapeHtml(
								player.id,
							)}">${escapeHtml(t("players.edit"))}</button>
              <button type="button" class="text-sm font-medium text-rose-600 hover:underline pes-delete-player" data-player-id="${escapeHtml(
								player.id,
							)}">${escapeHtml(t("players.delete"))}</button>
            </div>
          </div>
        </div>
      </article>`;
			})
			.join("");
		cardsRoot.innerHTML =
			cards ||
			`<p class="px-2 py-8 text-center text-sm text-slate-500">${escapeHtml(t("players.empty"))}</p>`;
	}

	if (!players.length) {
		profileRoot.innerHTML = `<p class="text-sm text-slate-500">${escapeHtml(t("players.profileEmpty"))}</p>`;
		return;
	}
	const selectedPlayerId = getSelectedPlayerProfileIdFromSession();
	const selectedPlayer =
		players.find((item) => item.id === selectedPlayerId) || players[0];
	setSelectedPlayerProfileIdToSession(selectedPlayer.id);
	const selectedTeam = findTeamById(state, selectedPlayer.teamId);
	const profileStats = calculateCareerProfileStatsForPlayer(
		state,
		selectedPlayer.id,
	);
	const duelStats = calculateOneVsOneProfileStatsForPlayer(
		state,
		selectedPlayer.id,
	);
	const mostPlayedOpponent = profileStats.mostPlayedAgainstPlayerId
		? findPlayerById(state, profileStats.mostPlayedAgainstPlayerId)
		: null;
	const duelMostPlayedOpponent = duelStats.mostPlayedAgainstPlayerId
		? findPlayerById(state, duelStats.mostPlayedAgainstPlayerId)
		: null;
	const avgGoalsFor =
		profileStats.playedMatches > 0
			? (profileStats.goalsFor / profileStats.playedMatches).toFixed(2)
			: t("common.dash");
	const duelAvgGoalsFor =
		duelStats.playedMatches > 0
			? (duelStats.goalsFor / duelStats.playedMatches).toFixed(2)
			: t("common.dash");
	const h2hRecords = calculateLeagueHeadToHeadRecordsForPlayer(
		state,
		selectedPlayer.id,
	);
	let h2hBlock = "";
	if (h2hRecords.length > 0) {
		const rows = h2hRecords.slice(0, 12).map((rec) => {
			const opp = findPlayerById(state, rec.opponentId);
			const oname = opp ? escapeHtml(getPlayerDisplayName(opp)) : "—";
			const record = `${rec.wins}-${rec.draws}-${rec.losses}`;
			const goals = `${rec.goalsFor}:${rec.goalsAgainst}`;
			return `<tr class="border-t border-slate-200">
        <td class="px-2 py-1.5 font-medium text-slate-800">${oname}</td>
        <td class="px-2 py-1.5 text-slate-600">${rec.played}</td>
        <td class="px-2 py-1.5 text-slate-600">${record}</td>
        <td class="px-2 py-1.5 text-slate-600">${goals}</td>
      </tr>`;
		});
		h2hBlock = `
        <div class="mt-4 rounded-xl border border-slate-200 bg-slate-50/90 p-3 ring-1 ring-slate-100">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
						t("players.h2hTitle"),
					)}</p>
          <div class="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table class="min-w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                <tr>
                  <th class="px-2 py-2">${escapeHtml(t("players.h2hThOpponent"))}</th>
                  <th class="px-2 py-2">${escapeHtml(t("players.h2hThPl"))}</th>
                  <th class="px-2 py-2">${escapeHtml(t("players.h2hThRecord"))}</th>
                  <th class="px-2 py-2">${escapeHtml(t("players.h2hThGoals"))}</th>
                </tr>
              </thead>
              <tbody>${rows.join("")}</tbody>
            </table>
          </div>
        </div>`;
	}
	profileRoot.innerHTML = `
    <h3 class="text-sm font-semibold text-slate-800">${escapeHtml(t("players.profileTitle"))}</h3>
    <div class="mt-3 grid gap-4 md:grid-cols-[auto,1fr]">
      <img
        src="${escapeHtml(resolvePlayerAvatarUrl(selectedPlayer))}"
        alt=""
        class="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
      />
      <div>
        <div class="text-lg font-semibold text-slate-900">${escapeHtml(
					getPlayerDisplayName(selectedPlayer),
				)}</div>
        <div class="text-sm text-slate-600">${escapeHtml(t("players.teamPrefix"))} ${escapeHtml(
					selectedTeam ? selectedTeam.name : t("common.dash"),
				)}</div>
        <p class="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">${escapeHtml(
					t("players.careerLeague"),
				)}</p>
        <div class="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
          <div>${escapeHtml(t("players.stat.played"))} <strong>${profileStats.playedMatches}</strong></div>
          <div>${escapeHtml(t("players.stat.gf"))} <strong>${profileStats.goalsFor}</strong></div>
          <div>${escapeHtml(t("players.stat.ga"))} <strong>${profileStats.goalsAgainst}</strong></div>
          <div>${escapeHtml(t("players.stat.gd"))} <strong>${profileStats.goalDifference}</strong></div>
          <div>${escapeHtml(t("players.stat.avgGf"))} <strong>${avgGoalsFor}</strong></div>
          <div>${escapeHtml(t("players.stat.wins"))} <strong>${profileStats.wins}</strong></div>
          <div>${escapeHtml(t("players.stat.draws"))} <strong>${profileStats.draws}</strong></div>
          <div>${escapeHtml(t("players.stat.losses"))} <strong>${profileStats.losses}</strong></div>
          <div>${escapeHtml(t("players.stat.rival"))} <strong>${escapeHtml(
						mostPlayedOpponent
							? `${getPlayerDisplayName(mostPlayedOpponent)} (${profileStats.mostPlayedAgainstCount})`
							: t("common.dash"),
					)}</strong></div>
        </div>
        ${h2hBlock}
        <div class="pes-player-profile-duel mt-4 rounded-xl border border-slate-200 bg-slate-50/95 p-3 ring-1 ring-slate-200/80">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-600">${escapeHtml(
						t("players.careerOneVsOne"),
					)}</p>
          <div class="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
            <div>${escapeHtml(t("players.stat.played"))} <strong>${duelStats.playedMatches}</strong></div>
            <div>${escapeHtml(t("players.stat.gf"))} <strong>${duelStats.goalsFor}</strong></div>
            <div>${escapeHtml(t("players.stat.ga"))} <strong>${duelStats.goalsAgainst}</strong></div>
            <div>${escapeHtml(t("players.stat.gd"))} <strong>${duelStats.goalDifference}</strong></div>
            <div>${escapeHtml(t("players.stat.avgGf"))} <strong>${duelAvgGoalsFor}</strong></div>
            <div>${escapeHtml(t("players.stat.wins"))} <strong>${duelStats.wins}</strong></div>
            <div>${escapeHtml(t("players.stat.draws"))} <strong>${duelStats.draws}</strong></div>
            <div>${escapeHtml(t("players.stat.losses"))} <strong>${duelStats.losses}</strong></div>
            <div>${escapeHtml(t("players.stat.rival"))} <strong>${escapeHtml(
							duelMostPlayedOpponent
								? `${getPlayerDisplayName(duelMostPlayedOpponent)} (${duelStats.mostPlayedAgainstCount})`
								: t("common.dash"),
						)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildDisciplineCardRowHtml(showCarryover, c) {
	const row = c && typeof c === "object" ? c : {};
	const playerName = escapeHtml(String(row.playerName || ""));
	let yellow = Number.parseInt(String(row.yellow ?? 0), 10);
	if (!Number.isFinite(yellow) || yellow < 0) {
		yellow = 0;
	}
	if (yellow > 2) {
		yellow = 2;
	}
	const redVal = row.red ? 1 : 0;
	const carry = Boolean(row.carryoverNextRound);
	const carryBlock = showCarryover
		? `<label class="flex min-w-0 max-w-full cursor-pointer items-center gap-2 rounded-lg border border-amber-300/80 bg-amber-50/90 px-2 py-2 sm:max-w-[10rem] sm:flex-col sm:items-start sm:py-1.5">
        <input type="checkbox" class="pes-card-carryover mt-0.5 h-4 w-4 shrink-0 rounded border-amber-500 text-amber-600" ${
					carry ? "checked" : ""
				} />
        <span class="text-[10px] font-semibold leading-tight text-amber-900">${escapeHtml(
					t("discipline.carryNext"),
				)}</span>
      </label>`
		: "";
	return `<div data-pes-card-row class="pes-discipline-card-row rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100">
    <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <label class="min-w-0 flex-1 basis-[min(100%,14rem)]">
        <span class="block text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
					t("discipline.cardPlayer"),
				)}</span>
        <input type="text" class="pes-card-player-name mt-1 w-full min-h-[2.75rem] rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-inner sm:text-sm" value="${playerName}" autocomplete="off" />
      </label>
      <div class="flex flex-wrap items-end gap-3">
        <label class="shrink-0">
          <span class="block text-[11px] font-bold uppercase text-amber-900">${escapeHtml(
						t("discipline.yellowInputLabel"),
					)}</span>
          <input type="number" min="0" max="2" step="1" class="pes-card-yellow mt-1 w-[3.5rem] min-h-[2.75rem] rounded-lg border-2 border-amber-500 bg-amber-50 px-1 text-center text-base font-bold text-amber-950 shadow-sm sm:text-sm" value="${yellow}" />
        </label>
        <label class="shrink-0">
          <span class="block text-[11px] font-bold uppercase text-rose-900">${escapeHtml(
						t("discipline.redInputLabel"),
					)}</span>
          <input type="number" min="0" max="1" step="1" class="pes-card-red mt-1 w-[3.5rem] min-h-[2.75rem] rounded-lg border-2 border-rose-600 bg-rose-50 px-1 text-center text-base font-bold text-rose-950 shadow-sm sm:text-sm" value="${redVal}" />
        </label>
        ${carryBlock}
        <button type="button" class="pes-discipline-remove-row ml-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-bold leading-none text-slate-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 sm:ml-0" title="${escapeHtml(
					t("discipline.removeRow"),
				)}" aria-label="${escapeHtml(t("discipline.removeRow"))}">×</button>
      </div>
    </div>
  </div>`;
}

function buildDisciplineInjuryRowHtml(row) {
	const r = row && typeof row === "object" ? row : {};
	const playerName = escapeHtml(String(r.playerName || ""));
	return `<div data-pes-injury-row class="pes-discipline-injury-row flex flex-col gap-2 rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-100 sm:flex-row sm:items-end">
    <label class="min-w-0 flex-1">
      <span class="block text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
				t("discipline.injuredPlayer"),
			)}</span>
      <input type="text" class="pes-injured-name mt-1 w-full min-h-[2.75rem] rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-base text-slate-900 sm:text-sm" value="${playerName}" autocomplete="off" />
    </label>
    <button type="button" class="pes-discipline-remove-row inline-flex h-10 w-10 shrink-0 items-center justify-center self-end rounded-lg border-2 border-slate-300 bg-slate-50 text-lg font-bold leading-none text-slate-600 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-800 sm:self-auto" title="${escapeHtml(
			t("discipline.removeRow"),
		)}" aria-label="${escapeHtml(t("discipline.removeRow"))}">×</button>
  </div>`;
}

function buildDisciplineAddCardButtonHtml() {
	return `<button type="button" class="pes-discipline-add-card mt-2 inline-flex min-h-[2.75rem] w-full items-center justify-center gap-1 rounded-lg border-2 border-amber-500/80 bg-gradient-to-b from-amber-50 to-amber-100/80 px-3 py-2 text-xs font-bold uppercase tracking-wide text-amber-950 shadow-sm hover:from-amber-100 hover:to-amber-100 sm:w-auto">${escapeHtml(
		t("discipline.addCard"),
	)}</button>`;
}

function buildDisciplineAddInjuryButtonHtml() {
	return `<button type="button" class="pes-discipline-add-injury mt-2 inline-flex min-h-[2.75rem] w-full items-center justify-center gap-1 rounded-lg border-2 border-slate-400/90 bg-gradient-to-b from-slate-50 to-slate-100/90 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-800 shadow-sm hover:from-slate-100 hover:to-slate-100 sm:w-auto">${escapeHtml(
		t("discipline.addInjury"),
	)}</button>`;
}

function buildOneVsOneDisciplineFormHtml() {
	const cardsHtml = buildDisciplineCardRowHtml(false, {});
	const injHtml = buildDisciplineInjuryRowHtml({});
	return `
  <details class="pes-1v1-discipline-details mt-2 w-full rounded-xl border border-amber-300/50 bg-gradient-to-b from-white to-amber-50/40 px-3 py-3 shadow-sm ring-1 ring-amber-200/50" open>
    <summary class="cursor-pointer select-none text-sm font-bold text-slate-800">${escapeHtml(
			t("discipline.sectionTitle"),
		)}</summary>
    <p class="mt-2 text-xs leading-snug text-slate-600">${escapeHtml(t("oneVsOne.disciplineHint"))}</p>
    <div data-pes-discipline-block class="mt-4 space-y-5">
      <div>
        <div class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
					t("discipline.cardsBlock"),
				)}</div>
        <div data-pes-cards-list class="space-y-2">${cardsHtml}</div>
        ${buildDisciplineAddCardButtonHtml()}
      </div>
      <div>
        <div class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
					t("discipline.injuredBlock"),
				)}</div>
        <div data-pes-injuries-list class="space-y-2">${injHtml}</div>
        ${buildDisciplineAddInjuryButtonHtml()}
      </div>
    </div>
  </details>`;
}

function fillOneVsOnePlayerSelects(state) {
	const homeSel = document.getElementById("pes-1v1-home");
	const awaySel = document.getElementById("pes-1v1-away");
	if (!homeSel || !awaySel) {
		return;
	}
	const prevH = homeSel.value;
	const prevA = awaySel.value;
	const players = listAllPlayersSortedByCreatedAt(state);
	const optionsHtml = [
		`<option value="">${escapeHtml(t("oneVsOne.pickPlayer"))}</option>`,
		...players.map(
			(player) =>
				`<option value="${escapeHtml(player.id)}">${escapeHtml(
					getPlayerDisplayName(player),
				)}</option>`,
		),
	].join("");
	homeSel.innerHTML = optionsHtml;
	awaySel.innerHTML = optionsHtml;
	if (
		prevH &&
		Array.from(homeSel.options).some((option) => option.value === prevH)
	) {
		homeSel.value = prevH;
	}
	if (
		prevA &&
		Array.from(awaySel.options).some((option) => option.value === prevA)
	) {
		awaySel.value = prevA;
	}
}

function renderOneVsOneView(state) {
	fillOneVsOnePlayerSelects(state);
	const discRoot = document.getElementById("pes-one-vs-one-discipline-root");
	if (discRoot) {
		discRoot.innerHTML = buildOneVsOneDisciplineFormHtml();
	}
	const historyBody = document.getElementById("pes-one-vs-one-history-body");
	if (!historyBody) {
		return;
	}
	const matches = listOneVsOneMatchesSorted(state);
	if (!matches.length) {
		historyBody.innerHTML = `<tr><td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500">${escapeHtml(
			t("oneVsOne.historyEmpty"),
		)}</td></tr>`;
		return;
	}
	historyBody.innerHTML = matches
		.map((match) => {
			const home = findPlayerById(state, match.homePlayerId);
			const away = findPlayerById(state, match.awayPlayerId);
			const disc = sanitizeMatchDiscipline(match.discipline);
			const discCell =
				disc.cards.length > 0 || disc.injured.length > 0
					? escapeHtml(
							t("fixtures.disciplineShort", {
								cards: String(disc.cards.length),
								inj: String(disc.injured.length),
							}),
						)
					: escapeHtml(t("common.dash"));
			return `<tr class="border-t border-slate-200">
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(
					formatDateOnly(match.playedAt),
				)}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
					home ? getPlayerDisplayName(home) : "—",
				)}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
					away ? getPlayerDisplayName(away) : "—",
				)}</td>
        <td class="px-3 py-2 text-sm font-semibold text-slate-900">${match.homeScore} : ${match.awayScore}</td>
        <td class="px-3 py-2 text-xs text-slate-600">${discCell}</td>
      </tr>`;
		})
		.join("");
}

function renderTeamsView(state) {
	const tableBody = document.getElementById("pes-teams-table-body");
	if (!tableBody) {
		return;
	}
	const teams = listAllTeamsSortedByName(state);
	const rows = teams
		.map((team) => {
			const candidateUrls = sanitizeLogoCandidateUrls(
				[]
					.concat(team.logoUrl ? [team.logoUrl] : [])
					.concat(team.logoCandidates || [])
					.concat(
						team.website ? [buildClearbitLogoUrlFromWebsite(team.website)] : [],
					),
			);
			const normalizedLogoUrl = candidateUrls[0] || "";
			const fallbackLogoUrls = candidateUrls.slice(1);
			const fallbackBadge = `<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">${escapeHtml(
				team.name.slice(0, 2).toUpperCase(),
			)}</div>`;
			const logoHtml = normalizedLogoUrl
				? `<div class="relative h-10 w-10">
            <img
              src="${escapeHtml(normalizedLogoUrl)}"
              data-fallback-list="${escapeHtml(fallbackLogoUrls.join("||"))}"
              alt=""
              class="h-10 w-10 rounded-lg object-cover ring-1 ring-slate-200"
              onerror="
                const list = (this.dataset.fallbackList || '').split('||').filter(Boolean);
                if (list.length > 0) {
                  const nextSrc = list.shift();
                  this.dataset.fallbackList = list.join('||');
                  this.src = nextSrc;
                  return;
                }
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
              "
            />
            <div class="hidden h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">${escapeHtml(
							team.name.slice(0, 2).toUpperCase(),
						)}</div>
          </div>`
				: fallbackBadge;
			const leagueCountry =
				[team.league, team.country].filter(Boolean).join(" · ") || "—";
			const website = String(team.website || "").trim();
			const websiteHtml = website
				? `<a class="text-xs text-indigo-600 hover:underline" href="${escapeHtml(
						website,
					)}" target="_blank" rel="noopener noreferrer">${escapeHtml(t("teams.website"))}</a>`
				: "";
			return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2">
          <div class="flex items-center gap-3">
            ${logoHtml}
            <div>
              <div class="text-sm font-medium text-slate-800">${escapeHtml(team.name)}</div>
              <div class="text-xs text-slate-500">${formatDateOnly(team.createdAt)} ${websiteHtml}</div>
            </div>
          </div>
        </td>
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(leagueCountry)}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(team.stadium || "—")}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(team.foundedYear || "—")}</td>
        <td class="px-3 py-2 text-right text-sm">
          <button type="button" class="text-indigo-600 hover:underline pes-edit-team" data-team-id="${escapeHtml(
						team.id,
					)}">${escapeHtml(t("teams.edit"))}</button>
          <button type="button" class="ml-3 text-rose-600 hover:underline pes-delete-team" data-team-id="${escapeHtml(
						team.id,
					)}">${escapeHtml(t("teams.delete"))}</button>
        </td>
      </tr>
    `;
		})
		.join("");
	tableBody.innerHTML =
		rows ||
		`<tr><td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500">${escapeHtml(
			t("teams.empty"),
		)}</td></tr>`;
}

function renderSeasonsView(state) {
	const tableBody = document.getElementById("pes-seasons-table-body");
	if (!tableBody) {
		return;
	}
	const seasons = listAllSeasonsSortedByCreatedAt(state);
	const rows = seasons
		.map((season) => {
			const isDraft = season.status === "draft";
			const isActive = season.status === "active";
			const isFinished = season.status === "finished";
			const doubleLabel = season.isDoubleRoundRobin
				? t("common.yes")
				: t("common.no");
			return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-sm font-medium text-slate-800">${escapeHtml(
					season.name,
				)}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${season.roundCount}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${season.participantCount}</td>
        <td class="px-3 py-2 text-xs text-slate-500">${formatDateOnly(
					season.createdAt,
				)}</td>
        <td class="px-3 py-2 text-sm">
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">${escapeHtml(
						translateSeasonStatus(season.status),
					)}</span>
        </td>
        <td class="px-3 py-2 text-sm text-slate-700">${doubleLabel}</td>
        <td class="px-3 py-2 text-right text-sm">
          <button type="button"
            class="pes-generate-fixtures rounded px-1 py-0.5 text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isDraft ? "" : "disabled"}>${escapeHtml(t("seasons.generate"))}</button>
          <button type="button"
            class="pes-season-double ml-2 rounded px-1 py-0.5 text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isDraft ? "" : "disabled"}>${escapeHtml(t("seasons.double"))}</button>
          <button type="button"
            class="pes-reset-season ml-2 rounded px-1 py-0.5 text-amber-800 hover:underline"
            data-season-id="${escapeHtml(season.id)}">${escapeHtml(t("seasons.reset"))}</button>
          <button type="button"
            class="pes-finish-season ml-2 rounded px-1 py-0.5 text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isActive ? "" : "disabled"}>${escapeHtml(t("seasons.finish"))}</button>
          <button type="button"
            class="pes-clone-season ml-2 rounded px-1 py-0.5 text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isFinished ? "" : "disabled"}>${escapeHtml(t("seasons.clone"))}</button>
          <button type="button"
            class="pes-delete-season ml-2 rounded px-1 py-0.5 text-rose-700 hover:underline"
            data-season-id="${escapeHtml(season.id)}">${escapeHtml(t("seasons.delete"))}</button>
        </td>
      </tr>
    `;
		})
		.join("");
	tableBody.innerHTML =
		rows ||
		`<tr><td colspan="7" class="px-3 py-6 text-center text-sm text-slate-500">${escapeHtml(
			t("seasons.empty"),
		)}</td></tr>`;

	const participantSelect = document.getElementById(
		"pes-season-participant-ids",
	);
	if (participantSelect) {
		const previous = Array.from(participantSelect.selectedOptions).map(
			(option) => option.value,
		);
		participantSelect.innerHTML = "";
		const players = listAllPlayersSortedByCreatedAt(state);
		for (const player of players) {
			const option = document.createElement("option");
			option.value = player.id;
			option.textContent = getPlayerDisplayName(player);
			participantSelect.appendChild(option);
		}
		for (const value of previous) {
			const matchOption = Array.from(participantSelect.options).find(
				(option) => option.value === value,
			);
			if (matchOption) {
				matchOption.selected = true;
			}
		}
	}
}

function renderFixturesView(state, selectedSeasonId) {
	const root = document.getElementById("pes-fixtures-root");
	if (!root) {
		return;
	}
	if (!selectedSeasonId) {
		root.innerHTML = `<p class="text-sm text-slate-600">${escapeHtml(t("common.pickSeasonHeader"))}</p>`;
		return;
	}
	const season = findSeasonById(state, selectedSeasonId);
	if (!season) {
		root.innerHTML = `<p class="text-sm text-rose-600">${escapeHtml(t("common.seasonNotFound"))}</p>`;
		return;
	}
	const roundFilter = document.getElementById("pes-fixture-round-filter");
	const unplayedOnly = document.getElementById("pes-fixture-unplayed-only");
	const roundValue = roundFilter ? roundFilter.value : "";
	const onlyUnplayed = unplayedOnly ? unplayedOnly.checked : false;
	let matches = listMatchesForSeason(state, season.id);
	if (onlyUnplayed) {
		matches = matches.filter(
			(match) => match.status === "scheduled" || match.status === "skipped",
		);
	}
	if (roundValue) {
		const roundNumber = Number.parseInt(roundValue, 10);
		if (Number.isFinite(roundNumber)) {
			matches = matches.filter((match) => match.round === roundNumber);
		}
	}
	const roundOptions = Array.from(
		{ length: season.roundCount },
		(_, index) => index + 1,
	);
	const filterHtml = `
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <label class="text-xs font-medium text-slate-600">${escapeHtml(t("fixtures.roundLabel"))}
        <select id="pes-fixture-round-filter" class="mt-1 block rounded-lg border border-slate-300 px-2 py-1 text-sm">
          <option value="">${escapeHtml(t("fixtures.allRounds"))}</option>
          ${roundOptions
						.map(
							(roundNumber) =>
								`<option value="${roundNumber}" ${
									String(roundNumber) === roundValue ? "selected" : ""
								}>${escapeHtml(t("fixtures.roundN", { n: String(roundNumber) }))}</option>`,
						)
						.join("")}
        </select>
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-600">
        <input id="pes-fixture-unplayed-only" type="checkbox" class="rounded border-slate-300" ${
					onlyUnplayed ? "checked" : ""
				} />
        ${escapeHtml(t("fixtures.unplayedOnly"))}
      </label>
    </div>
  `;
	const rows = matches
		.map((match) => {
			const homePlayer = findPlayerById(state, match.homePlayerId);
			const awayPlayer = findPlayerById(state, match.awayPlayerId);
			const homeTeam = findTeamById(state, match.homeTeamId);
			const awayTeam = findTeamById(state, match.awayTeamId);
			const homeName = homePlayer ? getPlayerDisplayName(homePlayer) : "?";
			const awayName = awayPlayer ? getPlayerDisplayName(awayPlayer) : "?";
			const homeTeamName = homeTeam ? homeTeam.name : "?";
			const awayTeamName = awayTeam ? awayTeam.name : "?";
			const statusLabel =
				match.status === "played"
					? `${match.homeScore} : ${match.awayScore}`
					: match.status === "skipped"
						? t("match.skipped")
						: t("fixtures.scheduled");
			const disc = sanitizeMatchDiscipline(match.discipline);
			const discShort =
				match.status === "played" &&
				(disc.cards.length > 0 || disc.injured.length > 0)
					? `<div class="mt-0.5 text-[10px] font-normal text-slate-500">${escapeHtml(
							t("fixtures.disciplineShort", {
								cards: String(disc.cards.length),
								inj: String(disc.injured.length),
							}),
						)}</div>`
					: "";
			return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-xs text-slate-500">${match.round}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
					homeName,
				)} <span class="text-xs text-slate-500">(${escapeHtml(
					homeTeamName,
				)})</span></td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
					awayName,
				)} <span class="text-xs text-slate-500">(${escapeHtml(
					awayTeamName,
				)})</span></td>
        <td class="px-3 py-2 text-xs">${escapeHtml(translateMatchStatus(match.status))}</td>
        <td class="px-3 py-2 text-sm font-medium text-slate-800 align-top">${escapeHtml(
					statusLabel,
				)}${discShort}</td>
      </tr>
    `;
		})
		.join("");
	root.innerHTML = `
    ${filterHtml}
    <div class="pes-fixtures-table-wrap overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="pes-fixtures-table min-w-[min(100%,36rem)] w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">${escapeHtml(t("fixtures.th.round"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("fixtures.th.home"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("fixtures.th.away"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("fixtures.th.status"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("fixtures.th.result"))}</th>
          </tr>
        </thead>
        <tbody>
          ${
						rows ||
						`<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">${escapeHtml(
							t("fixtures.empty"),
						)}</td></tr>`
					}
        </tbody>
      </table>
    </div>
  `;
	const newRoundFilter = document.getElementById("pes-fixture-round-filter");
	const newUnplayed = document.getElementById("pes-fixture-unplayed-only");
	if (newRoundFilter && roundValue) {
		newRoundFilter.value = roundValue;
	}
	if (newUnplayed) {
		newUnplayed.checked = onlyUnplayed;
	}
}

function buildMatchDisciplineEditorHtml(match, state, seasonId) {
	const d = sanitizeMatchDiscipline(match.discipline);
	const cardCount = Math.max(1, d.cards.length);
	const injCount = Math.max(1, d.injured.length);
	const carried = getCarriedPlayerNamesFromPreviousRound(
		state,
		seasonId,
		match.round,
	);
	let carryHint = "";
	const notPlayedYet =
		match.status === "scheduled" || match.status === "skipped";
	if (notPlayedYet && carried.length && seasonId && match.round > 1) {
		const homeP = findPlayerById(state, match.homePlayerId);
		const awayP = findPlayerById(state, match.awayPlayerId);
		const hName = homeP ? getPlayerDisplayName(homeP) : "";
		const aName = awayP ? getPlayerDisplayName(awayP) : "";
		const hHit = playerDisplayNameMatchesCarryover(hName, carried);
		const aHit = playerDisplayNameMatchesCarryover(aName, carried);
		if (hHit || aHit) {
			carryHint = `<p class="rounded-lg border border-amber-200 bg-amber-50 px-2 py-2 text-xs font-medium text-amber-900">${escapeHtml(
				t("results.carryoverHint"),
			)}</p>`;
		}
	}
	const cardsHtml = Array.from({ length: cardCount }, (_, i) =>
		buildDisciplineCardRowHtml(true, d.cards[i] || {}),
	).join("");
	const injHtml = Array.from({ length: injCount }, (_, i) =>
		buildDisciplineInjuryRowHtml(d.injured[i] || {}),
	).join("");
	const isPlayed = match.status === "played";
	const summaryPlayed =
		isPlayed && (d.cards.length > 0 || d.injured.length > 0)
			? `<p class="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">${escapeHtml(
					t("discipline.savedSummary", {
						cards: String(d.cards.length),
						inj: String(d.injured.length),
					}),
				)}</p>`
			: "";
	const detailsOpen =
		isPlayed && (d.cards.length > 0 || d.injured.length > 0) ? " open" : "";
	return `
  <details class="pes-discipline-details mt-3 w-full max-w-2xl rounded-xl border-2 border-slate-300/80 bg-gradient-to-b from-slate-50 to-white px-3 py-2 shadow-sm ring-1 ring-slate-200/60"${detailsOpen}>
    <summary class="cursor-pointer select-none text-sm font-bold text-slate-800">${escapeHtml(
			t("discipline.sectionTitle"),
		)}</summary>
    <div data-pes-discipline-block data-pes-discipline-carryover class="mt-3 space-y-5">
      ${carryHint}
      ${summaryPlayed}
      <div>
        <div class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
					t("discipline.cardsBlock"),
				)}</div>
        <div data-pes-cards-list class="space-y-2">${cardsHtml}</div>
        ${buildDisciplineAddCardButtonHtml()}
      </div>
      <div>
        <div class="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-600">${escapeHtml(
					t("discipline.injuredBlock"),
				)}</div>
        <div data-pes-injuries-list class="space-y-2">${injHtml}</div>
        ${buildDisciplineAddInjuryButtonHtml()}
      </div>
    </div>
  </details>`;
}

function renderResultsView(state, selectedSeasonId) {
	const root = document.getElementById("pes-results-root");
	if (!root) {
		return;
	}
	if (!selectedSeasonId) {
		root.innerHTML = `<p class="text-sm text-slate-600">${escapeHtml(t("common.pickSeasonHeader"))}</p>`;
		return;
	}
	const season = findSeasonById(state, selectedSeasonId);
	if (!season) {
		root.innerHTML = `<p class="text-sm text-rose-600">${escapeHtml(t("common.seasonNotFound"))}</p>`;
		return;
	}
	const matches = listMatchesForSeason(state, season.id);
	const rows = matches
		.map((match) => {
			const homePlayer = findPlayerById(state, match.homePlayerId);
			const awayPlayer = findPlayerById(state, match.awayPlayerId);
			const homeName = homePlayer ? getPlayerDisplayName(homePlayer) : "?";
			const awayName = awayPlayer ? getPlayerDisplayName(awayPlayer) : "?";
			const homeScoreValue =
				match.homeScore != null ? String(match.homeScore) : "";
			const awayScoreValue =
				match.awayScore != null ? String(match.awayScore) : "";
			const isPlayed = match.status === "played";
			const isSkipped = match.status === "skipped";
			const labelRound = escapeHtml(t("results.th.round"));
			const labelHome = escapeHtml(t("results.th.home"));
			const labelAway = escapeHtml(t("results.th.away"));
			const labelInput = escapeHtml(t("results.th.input"));
			const labelPlayed = escapeHtml(t("results.th.playedAt"));
			return `
      <tr class="pes-results-tr border-t border-slate-100">
        <td class="pes-results-td px-3 py-2 text-xs text-slate-500 sm:text-sm" data-label="${labelRound}">${match.round}</td>
        <td class="pes-results-td px-3 py-2 text-sm font-medium text-slate-800" data-label="${labelHome}">${escapeHtml(
					homeName,
				)}</td>
        <td class="pes-results-td px-3 py-2 text-sm font-medium text-slate-800" data-label="${labelAway}">${escapeHtml(
					awayName,
				)}</td>
        <td class="pes-results-td px-3 py-2 align-top" data-label="${labelInput}">
          <form class="pes-result-form flex w-full min-w-0 max-w-2xl flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3 shadow-inner sm:p-3" data-match-id="${escapeHtml(
						match.id,
					)}">
            <div class="flex flex-row items-end gap-2 sm:gap-3">
            <label class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:hidden">${escapeHtml(
								t("results.scoreHome"),
							)}</span>
            <input name="homeScore" type="number" min="0" step="1" inputmode="numeric" class="min-h-[2.75rem] w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-center text-lg font-bold text-slate-900 shadow-sm sm:w-[4.5rem] sm:text-base" value="${escapeHtml(
							homeScoreValue,
						)}" />
            </label>
            <span class="shrink-0 pb-2.5 text-2xl font-bold leading-none text-slate-400 sm:pb-3" aria-hidden="true">:</span>
            <label class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:hidden">${escapeHtml(
								t("results.scoreAway"),
							)}</span>
            <input name="awayScore" type="number" min="0" step="1" inputmode="numeric" class="min-h-[2.75rem] w-full rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-center text-lg font-bold text-slate-900 shadow-sm sm:w-[4.5rem] sm:text-base" value="${escapeHtml(
							awayScoreValue,
						)}" />
            </label>
            </div>
            <div class="flex flex-wrap items-center gap-2">
            <button type="submit" class="min-h-[2.75rem] flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-indigo-500 sm:flex-none sm:px-5">${escapeHtml(
							t("results.save"),
						)}</button>
            ${
							isPlayed
								? `<button type="button" class="min-h-[2.75rem] rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 pes-revert-match" data-match-id="${escapeHtml(
										match.id,
									)}">${escapeHtml(t("results.revert"))}</button>`
								: ""
						}
            ${
							!isPlayed
								? `<button type="button" class="min-h-[2.75rem] rounded-lg border-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 pes-skip-match" data-match-id="${escapeHtml(
										match.id,
									)}">${escapeHtml(t("results.skip"))}</button>`
								: ""
						}
            ${
							isSkipped
								? `<span class="w-full text-xs font-medium text-amber-800 sm:w-auto">${escapeHtml(
										t("results.skippedHint"),
									)}</span>`
								: ""
						}
            </div>
            ${buildMatchDisciplineEditorHtml(match, state, season.id)}
          </form>
        </td>
        <td class="pes-results-td px-3 py-2 text-xs text-slate-600 sm:text-sm" data-label="${labelPlayed}">${formatIsoDateToDisplay(
					match.playedAt,
				)}</td>
      </tr>
    `;
		})
		.join("");
	root.innerHTML = `
    <div class="pes-results-table-wrap overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="pes-results-table min-w-[min(100%,44rem)] w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="pes-results-thead bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th class="px-3 py-3 sm:py-2">${escapeHtml(t("results.th.round"))}</th>
            <th class="px-3 py-3 sm:py-2">${escapeHtml(t("results.th.home"))}</th>
            <th class="px-3 py-3 sm:py-2">${escapeHtml(t("results.th.away"))}</th>
            <th class="px-3 py-3 sm:py-2 min-w-[12rem]">${escapeHtml(t("results.th.input"))}</th>
            <th class="px-3 py-3 sm:py-2 whitespace-nowrap">${escapeHtml(t("results.th.playedAt"))}</th>
          </tr>
        </thead>
        <tbody>
          ${
						rows ||
						`<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">${escapeHtml(
							t("results.empty"),
						)}</td></tr>`
					}
        </tbody>
      </table>
    </div>
  `;
}

function buildStandingsTableHtml(state, selectedSeasonId) {
	if (!selectedSeasonId) {
		return {
			ok: false,
			html: `<p class="text-sm text-slate-600">${escapeHtml(t("common.pickSeasonHeader"))}</p>`,
		};
	}
	const season = findSeasonById(state, selectedSeasonId);
	if (!season) {
		return {
			ok: false,
			html: `<p class="text-sm text-rose-600">${escapeHtml(t("common.seasonNotFound"))}</p>`,
		};
	}
	const standings = calculateStandingsForSeason(state, selectedSeasonId);
	const rows = standings
		.map((row) => {
			const player = findPlayerById(state, row.playerId);
			const team = player ? findTeamById(state, player.teamId) : null;
			const playerLabel = player ? getPlayerDisplayName(player) : "?";
			const teamLabel = team ? team.name : "?";
			return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-sm font-semibold text-slate-900">${row.position}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
					playerLabel,
				)}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${escapeHtml(teamLabel)}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.played}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.wins}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.draws}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.losses}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.goalsFor}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.goalsAgainst}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.goalDifference}</td>
        <td class="px-3 py-2 text-sm font-bold text-slate-900">${row.points}</td>
      </tr>
    `;
		})
		.join("");
	return {
		ok: true,
		html: `
    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">${escapeHtml(t("table.th.hash"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.player"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.team"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.mp"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.w"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.d"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.l"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.gf"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.ga"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.gd"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("table.th.pts"))}</th>
          </tr>
        </thead>
        <tbody>
          ${
						rows ||
						`<tr><td colspan="11" class="px-3 py-6 text-center text-slate-500">${escapeHtml(
							t("table.emptyData"),
						)}</td></tr>`
					}
        </tbody>
      </table>
    </div>
  `,
	};
}

function renderTableView(state, selectedSeasonId) {
	const root = document.getElementById("pes-table-root");
	const exportButton = document.getElementById("pes-export-standings-csv");
	if (!root) {
		return;
	}
	if (exportButton) {
		exportButton.disabled = !selectedSeasonId;
	}
	const built = buildStandingsTableHtml(state, selectedSeasonId);
	root.innerHTML = built.html;
}

function renderRankingsView(state, selectedSeasonId) {
	const root = document.getElementById("pes-rankings-root");
	const exportButton = document.getElementById("pes-export-rankings-csv");
	const seasonHint = document.getElementById("pes-rankings-season-hint");
	if (!root) {
		return;
	}
	if (exportButton) {
		exportButton.disabled = !selectedSeasonId;
	}
	if (seasonHint) {
		const season = selectedSeasonId
			? findSeasonById(state, selectedSeasonId)
			: null;
		seasonHint.textContent = season
			? t("rankings.hint", {
					name: season.name,
					status: translateSeasonStatus(season.status),
				})
			: t("common.pickSeasonHeader");
	}
	const built = buildStandingsTableHtml(state, selectedSeasonId);
	root.innerHTML = built.html;
}

function renderStatisticsView(state, selectedSeasonId) {
	const root = document.getElementById("pes-statistics-root");
	const exportButton = document.getElementById("pes-export-results-csv");
	if (!root) {
		return;
	}
	if (exportButton) {
		exportButton.disabled = !selectedSeasonId;
	}
	if (!selectedSeasonId) {
		root.innerHTML = `<p class="text-sm text-slate-600">${escapeHtml(t("common.pickSeasonHeader"))}</p>`;
		return;
	}
	const globals = calculateGlobalStatisticsForSeason(state, selectedSeasonId);
	const playerStats = calculatePlayerStatisticsForSeason(
		state,
		selectedSeasonId,
	);
	const comparePanel = buildStatComparePanelHtml(state, selectedSeasonId);
	const globalHtml = `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${renderStatCard(
				t("stats.tile.matches"),
				String(globals.totalMatches),
				t("stats.tile.matchesSub"),
			)}
      ${renderStatCard(t("stats.tile.goals"), String(globals.totalGoals), t("stats.tile.goalsSub"))}
      ${renderStatCard(
				t("stats.tile.avg"),
				globals.averageGoalsPerMatch.toFixed(2),
				t("stats.tile.avgSub"),
			)}
      ${renderStatCard(
				t("stats.tile.attack"),
				globals.bestAttackPlayerId
					? escapeHtml(
							getPlayerDisplayName(
								findPlayerById(state, globals.bestAttackPlayerId),
							),
						)
					: t("common.dash"),
				globals.bestAttackPlayerId
					? t("stats.tile.attackGoals", { n: String(globals.bestAttackGoals) })
					: t("stats.tile.noPlayed"),
			)}
      ${renderStatCard(
				t("stats.tile.defense"),
				globals.bestDefensePlayerId
					? escapeHtml(
							getPlayerDisplayName(
								findPlayerById(state, globals.bestDefensePlayerId),
							),
						)
					: t("common.dash"),
				globals.bestDefensePlayerId
					? t("stats.tile.defenseConceded", {
							n: String(globals.bestDefenseConceded),
						})
					: t("stats.tile.noPlayed"),
			)}
      ${renderStatCard(
				t("stats.tile.points"),
				globals.topPointsPlayerId
					? escapeHtml(
							getPlayerDisplayName(
								findPlayerById(state, globals.topPointsPlayerId),
							),
						)
					: t("common.dash"),
				t("stats.tile.pointsSub", { n: String(globals.topPoints) }),
			)}
    </div>
  `;
	const playerRows = playerStats
		.map((row) => {
			const player = findPlayerById(state, row.playerId);
			const label = player ? getPlayerDisplayName(player) : "?";
			return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(label)}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.matchCount}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.wins}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.draws}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.losses}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.goalsFor}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.goalsAgainst}</td>
        <td class="px-3 py-2 text-sm text-slate-700">${row.averageGoalsPerMatch.toFixed(
					2,
				)}</td>
        <td class="px-3 py-2 text-sm font-mono text-slate-800">${escapeHtml(
					row.formLastFive || "—",
				)}</td>
      </tr>
    `;
		})
		.join("");
	const tableHtml = `
    <div class="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.player"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.matches"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.w"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.d"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.l"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.gf"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.ga"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.avg"))}</th>
            <th class="px-3 py-2">${escapeHtml(t("stats.th.form"))}</th>
          </tr>
        </thead>
        <tbody>
          ${
						playerRows ||
						`<tr><td colspan="9" class="px-3 py-6 text-center text-slate-500">${escapeHtml(
							t("stats.empty"),
						)}</td></tr>`
					}
        </tbody>
      </table>
    </div>
  `;
	root.innerHTML = `${comparePanel}${globalHtml}${tableHtml}`;
	const selA = document.getElementById("pes-stat-compare-a");
	const selB = document.getElementById("pes-stat-compare-b");
	if (selA && selB && selA.options.length >= 2) {
		selA.selectedIndex = 0;
		selB.selectedIndex = 1;
		const idA = selA.value;
		const idB = selB.value;
		if (idA && idB && idA !== idB) {
			renderPesStatCompareOutput(state, selectedSeasonId, idA, idB);
		}
	}
}

function refreshTeamSelectElements() {
	const state = getPesLeagueApplicationState();
	const teams = listAllTeamsSortedByName(state);
	const playerTeamSelect = document.getElementById("pes-player-team-select");
	const editTeamSelect = document.getElementById("pes-edit-player-team");
	const lists = [playerTeamSelect, editTeamSelect].filter(Boolean);
	for (const select of lists) {
		const previous = select.value;
		const isEditSelect = select.id === "pes-edit-player-team";
		select.innerHTML = "";
		if (!isEditSelect) {
			const placeholder = document.createElement("option");
			placeholder.value = "";
			placeholder.textContent = t("form.teamSelectPh");
			select.appendChild(placeholder);
		}
		for (const team of teams) {
			const option = document.createElement("option");
			option.value = team.id;
			option.textContent = team.name;
			select.appendChild(option);
		}
		if (
			previous &&
			Array.from(select.options).some((option) => option.value === previous)
		) {
			select.value = previous;
		}
	}
}

function refreshEntireUi() {
	const state = getPesLeagueApplicationState();
	const selectedSeasonId = resolveSelectedSeasonId(state);
	setSelectedSeasonIdToSession(selectedSeasonId);
	const seasonSelect = document.getElementById("pes-global-season-select");
	fillSeasonSelectElement(seasonSelect, state, selectedSeasonId);
	if (seasonSelect) {
		seasonSelect.value = selectedSeasonId || "";
	}
	const viewId = getViewIdFromHash();
	showOnlySection(viewId);
	renderDashboardView(state, selectedSeasonId);
	renderPlayersView(state);
	renderTeamsView(state);
	renderSeasonsView(state);
	renderFixturesView(state, selectedSeasonId);
	renderResultsView(state, selectedSeasonId);
	renderTableView(state, selectedSeasonId);
	renderRankingsView(state, selectedSeasonId);
	renderStatisticsView(state, selectedSeasonId);
	renderOneVsOneView(state);
	refreshTeamSelectElements();
}

function showToastMessage(message, variant, forceSuccess) {
	const host = document.getElementById("pes-toast-host");
	if (!host) {
		window.alert(message);
		return;
	}
	if (
		variant === "success" &&
		!forceSuccess &&
		typeof window.shouldSuppressPesSuccessToasts === "function" &&
		window.shouldSuppressPesSuccessToasts()
	) {
		return;
	}
	const tone =
		variant === "error"
			? "border-rose-200 bg-rose-50 text-rose-800"
			: "border-emerald-200 bg-emerald-50 text-emerald-800";
	const node = document.createElement("div");
	node.className = `pointer-events-auto rounded-lg border px-4 py-2 text-sm shadow-md ${tone}`;
	node.textContent = message;
	host.appendChild(node);
	const ms =
		typeof window.getPesToastDurationMs === "function"
			? window.getPesToastDurationMs()
			: 4200;
	window.setTimeout(() => {
		node.remove();
	}, ms);
}
