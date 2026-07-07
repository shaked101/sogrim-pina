/* Sogrim Pina — /api/community (v-SEC1)
   פרוקסי אל Google Apps Script של הקהילה (Cloud Sync v54).
   GET  ?action=leaderboard / getRaffleAll / ... — קריאות _cloudGet
   POST payload=<json urlencoded>                — קריאות _cloudPost */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('GOOGLE_SCRIPT_COMMUNITY_URL');
