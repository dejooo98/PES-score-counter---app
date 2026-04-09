/**
 * Prevodi (sr/en). Koristi getPesAppSettings().language
 */

function getPesI18nLang() {
  try {
    return getPesAppSettings().language === "en" ? "en" : "sr";
  } catch {
    return "sr";
  }
}

const I18N_SR = {
  "meta.pageTitle": "PES liga — menadžer",
  "nav.dashboard": "Dashboard",
  "nav.players": "Igrači",
  "nav.teams": "Timovi",
  "nav.seasons": "Sezone",
  "nav.fixtures": "Raspored",
  "nav.results": "Rezultati",
  "nav.table": "Tabela",
  "nav.rankings": "Poredak",
  "nav.statistics": "Statistika",
  "nav.oneVsOne": "1 na 1",
  "nav.oneVsOneRegion": "Brzi duel 1 na 1",
  "header.tagline": "Menadžer lige — lokalno ili cloud sync.",
  "header.seasonLabel": "Aktivna sezona za prikaz",
  "header.chooseSeason": "— izaberite sezonu —",
  "header.cloudSettings": "Cloud podešavanja",
  "header.syncNow": "Sync sada",
  "header.appSettings": "Podešavanja aplikacije",
  "header.menuOpen": "Otvori meni: sezona i cloud",
  "header.menuClose": "Zatvori meni: sezona i cloud",
  "header.toolsRegionAria": "Sezona i cloud",
  "mainNav.aria": "Glavni meni",

  "cloud.pillOffline": "Offline (localStorage)",
  "cloud.pillOn": "Cloud ON",
  "cloud.pillOnTime": "Cloud ON · {time}",

  "sound.on": "Zvuk: ON",
  "sound.off": "Zvuk: OFF",

  "settings.title": "Podešavanja aplikacije i prikaza",
  "settings.intro": "Ove opcije se čuvaju u pregledaču (localStorage) na ovom uređaju.",
  "settings.sectionUi": "Izgled",
  "settings.sectionBehavior": "Ponašanje",
  "settings.sectionData": "Datumi i export",
  "settings.sectionLang": "Jezik i start",
  "settings.density": "Gustina tabela / lista",
  "settings.densityComfortable": "Udobno",
  "settings.densityCompact": "Kompaktno",
  "settings.reduceMotion": "Animacije",
  "settings.motionSystem": "Kao sistem (preporučeno)",
  "settings.motionOn": "Smanjene",
  "settings.motionOff": "Uobičajene",
  "settings.textScale": "Veličina teksta",
  "settings.textSm": "Manja",
  "settings.textMd": "Standard",
  "settings.textLg": "Veća",
  "settings.strongFocus": "Jači fokus (outline)",
  "settings.largeTouch": "Veće površine za dodir",
  "settings.cloudInterval": "Automatski cloud sync (povlačenje)",
  "settings.intervalManual": "Samo ručno",
  "settings.interval15": "Na 15 s",
  "settings.interval30": "Na 30 s",
  "settings.interval60": "Na 1 min",
  "settings.confirmDanger": "Pitaj pre brisanja / rizičnih akcija",
  "settings.toastDuration": "Trajanje obaveštenja (toast)",
  "settings.toastShort": "Kratko",
  "settings.toastNormal": "Normalno",
  "settings.toastLong": "Dugo",
  "settings.suppressSuccess": "Ne prikazuj toast za uspeh (samo greške)",
  "settings.dateFormat": "Format datuma u prikazu i CSV",
  "settings.dateEu": "DD.MM.YYYY (evropski)",
  "settings.dateIso": "ISO 8601",
  "settings.exportSlug": "Prefiks imena CSV fajlova (liga)",
  "settings.exportSlugHint": "npr. seoski-liga — datoteke: pes-seoski-liga-tabela-….csv",
  "settings.language": "Jezik interfejsa",
  "settings.startupView": "Ekran pri otvaranju aplikacije",
  "settings.startDashboard": "Dashboard",
  "settings.startLast": "Zapamti poslednji ekran",
  "settings.startView.players": "Igrači",
  "settings.startView.teams": "Timovi",
  "settings.startView.seasons": "Sezone",
  "settings.startView.fixtures": "Raspored",
  "settings.startView.results": "Rezultati",
  "settings.startView.table": "Tabela",
  "settings.startView.rankings": "Poredak",
  "settings.startView.statistics": "Statistika",
  "settings.startView.oneVsOne": "1 na 1",
  "settings.cancel": "Zatvori",
  "settings.save": "Sačuvaj",

  "season.draft": "nacrt",
  "season.active": "aktivna",
  "season.finished": "završena",
  "match.scheduled": "zakazano",
  "match.played": "odigrano",
  "match.skipped": "preskočeno",
  "common.yes": "Da",
  "common.no": "Ne",
  "common.pickSeasonHeader": "Izaberite sezonu u zaglavlju.",
  "common.seasonNotFound": "Sezona nije pronađena.",
  "common.dash": "—",

  "dash.tile.players": "Igrači",
  "dash.tile.playersSub": "Ukupno registrovanih članova",
  "dash.tile.teams": "Timovi",
  "dash.tile.teamsSub": "Jedinstveni klubovi / reprezentacije",
  "dash.tile.seasons": "Sezone",
  "dash.tile.seasonsSub": "Turniri / lige",
  "dash.tile.activeSeason": "Aktivna sezona",
  "dash.tile.seasonDetail":
    "Status: {status} · Kola: {rounds} · Odigrano: {played}/{total} · Zakazano: {sched} · Preskočeno: {skip}",
  "dash.tile.pickSeason": "Izaberite sezonu u zaglavlju",
  "dash.quickTitle": "Brzi koraci",
  "dash.help1": "Dodajte timove i igrače (svaki igrač mora imati tim).",
  "dash.help2": "Kreirajte sezonu i uključite učesnike.",
  "dash.help3": "Generišite raspored (random round-robin, sa BYE ako je neparan broj).",
  "dash.help4": "Unosite rezultate — tabela i statistika se računaju automatski.",

  "players.th.player": "Igrač",
  "players.th.team": "Tim",
  "players.th.added": "Dodato",
  "players.th.actions": "Akcije",
  "players.profile": "Profil",
  "players.edit": "Izmeni",
  "players.delete": "Obriši",
  "players.empty": "Nema igrača.",
  "players.profileEmpty": "Dodaj igrača da vidiš profil i statistiku.",
  "players.profileTitle": "Profil igrača",
  "players.teamPrefix": "Tim:",
  "players.stat.played": "Odigrane utakmice:",
  "players.stat.gf": "Dati golovi:",
  "players.stat.ga": "Primljeni golovi:",
  "players.stat.gd": "Gol razlika (GR):",
  "players.stat.avgGf": "Prosek datih golova / meč:",
  "players.stat.wins": "Pobede:",
  "players.stat.draws": "Nerešene:",
  "players.stat.losses": "Porazi:",
  "players.stat.rival": "Najviše mečeva protiv:",
  "players.careerLeague": "Liga i turniri",
  "players.careerOneVsOne": "1 na 1",
  "search.players.placeholder": "Pretraga po imenu ili nadimku…",

  "oneVsOne.intro":
    "Izaberite dva igrača i unesite rezultat. Ovi mečevi ne utiču na tabelu sezone; statistika se vodi u profilu igrača.",
  "oneVsOne.formTitle": "Novi meč 1 na 1",
  "oneVsOne.pickPlayer": "— izaberite igrača —",
  "oneVsOne.home": "Domaćin (kontroler 1)",
  "oneVsOne.away": "Gost (kontroler 2)",
  "oneVsOne.scoreHome": "Golovi domaćina",
  "oneVsOne.scoreAway": "Golovi gosta",
  "oneVsOne.submit": "Sačuvaj rezultat",
  "oneVsOne.historyTitle": "Poslednji mečevi 1 na 1",
  "oneVsOne.historyEmpty": "Još nema sačuvanih mečeva 1 na 1.",
  "oneVsOne.thDate": "Datum",
  "oneVsOne.thHome": "Domaćin",
  "oneVsOne.thAway": "Gost",
  "oneVsOne.thScore": "Rez.",

  "teams.website": "Sajt",
  "teams.edit": "Izmeni",
  "teams.delete": "Obriši",
  "teams.empty": "Nema timova.",

  "seasons.generate": "Generiši",
  "seasons.double": "Dupli krug",
  "seasons.reset": "Reset",
  "seasons.finish": "Završi",
  "seasons.clone": "Nova",
  "seasons.empty": "Nema sezona.",

  "fixtures.roundLabel": "Kolo",
  "fixtures.allRounds": "Sva kola",
  "fixtures.roundN": "Kolo {n}",
  "fixtures.unplayedOnly": "Samo neodigrane (zak. + presk.)",
  "fixtures.th.round": "Kolo",
  "fixtures.th.home": "Domaćin",
  "fixtures.th.away": "Gost",
  "fixtures.th.status": "Status",
  "fixtures.th.result": "Rezultat",
  "fixtures.empty": "Nema utakmica za prikaz.",
  "fixtures.scheduled": "Zakazano",

  "results.save": "Sačuvaj",
  "results.revert": "Poništi",
  "results.skip": "Preskoči",
  "results.skippedHint": "Preskočeno — odigraj naknadno",
  "results.th.round": "Kolo",
  "results.th.home": "Domaćin",
  "results.th.away": "Gost",
  "results.th.input": "Unos",
  "results.th.playedAt": "Odigrano",
  "results.empty": "Nema utakmica.",

  "table.emptyData": "Nema podataka — unesite rezultate.",
  "table.th.hash": "#",
  "table.th.player": "Igrač",
  "table.th.team": "Tim",
  "table.th.mp": "O",
  "table.th.w": "P",
  "table.th.d": "N",
  "table.th.l": "I",
  "table.th.gf": "DG",
  "table.th.ga": "PG",
  "table.th.gd": "GR",
  "table.th.pts": "B",

  "rankings.hint": "Aktivna sezona u zaglavlju: {name} ({status})",

  "stats.tile.matches": "Ukupno odigranih mečeva",
  "stats.tile.matchesSub": "U izabranoj sezoni",
  "stats.tile.goals": "Ukupno golova",
  "stats.tile.goalsSub": "Zbir oba tima",
  "stats.tile.avg": "Prosek golova po meču",
  "stats.tile.avgSub": "Liga prosečno",
  "stats.tile.attack": "Najbolji napad",
  "stats.tile.attackGoals": "{n} golova",
  "stats.tile.noPlayed": "Nema odigranih mečeva",
  "stats.tile.defense": "Najbolja odbrana",
  "stats.tile.defenseConceded": "{n} primljenih",
  "stats.tile.points": "Najviše bodova",
  "stats.tile.pointsSub": "{n} bodova",
  "stats.th.player": "Igrač",
  "stats.th.matches": "Mečevi",
  "stats.th.w": "P",
  "stats.th.d": "N",
  "stats.th.l": "I",
  "stats.th.gf": "DG",
  "stats.th.ga": "PG",
  "stats.th.avg": "Ø gol/m",
  "stats.th.form": "Forma (5)",
  "stats.empty": "Nema statistike.",

  "form.teamSelectPh": "— izaberite ili unesite novi ispod —",

  "export.standings": "Export CSV (tabela)",
  "export.rankings": "Export CSV (poredak)",
  "export.results": "Export CSV (rezultati)",

  "footer.hint":
    "Podaci se čuvaju u localStorage (i opcionalno cloud sync preko Supabase) ključu {code}. Možete napraviti rezervnu kopiju preko exporta JSON-a u konzoli: {fn}",

  "cloud.modalTitle": "Cloud sync (Supabase + Netlify)",
  "cloud.modalIntro":
    "Svi uređaji moraju koristiti isti URL, anon key i League ID da bi delili istu ligu.",
  "cloud.url": "Supabase URL",
  "cloud.anon": "Supabase anon key",
  "cloud.leagueId": "League ID (npr. seoski-liga-2026)",
  "cloud.disable": "Isključi cloud",
  "cloud.cancel": "Otkaži",
  "cloud.saveConnect": "Sačuvaj i poveži",

  "playerModal.title": "Izmena igrača",
  "playerModal.cancel": "Otkaži",
  "playerModal.save": "Sačuvaj",

  "teamModal.title": "Izmena tima",

  "prompt.newSeasonName": "Naziv nove sezone:",
  "prompt.newSeasonDefault": "Nova sezona",

  "confirm.deletePlayer": "Da li ste sigurni da želite da obrišete igrača?",
  "confirm.deleteTeam": "Da li ste sigurni da želite da obrišete tim?",
  "confirm.resetSeason": "Resetovaćete raspored ove sezone (bez odigranih mečeva). Nastaviti?",
  "confirm.revertMatch": "Poništiti rezultat i vratiti meč u zakazano?",
  "confirm.disableCloud": "Isključiti cloud sync i ostati samo na localStorage režimu?",

  "toast.cloudPulled": "Učitane su izmene iz clouda.",
  "toast.teamSaved": "Tim je sačuvan.",
  "toast.playerNeedsTeam": "Izaberite najmanje dva igrača.",
  "toast.seasonDraft": "Sezona je kreirana (nacrt).",
  "toast.playerUpdated": "Igrač je ažuriran.",
  "toast.teamUpdated": "Tim je ažuriran.",
  "toast.playerDeleted": "Igrač je obrisan.",
  "toast.teamDeleted": "Tim je obrisan.",
  "toast.fixturesGenerated": "Raspored je generisan ({count} mečeva).",
  "toast.doubleOn": "Dupli krug: UKLJUČEN.",
  "toast.doubleOff": "Dupli krug: ISKLJUČEN.",
  "toast.seasonDraftReset": "Sezona je vraćena u nacrt.",
  "toast.seasonFinished": "Sezona je označena kao završena.",
  "toast.seasonCloned": "Nova sezona (nacrt) je kreirana sa istim igračima.",
  "toast.apiTeamMissing": "Izabrani API tim nije pronađen.",
  "toast.teamExists": "Tim već postoji u tvojoj listi.",
  "toast.teamAdded": "Tim \"{name}\" je dodat.",
  "toast.resultSaved": "Rezultat je sačuvan.",
  "toast.matchSkipped": "Utakmica je preskočena. Možeš je odigrati kasnije.",
  "toast.matchReverted": "Meč je vraćen u zakazano.",
  "toast.pickSeason": "Izaberite sezonu.",
  "toast.cloudDisabled": "Cloud sync je isključen.",
  "toast.cloudActivated": "Cloud sync uspešno aktiviran.",
  "toast.cloudNotSet": "Cloud nije podešen. Otvorite Cloud podešavanja.",
  "toast.cloudSynced": "Učitane su najnovije izmene iz clouda.",
  "toast.cloudCurrent": "Cloud je već ažuran.",
  "toast.settingsSaved": "Podešavanja su sačuvana.",
  "toast.playerSaved": "Igrač je sačuvan.",
  "toast.oneVsOneSaved": "Meč 1 na 1 je sačuvan.",
  "toast.avatarError": "Avatar greška: {detail}",
  "toast.cloudError": "Cloud greška: {detail}",
  "toast.syncError": "Sync greška: {detail}",

  "discovery.enterQuery": "Unesite naziv za pretragu.",
  "discovery.loadingSearch": "Učitavanje timova…",
  "discovery.foundCount": "Pronađeno timova: {n}",
  "discovery.searchFailed": "Greška pri pretrazi{hint}: {msg}",
  "discovery.leagueFailed": "Greška pri učitavanju lige{hint}: {msg}",
  "discovery.fileHint": " (probaj preko Netlify ili local servera)",
  "discovery.unknownErr": "nepoznata greška",
  "discovery.pickLeague": "Izaberite ligu.",
  "discovery.loadingLeague": "Učitavanje lige…",
  "discovery.leagueCount": "{name} · timova: {n}",

  "error.cloudNotConfigured": "Cloud sync nije podešen.",
  "error.playerNameRequired": "Ime je obavezno.",
  "error.pickValidTeam": "Izaberite validan tim.",
  "error.playerNotFound": "Igrač nije pronađen.",
  "error.playerDeletePlayed":
    "Brisanje nije dozvoljeno jer igrač ima odigrane utakmice. Uklonite ili izmenite rezultate prvo.",
  "error.playerDeleteScheduled":
    "Igrač se pojavljuje u rasporedu. Resetujte sezonu ili obrišite utakmice pre brisanja igrača.",
  "error.teamNameRequired": "Naziv tima je obavezan.",
  "error.teamDuplicate": "Tim sa istim ili sličnim nazivom već postoji. Izaberite postojeći tim.",
  "error.teamNotFound": "Tim nije pronađen.",
  "error.teamNameInUse": "Drugi tim već koristi ovaj naziv.",
  "error.teamHasPlayers": "Tim se koristi kod igrača. Dodelite drugi tim igračima pre brisanja.",
  "error.selectedTeamMissing": "Izabrani tim ne postoji.",
  "error.teamNameOrSelect": "Unesite naziv novog tima ili izaberite postojeći.",
  "error.seasonNameRequired": "Naziv sezone je obavezan.",
  "error.seasonMinPlayers": "Potrebna su najmanje 2 igrača za sezonu.",
  "error.seasonPlayerMissing": "Jedan od igrača ne postoji.",
  "error.seasonNotFound": "Sezona nije pronađena.",
  "error.doubleRoundDraft": "Dupli krug može da se podešava samo u nacrtu pre generisanja rasporeda.",
  "error.seasonBadStatus": "Nepoznat status sezone.",
  "error.sourceSeasonMissing": "Izvorna sezona ne postoji.",
  "error.newSeasonNameRequired": "Naziv nove sezone je obavezan.",
  "error.newSeasonPlayers": "Nedovoljno postojećih igrača za novu sezonu.",
  "error.fixtureSeasonNotFound": "Sezona nije pronađena.",
  "error.fixtureDraftOnly": "Raspored se može generisati samo za sezonu u statusu nacrt.",
  "error.fixtureExists": "Raspored već postoji. Resetujte sezonu pre ponovnog generisanja.",
  "error.fixtureMinPlayers": "Premalo učesnika za raspored.",
  "error.fixtureTeamLink": "Nije moguće povezati timove za meč.",
  "error.scoreInt": "Rezultat mora biti ceo broj ≥ 0.",
  "error.matchNotFound": "Utakmica nije pronađena.",
  "error.oneVsOnePickTwo": "Izaberite dva različita igrača.",
  "error.resetHasPlayed":
    "Reset nije moguć jer postoje odigrane utakmice. Završite ili arhivirajte sezonu drugačije.",

  "section.dashboard": "Dashboard",
  "section.players": "Igrači",
  "section.players.h2": "Igrači",
  "section.teams": "Timovi",
  "section.seasons": "Sezone / turniri",
  "section.fixtures": "Raspored utakmica",
  "section.results": "Unos rezultata",
  "section.table": "Tabela",
  "section.rankings": "Poredak igrača",
  "section.statistics": "Statistika",
  "section.oneVsOne": "1 na 1",

  "form.player.newTitle": "Novi igrač",
  "form.player.firstName": "Ime *",
  "form.player.lastName": "Prezime / nadimak",
  "form.player.team": "Postojeći tim",
  "form.player.newTeam": "Novi tim (ako ne birate iz liste)",
  "form.player.avatar": "Profilna slika (opciono)",
  "form.player.submit": "Sačuvaj igrača",

  "form.team.newTitle": "Novi tim",
  "form.team.name": "Naziv *",
  "form.team.logoUrl": "URL loga / slike (opciono)",
  "form.team.league": "Liga",
  "form.team.country": "Država",
  "form.team.stadium": "Stadion",
  "form.team.founded": "Osnovan",
  "form.team.website": "Sajt",
  "form.team.submit": "Sačuvaj tim",
  "form.teamFinder.title": "Team Finder (API)",
  "form.teamFinder.intro": "Pretraga timova po nazivu ili ligi. Jednim klikom dodaj tim u svoju bazu.",
  "form.teamFinder.searchPh": "npr. Manchester",
  "form.teamFinder.searchBtn": "Pretraži",
  "form.teamFinder.showLeague": "Prikaži ligu",

  "form.season.newTitle": "Nova sezona (nacrt)",
  "form.season.name": "Naziv *",
  "form.season.participants": "Učesnici (Ctrl+klik više) *",
  "form.season.submit": "Kreiraj sezonu",
  "form.season.hint":
    "Zatim u tabeli ispod koristite „Generiši” za random round-robin raspored (BYE ako je neparan broj). „Dupli krug” uključuje povratne mečeve pre generisanja.",

  "table.seasons.th.name": "Naziv",
  "table.seasons.th.rounds": "Kola",
  "table.seasons.th.participants": "Učesnika",
  "table.seasons.th.created": "Kreirano",
  "table.seasons.th.status": "Status",
  "table.seasons.th.double": "Dupli",
  "table.seasons.th.actions": "Akcije",

  "table.teams.th.team": "Tim",
  "table.teams.th.league": "Liga / država",
  "table.teams.th.stadium": "Stadion",
  "table.teams.th.founded": "Osnovan",
  "table.teams.th.actions": "Akcije",

};

