/* ═══════════════════════════════════════════════════════════
   Sogrim Pina — Shared Proxy Core (v-SEC2)
   קובץ עזר בלבד — הקידומת "_" גורמת ל-Vercel לא לפרוס אותו
   כפונקציה. כל 6 נקודות הקצה ב-api/ עושות לו import.

   עקרון: פרוקסי שקוף (Transparent Pass-Through) + שער אבטחה.
   ─ שער אבטחה (v-SEC2): כל בקשה חייבת לשאת כותרת X-App-Secret
     שתואמת ל-process.env.APP_SECRET_TOKEN. אחרת → 401. כך
     נקודות הקצה אינן פתוחות עוד לכל מי שמכיר את כתובת ה-Vercel.
   ─ Timeout (v-SEC2): AbortController של 30 שניות. אם Make /
     Google Script נתקעים — מוחזר 504 JSON אלגנטי במקום דף
     שגיאת HTML גנרי של הפלטפורמה.
   ─ ה-Body, ה-Query String וה-Content-Type מועברים כמו שהם.
   ─ redirect:'follow' — Google Apps Script מחזיר 302 אל
     googleusercontent.com, בדיוק כפי שהדפדפן עקב עד היום.
   ─ הסטטוס והתשובה של היעד חוזרים ל-Frontend ללא שינוי,
     כך שכל לוגיקת ה-resp.ok / resp.text() הקיימת ממשיכה לעבוד.
   ─ כותרת X-App-Secret נצרכת כאן ואינה מועברת ליעד (הסוד
     לעולם לא עוזב את Vercel).
═══════════════════════════════════════════════════════════ */

const UPSTREAM_TIMEOUT_MS = 30000;

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

// השוואה עמידה-בזמן (ללא תלות בספריות) כדי לצמצם דליפת timing
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

export function createProxy(envName, opts = {}) {
  const allowGet = opts.allowGet !== false; // Make webhooks = POST בלבד

  return async function handler(req, res) {
    const target = process.env[envName];
    res.setHeader('Cache-Control', 'no-store');

    // הגנת תצורה — משתנה סביבה של היעד חסר ב-Vercel
    if (!target) {
      return res
        .status(500)
        .json({ ok: false, error: 'Server misconfiguration: missing env var ' + envName });
    }

    // ── שער אבטחה (v-SEC2) ──────────────────────────────────
    const APP_SECRET = process.env.APP_SECRET_TOKEN;
    // fail-closed: אם הסוד לא הוגדר בשרת, שום בקשה לא עוברת.
    // ההודעה מובחנת כדי שיהיה ברור שצריך להגדיר את המשתנה ב-Vercel.
    if (!APP_SECRET) {
      return res
        .status(500)
        .json({ ok: false, error: 'Server misconfiguration: APP_SECRET_TOKEN not set' });
    }
    const incoming = req.headers['x-app-secret'];
    if (!incoming || !safeEqual(incoming, APP_SECRET)) {
      return res.status(401).json({ ok: false, error: 'Unauthorized' });
    }
    // ────────────────────────────────────────────────────────

    // רק המתודות שה-Frontend באמת משתמש בהן
    if (req.method !== 'POST' && !(allowGet && req.method === 'GET')) {
      return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    // Timeout guard — קוטע בקשות תקועות אל היעד
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    try {
      // העברת ה-Query String המקורי (?action=...&_t=...) כפי שהוא
      const qIdx = req.url.indexOf('?');
      const qs = qIdx === -1 ? '' : req.url.slice(qIdx);

      const init = {
        method: req.method,
        redirect: 'follow',
        headers: { Accept: 'application/json' },
        signal: controller.signal,
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
      // Timeout → 504 JSON אלגנטי (ולא דף HTML של Vercel)
      if (e && e.name === 'AbortError') {
        return res.status(504).json({
          ok: false,
          error: 'Upstream timeout after ' + (UPSTREAM_TIMEOUT_MS / 1000) + 's (' + envName + ')',
        });
      }
      return res.status(502).json({ ok: false, error: 'Proxy error: ' + e.message });
    } finally {
      clearTimeout(timer);
    }
  };
}

// כיבוי ה-Body Parser האוטומטי של Vercel — העברת בייטים גולמיים 1:1
export const rawBodyConfig = { api: { bodyParser: false } };
