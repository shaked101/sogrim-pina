// api/img.js — פרוקסי תמונות אופציונלי (Vercel Serverless)
// נחוץ רק אם ה-CDN של תמונת המוצר לא מחזיר Access-Control-Allow-Origin.
// index.html מנסה קודם משיכה ישירה, ורק אם היא נכשלת פונה לכאן.
// אם הקובץ הזה לא קיים — הפיצ'ר מתדרדר בחן להעתקת טקסט בלבד.

// רשימת מקורות מותרים — מונע שימוש בפרוקסי כ-open relay
const ALLOWED_HOSTS = [
  'ae01.alicdn.com',
  'ae-pic-a1.aliexpress-media.com',
  'img.alicdn.com',
  'gd1.alicdn.com',
  'res.cloudinary.com',
];

export default async function handler(req, res) {
  const raw = req.query.url;
  if (!raw) return res.status(400).json({ error: 'missing url' });

  let target;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ error: 'invalid url' });
  }

  if (target.protocol !== 'https:') {
    return res.status(400).json({ error: 'https only' });
  }
  if (!ALLOWED_HOSTS.some(h => target.hostname === h || target.hostname.endsWith('.' + h))) {
    return res.status(403).json({ error: 'host not allowed' });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'image/*' },
      redirect: 'follow',
    });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'upstream ' + upstream.status });
    }

    const type = upstream.headers.get('content-type') || '';
    if (!type.startsWith('image/')) {
      return res.status(415).json({ error: 'not an image' });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', type);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(502).json({ error: 'fetch failed: ' + e.message });
  }
}
