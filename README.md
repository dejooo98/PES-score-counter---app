# PES Liga Manager (Netlify + Cloud Sync)

Ova aplikacija je statička (`index.html` + `js/*`) i spremna za hostovanje na Netlify.

## 1) Brzi deploy na Netlify

1. Push projekta na GitHub.
2. U Netlify: **Add new site** -> **Import from Git**.
3. Build command ostavi prazno.
4. Publish directory: `/` (root).
5. Deploy.

## 2) Supabase (deljeni podaci za sve kolege)

Da svi vide iste rezultate i da možeš sa bilo kog računara pratiti ligu:

1. Napravi Supabase projekat.
2. U SQL Editor pokreni `supabase-schema.sql`.
3. U Supabase projektu kopiraj:
   - `Project URL`
   - `anon public key`
4. U aplikaciji klikni **Cloud podešavanja** i unesi:
   - Supabase URL
   - Supabase anon key
   - League ID (npr. `seoski-liga-2026`)
5. Klikni **Sačuvaj i poveži**.

Svi članovi moraju koristiti iste cloud parametre (isti `League ID`) da bi delili istu ligu.

### 2b) Pojednostavljenje za ekipu (samo League ID)

U projektu je fajl **`js/cloud-preset.js`**. U njega **ti (admin)** jednom upišeš isti **Supabase URL** i **anon key** kao u Supabase dashboardu, pa to deployuješ na Netlify sa ostatkom sajta.

- Prijatelji na **tvom** Netlify sajtu u **Cloud podešavanjima** vide **samo League ID** (npr. `PES - RISHUB`) i *Sačuvaj i poveži* — nema polja za URL/ključ u modalu.
- Ako `cloud-preset.js` nije popunjen, modal prikazuje upozorenje i povezivanje je onemogućeno dok admin ne deployuje ispravnu verziju.

**Napomena:** anon ključ u JS fajlu je u praksi javan (tako radi Supabase SPA); zaštita je RLS pravilima u bazi. Ne commituj `service_role` ključ.

Primer strukture: `js/cloud-preset.example.js`.

## 3) Kako radi sync

- Svaka izmena se odmah snima lokalno i šalje u Supabase (cloud).
- **Automatsko povlačenje** sa cloudera radi u pregledaču dok je sajt otvoren (npr. svakih 1–2 sata — podešava se u **Podešavanja aplikacije → Cloud interval**). Netlify samo servira statičke fajlove; nema „servera“ koji u pozadini sinhronizuje umesto vas — zato je bitno da bar neko povremeno otvori aplikaciju ili koristi kraći interval ako želite češće ažuriranje.
- Pri povratku na tab (nakon drugog ekrana) aplikacija jednom proveri cloud (ograničeno da ne guši mrežu).
- Dugme **Sync sada** uvek ručno povlači najnovije stanje.

## 4) Napomena o bezbednosti

Trenutna varijanta koristi javni `anon` ključ i jednostavne RLS politike (brzo za internu ekipu).
Za ozbiljniji produkcioni nivo dodaj:

- autentikaciju korisnika,
- granularne RLS policy-je po korisniku/lizi,
- audit log.

