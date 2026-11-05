// Waiting list for the Cold Drill test page (Cloudflare Pages Function).
// Needs a KV namespace bound as WAITLIST (Pages project > Settings > Bindings).
// One key per e-mail address ("s:<email>"), so signing up twice counts once.
const MAX = { fn: 60, em: 120, br: 60, tm: 30, pp: 40, src: 60 };

function clean(v, n) { return String(v == null ? "" : v).replace(/[\u0000-\u001f]/g, " ").trim().slice(0, n); }

export async function onRequestPost({ request, env }) {
  if (!env.WAITLIST) return json({ ok: false, error: "storage_missing" }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }
  if (body.website) return json({ ok: true });                       // honeypot: bots fill the hidden field
  const d = {};
  for (const k of Object.keys(MAX)) d[k] = clean(body[k], MAX[k]);
  d.em = d.em.toLowerCase();
  if (!d.fn || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.em)) return json({ ok: false, error: "invalid" }, 400);
  if (body.consent !== true) return json({ ok: false, error: "consent" }, 400);
  const key = "s:" + d.em;
  const old = await env.WAITLIST.get(key, "json");
  const rec = { ...d, at: old ? old.at : new Date().toISOString(), updated: new Date().toISOString(),
                country: request.cf && request.cf.country ? request.cf.country : null };
  // metadata carries the answers without the e-mail, so /api/stats can count without reading every record
  await env.WAITLIST.put(key, JSON.stringify(rec), { metadata: { br: d.br, tm: d.tm, pp: d.pp, c: rec.country, at: rec.at } });
  return json({ ok: true, again: !!old });
}

export function onRequest() { return json({ ok: false, error: "method" }, 405); }

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
