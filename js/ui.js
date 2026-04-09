/**
 * Presentation layer: builds DOM from application state (no business rules).
 */

const PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY = "pesLeagueSelectedSeasonId_v1";
const PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY = "pesLeagueSelectedPlayerProfileId_v1";

function getSelectedSeasonIdFromSession() {
  try {
    return window.sessionStorage.getItem(PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY);
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
    window.sessionStorage.setItem(PES_LEAGUE_SELECTED_SEASON_STORAGE_KEY, seasonId);
  } catch {
    // ignore
  }
}

function getSelectedPlayerProfileIdFromSession() {
  try {
    return window.sessionStorage.getItem(PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setSelectedPlayerProfileIdToSession(playerId) {
  try {
    if (!playerId) {
      window.sessionStorage.removeItem(PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(PES_LEAGUE_SELECTED_PLAYER_PROFILE_STORAGE_KEY, playerId);
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
  placeholder.textContent = "— izaberite sezonu —";
  selectElement.appendChild(placeholder);
  for (const season of seasons) {
    const option = document.createElement("option");
    option.value = season.id;
    option.textContent = `${season.name} (${season.status})`;
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
  const matchesForSeason = season
    ? listMatchesForSeason(state, season.id)
    : [];
  const playedCount = matchesForSeason.filter(
    (match) => match.status === "played"
  ).length;
  const scheduledCount = matchesForSeason.filter(
    (match) => match.status === "scheduled"
  ).length;
  const skippedCount = matchesForSeason.filter(
    (match) => match.status === "skipped"
  ).length;
  root.innerHTML = `
    <div class="pes6-dashboard-stats grid gap-0 sm:grid-cols-2 xl:grid-cols-4">
      ${renderStatCard("Igrači", String(playersCount), "Ukupno registrovanih članova")}
      ${renderStatCard("Timovi", String(teamsCount), "Jedinstveni klubovi / reprezentacije")}
      ${renderStatCard("Sezone", String(seasonsCount), "Turniri / lige")}
      ${renderStatCard(
        "Aktivna sezona",
        season ? escapeHtml(season.name) : "—",
        season
          ? `Status: ${season.status} · Kola: ${season.roundCount} · Odigrano: ${playedCount}/${matchesForSeason.length} · Zakazano: ${scheduledCount} · Preskočeno: ${skippedCount}`
          : "Izaberite sezonu u zaglavlju"
      )}
    </div>
    <div class="pes6-menu-panel mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 class="pes6-panel-title text-sm font-semibold text-slate-800">Brzi koraci</h3>
      <ol class="pes6-help-list mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600">
        <li>Dodajte timove i igrače (svaki igrač mora imati tim).</li>
        <li>Kreirajte sezonu i uključite učesnike.</li>
        <li>Generišite raspored (random round-robin, sa BYE ako je neparan broj).</li>
        <li>Unosite rezultate — tabela i statistika se računaju automatski.</li>
      </ol>
    </div>
  `;
}

function renderStatCard(title, value, subtitle) {
  return `
    <div class="pes6-stat-tile rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
      <div class="pes6-stat-tile__inner">
        <div class="pes6-stat-tile__label text-xs font-semibold uppercase tracking-[0.12em] text-indigo-500">${escapeHtml(
          title
        )}</div>
        <div class="pes6-stat-tile__value text-2xl font-bold text-slate-900">${value}</div>
        <div class="pes6-stat-tile__hint text-xs text-slate-500">${escapeHtml(subtitle)}</div>
      </div>
    </div>
  `;
}

function renderPlayersView(state) {
  const tableBody = document.getElementById("pes-players-table-body");
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
          player.createdAt
        )}</td>
        <td class="px-3 py-2 text-right text-sm">
          <button type="button" class="text-indigo-600 hover:underline pes-open-player-profile" data-player-id="${escapeHtml(
            player.id
          )}">Profil</button>
          <button type="button" class="text-indigo-600 hover:underline pes-edit-player" data-player-id="${escapeHtml(
            player.id
          )}">Izmeni</button>
          <button type="button" class="ml-3 text-rose-600 hover:underline pes-delete-player" data-player-id="${escapeHtml(
            player.id
          )}">Obriši</button>
        </td>
      </tr>
    `;
    })
    .join("");
  tableBody.innerHTML =
    rows ||
    `<tr><td colspan="4" class="px-3 py-6 text-center text-sm text-slate-500">Nema igrača.</td></tr>`;

  if (!players.length) {
    profileRoot.innerHTML = `<p class="text-sm text-slate-500">Dodaj igrača da vidiš profil i statistiku.</p>`;
    return;
  }
  const selectedPlayerId = getSelectedPlayerProfileIdFromSession();
  const selectedPlayer =
    players.find((item) => item.id === selectedPlayerId) || players[0];
  setSelectedPlayerProfileIdToSession(selectedPlayer.id);
  const selectedTeam = findTeamById(state, selectedPlayer.teamId);
  const profileStats = calculateCareerProfileStatsForPlayer(state, selectedPlayer.id);
  const mostPlayedOpponent = profileStats.mostPlayedAgainstPlayerId
    ? findPlayerById(state, profileStats.mostPlayedAgainstPlayerId)
    : null;
  const avgGoalsFor =
    profileStats.playedMatches > 0
      ? (profileStats.goalsFor / profileStats.playedMatches).toFixed(2)
      : "—";
  profileRoot.innerHTML = `
    <h3 class="text-sm font-semibold text-slate-800">Profil igrača</h3>
    <div class="mt-3 grid gap-4 md:grid-cols-[auto,1fr]">
      <img
        src="${escapeHtml(resolvePlayerAvatarUrl(selectedPlayer))}"
        alt=""
        class="h-24 w-24 rounded-xl object-cover ring-1 ring-slate-200"
      />
      <div>
        <div class="text-lg font-semibold text-slate-900">${escapeHtml(
          getPlayerDisplayName(selectedPlayer)
        )}</div>
        <div class="text-sm text-slate-600">Tim: ${escapeHtml(
          selectedTeam ? selectedTeam.name : "—"
        )}</div>
        <div class="mt-2 grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
          <div>Odigrane utakmice: <strong>${profileStats.playedMatches}</strong></div>
          <div>Dati golovi: <strong>${profileStats.goalsFor}</strong></div>
          <div>Primljeni golovi: <strong>${profileStats.goalsAgainst}</strong></div>
          <div>Gol razlika (GR): <strong>${profileStats.goalDifference}</strong></div>
          <div>Prosek datih golova / meč: <strong>${avgGoalsFor}</strong></div>
          <div>Pobede: <strong>${profileStats.wins}</strong></div>
          <div>Nerešene: <strong>${profileStats.draws}</strong></div>
          <div>Porazi: <strong>${profileStats.losses}</strong></div>
          <div>Najviše mečeva protiv: <strong>${escapeHtml(
            mostPlayedOpponent
              ? `${getPlayerDisplayName(mostPlayedOpponent)} (${profileStats.mostPlayedAgainstCount})`
              : "—"
          )}</strong></div>
        </div>
      </div>
    </div>
  `;
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
          .concat(team.website ? [buildClearbitLogoUrlFromWebsite(team.website)] : [])
      );
      const normalizedLogoUrl = candidateUrls[0] || "";
      const fallbackLogoUrls = candidateUrls.slice(1);
      const fallbackBadge = `<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">${escapeHtml(
        team.name.slice(0, 2).toUpperCase()
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
              team.name.slice(0, 2).toUpperCase()
            )}</div>
          </div>`
        : fallbackBadge;
      const leagueCountry = [team.league, team.country].filter(Boolean).join(" · ") || "—";
      const website = String(team.website || "").trim();
      const websiteHtml = website
        ? `<a class="text-xs text-indigo-600 hover:underline" href="${escapeHtml(
            website
          )}" target="_blank" rel="noopener noreferrer">Sajt</a>`
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
            team.id
          )}">Izmeni</button>
          <button type="button" class="ml-3 text-rose-600 hover:underline pes-delete-team" data-team-id="${escapeHtml(
            team.id
          )}">Obriši</button>
        </td>
      </tr>
    `;
    })
    .join("");
  tableBody.innerHTML =
    rows ||
    `<tr><td colspan="5" class="px-3 py-6 text-center text-sm text-slate-500">Nema timova.</td></tr>`;
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
      const doubleLabel = season.isDoubleRoundRobin ? "Da" : "Ne";
      return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-sm font-medium text-slate-800">${escapeHtml(
          season.name
        )}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${season.roundCount}</td>
        <td class="px-3 py-2 text-sm text-slate-600">${season.participantCount}</td>
        <td class="px-3 py-2 text-xs text-slate-500">${formatDateOnly(
          season.createdAt
        )}</td>
        <td class="px-3 py-2 text-sm">
          <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">${escapeHtml(
            season.status
          )}</span>
        </td>
        <td class="px-3 py-2 text-sm text-slate-700">${doubleLabel}</td>
        <td class="px-3 py-2 text-right text-sm">
          <button type="button"
            class="pes-generate-fixtures rounded px-1 py-0.5 text-indigo-600 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isDraft ? "" : "disabled"}>Generiši</button>
          <button type="button"
            class="pes-season-double ml-2 rounded px-1 py-0.5 text-slate-700 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isDraft ? "" : "disabled"}>Dupli krug</button>
          <button type="button"
            class="pes-reset-season ml-2 rounded px-1 py-0.5 text-amber-800 hover:underline"
            data-season-id="${escapeHtml(season.id)}">Reset</button>
          <button type="button"
            class="pes-finish-season ml-2 rounded px-1 py-0.5 text-emerald-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isActive ? "" : "disabled"}>Završi</button>
          <button type="button"
            class="pes-clone-season ml-2 rounded px-1 py-0.5 text-indigo-800 hover:underline disabled:cursor-not-allowed disabled:opacity-40"
            data-season-id="${escapeHtml(season.id)}"
            ${isFinished ? "" : "disabled"}>Nova</button>
        </td>
      </tr>
    `;
    })
    .join("");
  tableBody.innerHTML =
    rows ||
    `<tr><td colspan="7" class="px-3 py-6 text-center text-sm text-slate-500">Nema sezona.</td></tr>`;

  const participantSelect = document.getElementById(
    "pes-season-participant-ids"
  );
  if (participantSelect) {
    const previous = Array.from(participantSelect.selectedOptions).map(
      (option) => option.value
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
        (option) => option.value === value
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
    root.innerHTML = `<p class="text-sm text-slate-600">Izaberite sezonu u zaglavlju.</p>`;
    return;
  }
  const season = findSeasonById(state, selectedSeasonId);
  if (!season) {
    root.innerHTML = `<p class="text-sm text-rose-600">Sezona nije pronađena.</p>`;
    return;
  }
  const roundFilter = document.getElementById("pes-fixture-round-filter");
  const unplayedOnly = document.getElementById("pes-fixture-unplayed-only");
  const roundValue = roundFilter ? roundFilter.value : "";
  const onlyUnplayed = unplayedOnly ? unplayedOnly.checked : false;
  let matches = listMatchesForSeason(state, season.id);
  if (onlyUnplayed) {
    matches = matches.filter(
      (match) => match.status === "scheduled" || match.status === "skipped"
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
    (_, index) => index + 1
  );
  const filterHtml = `
    <div class="mb-4 flex flex-wrap items-end gap-3">
      <label class="text-xs font-medium text-slate-600">Kolo
        <select id="pes-fixture-round-filter" class="mt-1 block rounded-lg border border-slate-300 px-2 py-1 text-sm">
          <option value="">Sva kola</option>
          ${roundOptions
            .map(
              (roundNumber) =>
                `<option value="${roundNumber}" ${
                  String(roundNumber) === roundValue ? "selected" : ""
                }>Kolo ${roundNumber}</option>`
            )
            .join("")}
        </select>
      </label>
      <label class="flex items-center gap-2 text-xs text-slate-600">
        <input id="pes-fixture-unplayed-only" type="checkbox" class="rounded border-slate-300" ${
          onlyUnplayed ? "checked" : ""
        } />
        Samo neodigrane (zakazane + preskočene)
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
            ? "Preskočeno"
            : "Zakazano";
      return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-xs text-slate-500">${match.round}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
          homeName
        )} <span class="text-xs text-slate-500">(${escapeHtml(
        homeTeamName
      )})</span></td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(
          awayName
        )} <span class="text-xs text-slate-500">(${escapeHtml(
        awayTeamName
      )})</span></td>
        <td class="px-3 py-2 text-xs">${escapeHtml(match.status)}</td>
        <td class="px-3 py-2 text-sm font-medium text-slate-800">${escapeHtml(
          statusLabel
        )}</td>
      </tr>
    `;
    })
    .join("");
  root.innerHTML = `
    ${filterHtml}
    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">Kolo</th>
            <th class="px-3 py-2">Domaćin</th>
            <th class="px-3 py-2">Gost</th>
            <th class="px-3 py-2">Status</th>
            <th class="px-3 py-2">Rezultat</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Nema utakmica za prikaz.</td></tr>`
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