const I18N_EN = {
  "meta.pageTitle": "PES league — manager",
  "header.tagline": "League manager — local or cloud sync.",
  "header.seasonLabel": "Active season for display",
  "header.chooseSeason": "— choose season —",
  "header.cloudSettings": "Cloud settings",
  "header.syncNow": "Sync now",
  "header.appSettings": "App settings",
  "header.menuOpen": "Open menu: season & cloud",
  "header.menuClose": "Close menu: season & cloud",
  "header.toolsRegionAria": "Season and cloud",
  "mainNav.aria": "Main menu",

  "cloud.pillOffline": "Offline (localStorage)",
  "cloud.pillOn": "Cloud ON",
  "cloud.pillOnTime": "Cloud ON · {time}",

  "sound.on": "Sound: ON",
  "sound.off": "Sound: OFF",

  "settings.title": "App & display settings",
  "settings.intro": "These options are stored in the browser (localStorage) on this device.",
  "settings.sectionUi": "Appearance",
  "settings.sectionBehavior": "Behavior",
  "settings.sectionData": "Dates & export",
  "settings.sectionLang": "Language & startup",
  "settings.density": "Table / list density",
  "settings.densityComfortable": "Comfortable",
  "settings.densityCompact": "Compact",
  "settings.reduceMotion": "Animation",
  "settings.motionSystem": "Match system (recommended)",
  "settings.motionOn": "Reduced",
  "settings.motionOff": "Full",
  "settings.textScale": "Text size",
  "settings.textSm": "Smaller",
  "settings.textMd": "Default",
  "settings.textLg": "Larger",
  "settings.strongFocus": "Stronger focus ring",
  "settings.largeTouch": "Larger touch targets",
  "settings.cloudInterval": "Automatic cloud pull",
  "settings.intervalManual": "Manual only",
  "settings.interval15": "Every 15 s",
  "settings.interval30": "Every 30 s",
  "settings.interval60": "Every 1 min",
  "settings.confirmDanger": "Confirm before delete / risky actions",
  "settings.toastDuration": "Toast duration",
  "settings.toastShort": "Short",
  "settings.toastNormal": "Normal",
  "settings.toastLong": "Long",
  "settings.suppressSuccess": "Hide success toasts (errors only)",
  "settings.dateFormat": "Date format (UI & CSV)",
  "settings.dateEu": "DD.MM.YYYY (EU)",
  "settings.dateIso": "ISO 8601",
  "settings.exportSlug": "CSV filename prefix (league)",
  "settings.exportSlugHint": "e.g. village-league → pes-village-league-table-….csv",
  "settings.language": "Interface language",
  "settings.startupView": "Screen when opening the app",
  "settings.startDashboard": "Dashboard",
  "settings.startLast": "Remember last screen",
  "settings.startView.players": "Players",
  "settings.startView.teams": "Teams",
  "settings.startView.seasons": "Seasons",
  "settings.startView.fixtures": "Fixtures",
  "settings.startView.results": "Results",
  "settings.startView.table": "Table",
  "settings.startView.rankings": "Rankings",
  "settings.startView.statistics": "Statistics",
  "settings.startView.oneVsOne": "1v1",
  "settings.cancel": "Close",
  "settings.save": "Save",

  "nav.dashboard": "Dashboard",
  "nav.players": "Players",
  "nav.teams": "Teams",
  "nav.seasons": "Seasons",
  "nav.fixtures": "Fixtures",
  "nav.results": "Results",
  "nav.table": "Table",
  "nav.rankings": "Rankings",
  "nav.statistics": "Statistics",
  "nav.oneVsOne": "1v1",
  "nav.oneVsOneRegion": "Quick 1v1",

  "season.draft": "draft",
  "season.active": "active",
  "season.finished": "finished",
  "match.scheduled": "scheduled",
  "match.played": "played",
  "match.skipped": "skipped",
  "common.yes": "Yes",
  "common.no": "No",
  "common.pickSeasonHeader": "Choose a season in the header.",
  "common.seasonNotFound": "Season not found.",
  "common.dash": "—",

  "dash.tile.players": "Players",
  "dash.tile.playersSub": "Registered members",
  "dash.tile.teams": "Teams",
  "dash.tile.teamsSub": "Unique clubs",
  "dash.tile.seasons": "Seasons",
  "dash.tile.seasonsSub": "Tournaments / leagues",
  "dash.tile.activeSeason": "Active season",
  "dash.tile.seasonDetail":
    "Status: {status} · Rounds: {rounds} · Played: {played}/{total} · Scheduled: {sched} · Skipped: {skip}",
  "dash.tile.pickSeason": "Choose a season in the header",
  "dash.quickTitle": "Quick steps",
  "dash.help1": "Add teams and players (each player needs a team).",
  "dash.help2": "Create a season and pick participants.",
  "dash.help3": "Generate fixtures (random round-robin, BYE if odd count).",
  "dash.help4": "Enter results — table and stats update automatically.",

  "players.th.player": "Player",
  "players.th.team": "Team",
  "players.th.added": "Added",
  "players.th.actions": "Actions",
  "players.profile": "Profile",
  "players.edit": "Edit",
  "players.delete": "Delete",
  "players.empty": "No players.",
  "players.profileEmpty": "Add a player to see profile and stats.",
  "players.profileTitle": "Player profile",
  "players.teamPrefix": "Team:",
  "players.stat.played": "Matches played:",
  "players.stat.gf": "Goals for:",
  "players.stat.ga": "Goals against:",
  "players.stat.gd": "Goal difference:",
  "players.stat.avgGf": "Avg goals for / match:",
  "players.stat.wins": "Wins:",
  "players.stat.draws": "Draws:",
  "players.stat.losses": "Losses:",
  "players.stat.rival": "Most played against:",
  "players.careerLeague": "League & cups",
  "players.careerOneVsOne": "1v1",
  "search.players.placeholder": "Search by name or nickname…",

  "oneVsOne.intro":
    "Pick two players and enter the score. These matches do not affect the season table; stats appear on each player profile.",
  "oneVsOne.formTitle": "New 1v1 match",
  "oneVsOne.pickPlayer": "— pick a player —",
  "oneVsOne.home": "Home (controller 1)",
  "oneVsOne.away": "Away (controller 2)",
  "oneVsOne.scoreHome": "Home goals",
  "oneVsOne.scoreAway": "Away goals",
  "oneVsOne.submit": "Save result",
  "oneVsOne.historyTitle": "Recent 1v1 matches",
  "oneVsOne.historyEmpty": "No 1v1 matches saved yet.",
  "oneVsOne.thDate": "Date",
  "oneVsOne.thHome": "Home",
  "oneVsOne.thAway": "Away",
  "oneVsOne.thScore": "Score",

  "teams.website": "Site",
  "teams.edit": "Edit",
  "teams.delete": "Delete",
  "teams.empty": "No teams.",

  "seasons.generate": "Generate",
  "seasons.double": "Double round",
  "seasons.reset": "Reset",
  "seasons.finish": "Finish",
  "seasons.clone": "New",
  "seasons.empty": "No seasons.",

  "fixtures.roundLabel": "Round",
  "fixtures.allRounds": "All rounds",
  "fixtures.roundN": "Round {n}",
  "fixtures.unplayedOnly": "Unplayed only (sched. + skip.)",
  "fixtures.th.round": "Rd",
  "fixtures.th.home": "Home",
  "fixtures.th.away": "Away",
  "fixtures.th.status": "Status",
  "fixtures.th.result": "Result",
  "fixtures.empty": "No fixtures to show.",
  "fixtures.scheduled": "Scheduled",

  "results.save": "Save",
  "results.revert": "Revert",
  "results.skip": "Skip",
  "results.skippedHint": "Skipped — play later",
  "results.th.round": "Rd",
  "results.th.home": "Home",
  "results.th.away": "Away",
  "results.th.input": "Input",
  "results.th.playedAt": "Played at",
  "results.empty": "No matches.",

  "table.emptyData": "No data — enter results.",
  "table.th.hash": "#",
  "table.th.player": "Player",
  "table.th.team": "Team",
  "table.th.mp": "P",
  "table.th.w": "W",
  "table.th.d": "D",
  "table.th.l": "L",
  "table.th.gf": "GF",
  "table.th.ga": "GA",
  "table.th.gd": "GD",
  "table.th.pts": "Pts",

  "rankings.hint": "Active season in header: {name} ({status})",

  "stats.tile.matches": "Matches played",
  "stats.tile.matchesSub": "In selected season",
  "stats.tile.goals": "Total goals",
  "stats.tile.goalsSub": "Both teams",
  "stats.tile.avg": "Avg goals per match",
  "stats.tile.avgSub": "League average",
  "stats.tile.attack": "Best attack",
  "stats.tile.attackGoals": "{n} goals",
  "stats.tile.noPlayed": "No matches played",
  "stats.tile.defense": "Best defense",
  "stats.tile.defenseConceded": "{n} conceded",
  "stats.tile.points": "Most points",
  "stats.tile.pointsSub": "{n} pts",
  "stats.th.player": "Player",
  "stats.th.matches": "M",
  "stats.th.w": "W",
  "stats.th.d": "D",
  "stats.th.l": "L",
  "stats.th.gf": "GF",
  "stats.th.ga": "GA",
  "stats.th.avg": "G/m",
  "stats.th.form": "Form (5)",
  "stats.empty": "No statistics.",

  "form.teamSelectPh": "— pick or type new below —",

  "export.standings": "Export CSV (table)",
  "export.rankings": "Export CSV (rankings)",
  "export.results": "Export CSV (results)",

  "footer.hint":
    "Data is stored in localStorage (and optional cloud via Supabase) under {code}. Backup via JSON export in console: {fn}",

  "cloud.modalTitle": "Cloud sync (Supabase + Netlify)",
  "cloud.modalIntro": "All devices need the same URL, anon key and League ID to share one league.",
  "cloud.url": "Supabase URL",
  "cloud.anon": "Supabase anon key",
  "cloud.leagueId": "League ID (e.g. village-2026)",
  "cloud.disable": "Disable cloud",
  "cloud.cancel": "Cancel",
  "cloud.saveConnect": "Save & connect",

  "playerModal.title": "Edit player",
  "playerModal.cancel": "Cancel",
  "playerModal.save": "Save",

  "teamModal.title": "Edit team",

  "prompt.newSeasonName": "New season name:",
  "prompt.newSeasonDefault": "New season",

  "confirm.deletePlayer": "Delete this player?",
  "confirm.deleteTeam": "Delete this team?",
  "confirm.resetSeason": "Reset this season's schedule (no played matches). Continue?",
  "confirm.revertMatch": "Revert result and set match back to scheduled?",
  "confirm.disableCloud": "Disable cloud sync and stay on localStorage only?",

  "toast.cloudPulled": "Loaded changes from cloud.",
  "toast.teamSaved": "Team saved.",
  "toast.playerNeedsTeam": "Pick at least two players.",
  "toast.seasonDraft": "Season created (draft).",
  "toast.playerUpdated": "Player updated.",
  "toast.teamUpdated": "Team updated.",
  "toast.playerDeleted": "Player deleted.",
  "toast.teamDeleted": "Team deleted.",
  "toast.fixturesGenerated": "Schedule generated ({count} matches).",
  "toast.doubleOn": "Double round: ON.",
  "toast.doubleOff": "Double round: OFF.",
  "toast.seasonDraftReset": "Season reset to draft.",
  "toast.seasonFinished": "Season marked finished.",
  "toast.seasonCloned": "New draft season created with same players.",
  "toast.apiTeamMissing": "API team not found.",
  "toast.teamExists": "Team already in your list.",
  "toast.teamAdded": "Team “{name}” added.",
  "toast.resultSaved": "Result saved.",
  "toast.matchSkipped": "Match skipped. You can play it later.",
  "toast.matchReverted": "Match set back to scheduled.",
  "toast.pickSeason": "Select a season.",
  "toast.cloudDisabled": "Cloud sync disabled.",
  "toast.cloudActivated": "Cloud sync enabled.",
  "toast.cloudNotSet": "Cloud not configured. Open Cloud settings.",
  "toast.cloudSynced": "Latest changes pulled from cloud.",
  "toast.cloudCurrent": "Cloud already up to date.",
  "toast.settingsSaved": "Settings saved.",
  "toast.playerSaved": "Player saved.",
  "toast.oneVsOneSaved": "1v1 match saved.",
  "toast.avatarError": "Avatar error: {detail}",
  "toast.cloudError": "Cloud error: {detail}",
  "toast.syncError": "Sync error: {detail}",

  "discovery.enterQuery": "Enter a search name.",
  "discovery.loadingSearch": "Loading teams…",
  "discovery.foundCount": "Teams found: {n}",
  "discovery.searchFailed": "Search error{hint}: {msg}",
  "discovery.leagueFailed": "League load error{hint}: {msg}",
  "discovery.fileHint": " (try Netlify or a local server)",
  "discovery.unknownErr": "unknown error",
  "discovery.pickLeague": "Pick a league.",
  "discovery.loadingLeague": "Loading league…",
  "discovery.leagueCount": "{name} · teams: {n}",

  "error.cloudNotConfigured": "Cloud sync is not configured.",
  "error.playerNameRequired": "First name is required.",
  "error.pickValidTeam": "Pick a valid team.",
  "error.playerNotFound": "Player not found.",
  "error.playerDeletePlayed":
    "Cannot delete: player has played matches. Remove or edit results first.",
  "error.playerDeleteScheduled":
    "Player appears in fixtures. Reset season or remove matches before deleting.",
  "error.teamNameRequired": "Team name is required.",
  "error.teamDuplicate": "A similar team exists. Pick the existing one.",
  "error.teamNotFound": "Team not found.",
  "error.teamNameInUse": "Another team uses this name.",
  "error.teamHasPlayers": "Team is assigned to players. Reassign before delete.",
  "error.selectedTeamMissing": "Selected team missing.",
  "error.teamNameOrSelect": "Enter new team name or pick existing.",
  "error.seasonNameRequired": "Season name is required.",
  "error.seasonMinPlayers": "At least 2 players required.",
  "error.seasonPlayerMissing": "One of the players does not exist.",
  "error.seasonNotFound": "Season not found.",
  "error.doubleRoundDraft": "Double round only in draft before fixtures exist.",
  "error.seasonBadStatus": "Unknown season status.",
  "error.sourceSeasonMissing": "Source season missing.",
  "error.newSeasonNameRequired": "New season name required.",
  "error.newSeasonPlayers": "Not enough existing players for new season.",
  "error.fixtureSeasonNotFound": "Season not found.",
  "error.fixtureDraftOnly": "Fixtures only for draft seasons.",
  "error.fixtureExists": "Fixtures already exist. Reset season first.",
  "error.fixtureMinPlayers": "Not enough participants.",
  "error.fixtureTeamLink": "Could not link teams for match.",
  "error.scoreInt": "Score must be a whole number ≥ 0.",
  "error.matchNotFound": "Match not found.",
  "error.oneVsOnePickTwo": "Pick two different players.",
  "error.resetHasPlayed":
    "Cannot reset: there are played matches. Finish or archive the season differently.",

  "section.dashboard": "Dashboard",
  "section.players": "Players",
  "section.players.h2": "Players",
  "section.teams": "Teams",
  "section.seasons": "Seasons / cups",
  "section.fixtures": "Fixtures",
  "section.results": "Enter results",
  "section.table": "Table",
  "section.rankings": "Player rankings",
  "section.statistics": "Statistics",
  "section.oneVsOne": "1v1",

  "form.player.newTitle": "New player",
  "form.player.firstName": "First name *",
  "form.player.lastName": "Last name / nickname",
  "form.player.team": "Existing team",
  "form.player.newTeam": "New team (if not picking from list)",
  "form.player.avatar": "Avatar (optional)",
  "form.player.submit": "Save player",

  "form.team.newTitle": "New team",
  "form.team.name": "Name *",
  "form.team.logoUrl": "Logo / image URL (optional)",
  "form.team.league": "League",
  "form.team.country": "Country",
  "form.team.stadium": "Stadium",
  "form.team.founded": "Founded",
  "form.team.website": "Website",
  "form.team.submit": "Save team",
  "form.teamFinder.title": "Team Finder (API)",
  "form.teamFinder.intro": "Search teams by name or league. Add to your DB in one click.",
  "form.teamFinder.searchPh": "e.g. Manchester",
  "form.teamFinder.searchBtn": "Search",
  "form.teamFinder.showLeague": "Show league",

  "form.season.newTitle": "New season (draft)",
  "form.season.name": "Name *",
  "form.season.participants": "Participants (Ctrl+click multi) *",
  "form.season.submit": "Create season",
  "form.season.hint":
    "Then use “Generate” below for random round-robin (BYE if odd). “Double round” adds return legs before generating.",

  "table.seasons.th.name": "Name",
  "table.seasons.th.rounds": "Rds",
  "table.seasons.th.participants": "Pl.",
  "table.seasons.th.created": "Created",
  "table.seasons.th.status": "Status",
  "table.seasons.th.double": "Dbl",
  "table.seasons.th.actions": "Actions",

  "table.teams.th.team": "Team",
  "table.teams.th.league": "League / country",
  "table.teams.th.stadium": "Stadium",
  "table.teams.th.founded": "Founded",
  "table.teams.th.actions": "Actions",

  "discovery.leagueBrowse": "Browse league",
};

