/* ═══════════════════════════════════════════════════════════
   Sogrim Pina — Service Worker (PWA v2)
   מטרה: רישום בסיסי שמאפשר לדפדפן להציע "Add to Home Screen".
   חוק ברזל: ה-SW לא נוגע בשום בקשת POST / Webhook / API —
   כל התעבורה ל-Make, Google Sheets, Cloudinary וטלגרם
   עוברת ישירות לרשת ללא שום תיווך או קאשינג.

   v65 — SEC-HARDEN (מובייל):
   ① לא מטמינים לעולם תגובות מ-Google Apps Script (URLs שמכילים
      /macros/ או script.google.com) — אפילו אם בעתיד תתווסף כאן
      לוגיקת caching כלשהי. זה מונע מצב שבו טוקן שנוסע ב-querystring
      של בקשת GET, או תגובת API עם נתונים רגישים, נשמרים ב-Cache
      Storage — מקום שלא מתנקה ב-logout (ר' דוח האבטחה, סעיף מובייל).
   ② ניהול גרסאות אמיתי: כל שינוי ל-SW_VERSION מפעיל ניקוי של כל
      Cache ישן בשם אחר, כדי שמכשיר מובייל לא "ייתקע" לצמיתות על
      גרסת קוד ישנה/פגיעה רק כי לא בוצע רענון ידני.
═══════════════════════════════════════════════════════════ */

const SW_VERSION = 'sogrim-pina-v3-sec65';

// התקנה — נכנס לפעולה מיד, בלי להמתין לסגירת טאבים ישנים.
// זה חשוב במיוחד למובייל: PWA מותקן כמעט אף פעם לא "נסגר בכוונה"
// על ידי המשתמש — הוא פשוט עובר לרקע, וייתכן שיישאר שם (ותהליך ה-JS
// שלו ימשיך לרוץ) הרבה יותר זמן מטאב דסקטופ. בלי skipWaiting, גרסה
// חדשה (כולל תיקוני אבטחה) עלולה לחכות בתור ולא להיכנס לתוקף בפועל
// עד שהמשתמש יסגור את כל המופעים הפתוחים — דבר שכמעט לא קורה במובייל.
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// הפעלה — משתלט מיד על כל הטאבים/החלונות הפתוחים של האפליקציה,
// ומנקה כל Cache שנשאר משם/גרסה אחרת (כולל גרסאות קודמות של ה-SW
// עצמו, למקרה שבעתיד ייווצר Cache Storage כלשהו תחת שם ישן).
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((names) =>
        Promise.all(
          names
            .filter((name) => name !== SW_VERSION)
            .map((name) => caches.delete(name))
        )
      ),
    ])
  );
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

  // ▼ SEC-HARDEN (v65): חסימה מפורשת — לעולם לא מיירטים/מטמינים בקשות
  // אל Google Apps Script (STATS_GAS_URL הישיר, וכל /macros/.../exec).
  // זו הגנה מפורשת-בכוונה (defense-in-depth): גם אם מחר יתווסף כאן
  // caching לנכסים אחרים, השורה הזו מוודאת שתגובות/URLs עם טוקן
  // מחושב לא יגיעו לעולם ל-Cache Storage.
  const reqUrl = event.request.url || '';
  if (reqUrl.indexOf('/macros/') !== -1 || reqUrl.indexOf('script.google.com') !== -1) {
    return; // עובר ישירות לרשת, בלי שום מגע של ה-SW
  }
  // ▲

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
  // בקשות GET אחרות (סקריפטים, תמונות, פונטים) — לא מיורטות בכלל,
  // וגם הן ממילא לא נשמרות בשום Cache (אין caches.put בקובץ הזה).
});