function renderResultsView(state, selectedSeasonId) {
  const root = document.getElementById("pes-results-root");
  if (!root) {
    return;
  }
  if (!selectedSeasonId) {
    root.innerHTML = `<p class="text-sm text-slate-600">Izaberite sezonu u zaglavlju.</p>`;
    return;
  }
  const season = findSeasonById(state, selectedSeasonId);
  if (!season) {
    root.innerHTML = `<p class="text-sm text-rose-600">Sezona nije pronađena.</p>`;
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
      return `
      <tr class="border-t border-slate-100">
        <td class="px-3 py-2 text-xs text-slate-500">${match.round}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(homeName)}</td>
        <td class="px-3 py-2 text-sm text-slate-800">${escapeHtml(awayName)}</td>
        <td class="px-3 py-2">
          <form class="flex flex-wrap items-center gap-2 pes-result-form" data-match-id="${escapeHtml(
            match.id
          )}">
            <input name="homeScore" type="number" min="0" step="1" class="w-16 rounded border border-slate-300 px-2 py-1 text-sm" value="${escapeHtml(
              homeScoreValue
            )}" />
            <span class="text-slate-500">:</span>
            <input name="awayScore" type="number" min="0" step="1" class="w-16 rounded border border-slate-300 px-2 py-1 text-sm" value="${escapeHtml(
              awayScoreValue
            )}" />
            <button type="submit" class="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-500">Sačuvaj</button>
            ${
              isPlayed
                ? `<button type="button" class="rounded-lg border border-slate-300 px-3 py-1 text-xs pes-revert-match" data-match-id="${escapeHtml(
                    match.id
                  )}">Poništi</button>`
                : ""
            }
            ${
              !isPlayed
                ? `<button type="button" class="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800 pes-skip-match" data-match-id="${escapeHtml(
                    match.id
                  )}">Preskoči</button>`
                : ""
            }
            ${
              isSkipped
                ? `<span class="text-[11px] font-medium text-amber-700">Preskočeno — odigraj naknadno</span>`
                : ""
            }
          </form>
        </td>
        <td class="px-3 py-2 text-xs text-slate-500">${formatIsoDateToDisplay(
          match.playedAt
        )}</td>
      </tr>
    `;
    })
    .join("");
  root.innerHTML = `
    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table class="min-w-full divide-y divide-slate-200 text-left text-sm">
        <thead class="bg-slate-50 text-xs uppercase text-slate-500">
          <tr>
            <th class="px-3 py-2">Kolo</th>
            <th class="px-3 py-2">Domaćin</th>
            <th class="px-3 py-2">Gost</th>
            <th class="px-3 py-2">Unos</th>
            <th class="px-3 py-2">Odigrano</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Nema utakmica.</td></tr>`
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
      html: `<p class="text-sm text-slate-600">Izaberite sezonu u zaglavlju.</p>`,
    };
  }
  const season = findSeasonById(state, selectedSeasonId);
  if (!season) {
    return {
      ok: false,
      html: `<p class="text-sm text-rose-600">Sezona nije pronađena.</p>`,
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
          playerLabel
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
            <th class="px-3 py-2">#</th>
            <th class="px-3 py-2">Igrač</th>
            <th class="px-3 py-2">Tim</th>
            <th class="px-3 py-2">O</th>
            <th class="px-3 py-2">P</th>
            <th class="px-3 py-2">N</th>
            <th class="px-3 py-2">I</th>
            <th class="px-3 py-2">DG</th>
            <th class="px-3 py-2">PG</th>
            <th class="px-3 py-2">GR</th>
            <th class="px-3 py-2">B</th>
          </tr>
        </thead>
        <tbody>
          ${
            rows ||
            `<tr><td colspan="11" class="px-3 py-6 text-center text-slate-500">Nema podataka — unesite rezultate.</td></tr>`
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
    const season = selectedSeasonId ? findSeasonById(state, selectedSeasonId) : null;
    seasonHint.textContent = season
      ? `Aktivna sezona u zaglavlju: ${season.name} (${season.status})`
      : "Izaberite sezonu u zaglavlju.";
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
    root.innerHTML = `<p class="text-sm text-slate-600">Izaberite sezonu u zaglavlju.</p>`;
    return;
  }
  const globals = calculateGlobalStatisticsForSeason(state, selectedSeasonId);
  const playerStats = calculatePlayerStatisticsForSeason(
    state,
    selectedSeasonId
  );
  const globalHtml = `
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      ${renderStatCard(
        "Ukupno odigranih mečeva",
        String(globals.totalMatches),
        "U izabranoj sezoni"
      )}
      ${renderStatCard(
        "Ukupno golova",
        String(globals.totalGoals),
        "Zbir oba tima"
      )}
      ${renderStatCard(
        "Prosek golova po meču",
        globals.averageGoalsPerMatch.toFixed(2),
        "Liga prosečno"
      )}
      ${renderStatCard(
        "Najbolji napad",
        globals.bestAttackPlayerId
          ? escapeHtml(
              getPlayerDisplayName(
                findPlayerById(state, globals.bestAttackPlayerId)
              )
            )
          : "—",
        globals.bestAttackPlayerId
          ? `${globals.bestAttackGoals} golova`
          : "Nema odigranih mečeva"
      )}
      ${renderStatCard(
        "Najbolja odbrana",
        globals.bestDefensePlayerId
          ? escapeHtml(
              getPlayerDisplayName(
                findPlayerById(state, globals.bestDefensePlayerId)
              )
            )
          : "—",
        globals.bestDefensePlayerId
          ? `${globals.bestDefenseConceded} primljenih`
          : "Nema odigranih mečeva"
      )}
      ${renderStatCard(
        "Najviše bodova",
        globals.topPointsPlayerId
          ? escapeHtml(
              getPlayerDisplayName(
                findPlayerById(state, globals.topPointsPlayerId)
              )
            )
          : "—",
        `${globals.topPoints} bodova`
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
          2
        )}</td>
        <td class="px-3 py-2 text-sm font-mono text-slate-800">${escapeHtml(
          row.formLastFive || "—"
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
            <th class="px-3 py-2">Igrač</th>
            <th class="px-3 py-2">Mečevi</th>
            <th class="px-3 py-2">P</th>
            <th class="px-3 py-2">N</th>
            <th class="px-3 py-2">I</th>
            <th class="px-3 py-2">DG</th>
            <th class="px-3 py-2">PG</th>
            <th class="px-3 py-2">Ø gol/m</th>
            <th class="px-3 py-2">Forma (5)</th>
          </tr>
        </thead>
        <tbody>
          ${
            playerRows ||
            `<tr><td colspan="9" class="px-3 py-6 text-center text-slate-500">Nema statistike.</td></tr>`
          }
        </tbody>
      </table>
    </div>
  `;
  root.innerHTML = `${globalHtml}${tableHtml}`;
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
      placeholder.textContent = "— izaberite ili unesite novi ispod —";
      select.appendChild(placeholder);
    }
    for (const team of teams) {
      const option = document.createElement("option");
      option.value = team.id;
      option.textContent = team.name;
      select.appendChild(option);
    }
    if (previous && Array.from(select.options).some((option) => option.value === previous)) {
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
  refreshTeamSelectElements();
}

function showToastMessage(message, variant) {
  const host = document.getElementById("pes-toast-host");
  if (!host) {
    window.alert(message);
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
  window.setTimeout(() => {
    node.remove();
  }, 4200);
}