function t(key, vars) {
  const lang = getPesI18nLang();
  const pack = lang === "en" ? I18N_EN : I18N_SR;
  let s = pack[key];
  if (s === undefined) {
    s = I18N_SR[key];
  }
  if (s === undefined) {
    s = key;
  }
  if (vars && typeof s === "string") {
    Object.keys(vars).forEach((k) => {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(vars[k]));
    });
  }
  return s;
}

function translateSeasonStatus(status) {
  const k = `season.${String(status || "").toLowerCase()}`;
  const out = t(k);
  return out === k ? String(status || "") : out;
}

function translateMatchStatus(status) {
  const k = `match.${String(status || "").toLowerCase()}`;
  const out = t(k);
  return out === k ? String(status || "") : out;
}

function applyPesI18nToDocument() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) {
      el.textContent = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-html]").forEach((el) => {
    const key = el.getAttribute("data-i18n-html");
    if (key) {
      el.innerHTML = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key && "placeholder" in el) {
      el.placeholder = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) {
      el.title = t(key);
    }
  });
  document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
    const key = el.getAttribute("data-i18n-aria-label");
    if (key) {
      el.setAttribute("aria-label", t(key));
    }
  });
  const docTitle = t("meta.pageTitle");
  const titleTag = document.querySelector("title");
  if (titleTag) {
    titleTag.textContent = docTitle;
  }
  const footer = document.getElementById("pes-footer-hint");
  if (footer) {
    const code1 =
      '<code class="rounded bg-slate-100 px-1">pesLeagueManagerState_v1</code>';
    const code2 =
      '<code class="rounded bg-slate-100 px-1">exportPesLeagueStateAsJsonString()</code>';
    footer.innerHTML = t("footer.hint", { code: code1, fn: code2 });
  }
}

window.t = t;
window.translateSeasonStatus = translateSeasonStatus;
window.translateMatchStatus = translateMatchStatus;
window.applyPesI18nToDocument = applyPesI18nToDocument;
