/* ═══════════════════════════════════════════════════════════
   Sogrim Pina — Service Worker (PWA v1)
   מטרה: רישום בסיסי שמאפשר לדפדפן להציע "Add to Home Screen".
   חוק ברזל: ה-SW לא נוגע בשום בקשת POST / Webhook / API —
   כל התעבורה ל-Make, Google Sheets, Cloudinary וטלגרם
   עוברת ישירות לרשת ללא שום תיווך או קאשינג.
═══════════════════════════════════════════════════════════ */

const SW_VERSION = 'sogrim-pina-v1';

// התקנה — נכנס לפעולה מיד, בלי להמתין לסגירת טאבים ישנים
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// הפעלה — משתלט על כל הטאבים הפתוחים של האפליקציה
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/*
  Fetch handler — קיים כדי לעמוד בקריטריון ההתקנה של Chrome.
  שים לב: אנחנו מטפלים אך ורק בבקשות GET של ניווט (טעינת הדף עצמו),
  וגם אז — Network-First טהור. כל שאר הבקשות (POST ל-Webhooks,
  קריאות API, תמונות Cloudinary) לא מיורטות כלל וממשיכות כרגיל.
*/
self.addEventListener('fetch', (event) => {
  // לא נוגעים בשום דבר שאינו GET (Webhooks = POST → עוברים נקי)
  if (event.request.method !== 'GET') return;

  // מטפלים רק בניווט לדף עצמו — כל השאר עובר ישירות לרשת
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        // fallback מינימלי אם אין רשת בכלל
        new Response(
          '<!DOCTYPE html><html lang="he" dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:60px 20px"><h2>אין חיבור לאינטרנט 📡</h2><p>סוגרים פינה דורש חיבור פעיל. נסה שוב כשהרשת חוזרת.</p></body></html>',
          { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        )
      )
    );
  }
  // בקשות GET אחרות (סקריפטים, תמונות, פונטים) — לא מיורטות בכלל
});
