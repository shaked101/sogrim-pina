/* Sogrim Pina — /api/posts (v-SEC1)
   פרוקסי אל Google Apps Script של גיליון הפוסטים.
   GET  ?action=all            — טעינת כל הנתונים (loadData)
   POST {action:'update'...}   — עדכון שורה (writeSheet)
   POST {action:'deleteRow'...}/{action:'deleteMultiple'...} — מחיקות */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('GOOGLE_SCRIPT_POSTS_URL');
