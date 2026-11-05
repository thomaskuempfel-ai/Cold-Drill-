// Sign-up numbers for the Cold Drill test page: totals and counts per answer, no names or e-mail addresses.
export async function onRequestGet({ env }) {
  if (!env.WAITLIST) return json({ ok: false, error: "storage_missing" }, 503);
  const out = { ok: true, total: 0, byDay: {}, br: {}, tm: {}, pp: {}, country: {} };
  let cursor;
  do {
    const page = await env.WAITLIST.list({ prefix: "s:", cursor });
    for (const k of page.keys) {
      const m = k.metadata || {};
      out.total++;
      const day = String(m.at || "").slice(0, 10) || "?";
      out.byDay[day] = (out.byDay[day] || 0) + 1;
      for (const f of ["br", "tm", "pp"]) { const v = m[f] || "keine Angabe"; out[f][v] = (out[f][v] || 0) + 1; }
      const c = m.c || "?"; out.country[c] = (out.country[c] || 0) + 1;
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  return json(out);
}

function json(o, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
}
