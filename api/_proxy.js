/* ═══════════════════════════════════════════════════════════
   Sogrim Pina — Shared Proxy Core (v-SEC1)
   קובץ עזר בלבד — הקידומת "_" גורמת ל-Vercel לא לפרוס אותו
   כפונקציה. כל 6 נקודות הקצה ב-api/ עושות לו import.

   עקרון: פרוקסי שקוף (Transparent Pass-Through).
   ─ ה-Body, ה-Query String וה-Content-Type מועברים כמו שהם.
   ─ redirect:'follow' — Google Apps Script מחזיר 302 אל
     googleusercontent.com, בדיוק כפי שהדפדפן עקב עד היום.
   ─ הסטטוס והתשובה של היעד חוזרים ל-Frontend ללא שינוי,
     כך שכל לוגיקת ה-resp.ok / resp.text() הקיימת ממשיכה לעבוד.
═══════════════════════════════════════════════════════════ */

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function createProxy(envName, opts = {}) {
  const allowGet = opts.allowGet !== false; // Make webhooks = POST בלבד

  return async function handler(req, res) {
    const target = process.env[envName];
    res.setHeader('Cache-Control', 'no-store');

    // הגנת תצורה — משתנה סביבה חסר ב-Vercel
    if (!target) {
      return res
        .status(500)
        .json({ ok: false, error: 'Server misconfiguration: missing env var ' + envName });
    }

    // רק המתודות שה-Frontend באמת משתמש בהן
    if (req.method !== 'POST' && !(allowGet && req.method === 'GET')) {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    try {
      // העברת ה-Query String המקורי (?action=...&_t=...) כפי שהוא
      const qIdx = req.url.indexOf('?');
      const qs = qIdx === -1 ? '' : req.url.slice(qIdx);

      const init = {
        method: req.method,
        redirect: 'follow',
        headers: { Accept: 'application/json' },
      };

      if (req.method === 'POST') {
        init.body = await readRawBody(req);
        // שימור ה-Content-Type המקורי (JSON / x-www-form-urlencoded / text-plain)
        init.headers['Content-Type'] =
          req.headers['content-type'] || 'text/plain;charset=utf-8';
      }

      const upstream = await fetch(target + qs, init);
      const text = await upstream.text();

      res.status(upstream.status);
      res.setHeader(
        'Content-Type',
        upstream.headers.get('content-type') || 'text/plain; charset=utf-8'
      );
      return res.send(text);
    } catch (e) {
      return res.status(502).json({ ok: false, error: 'Proxy error: ' + e.message });
    }
  };
}

// כיבוי ה-Body Parser האוטומטי של Vercel — העברת בייטים גולמיים 1:1
export const rawBodyConfig = { api: { bodyParser: false } };
