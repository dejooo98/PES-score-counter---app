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

## 3) Kako radi sync

- Svaka izmena se odmah snima lokalno i šalje u cloud.
- Aplikacija proverava cloud periodično (na 15s).
- Dugme **Sync sada** ručno povlači najnovije stanje.

## 4) Napomena o bezbednosti

Trenutna varijanta koristi javni `anon` ključ i jednostavne RLS politike (brzo za internu ekipu).
Za ozbiljniji produkcioni nivo dodaj:

- autentikaciju korisnika,
- granularne RLS policy-je po korisniku/lizi,
- audit log.

