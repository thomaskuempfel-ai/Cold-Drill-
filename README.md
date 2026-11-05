# Cold Drill · Testseite (Branch `landing`)

Deutschsprachige Landingpage mit Warteliste, um die Nachfrage zu testen. Statisch, ohne Build.

Cloudflare Pages:
- Projekt mit diesem Repo verbinden, Production branch `landing`, Build command leer, Build output directory `/`.
- Workers KV: Namespace `colddrill-waitlist` anlegen und im Pages-Projekt unter Settings > Bindings als `WAITLIST` binden.
- Web Analytics im Pages-Projekt einschalten (Besucherzahlen ohne Cookies).

Seiten: `/` (Landingpage), `/zahlen` (Summen der Warteliste), `/datenschutz`, `/impressum`.
API: `POST /api/join` (Eintrag), `GET /api/stats` (Summen, ohne Personendaten).
