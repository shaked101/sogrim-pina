/* Sogrim Pina — /api/collage (v-SEC1)
   פרוקסי אל Make Webhook של הסיכום השבועי:
   mode:'weekly_summary'/'single' — יצירת קולאז'/סטורי (התשובה הטקסטואלית
   של Make עם ה-URL חוזרת 1:1, החילוץ ב-Frontend נשאר זהה),
   mode:'send_telegram' — שיגור לטלגרם. POST בלבד. */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('MAKE_COLLAGE_WEBHOOK_URL', { allowGet: false });
