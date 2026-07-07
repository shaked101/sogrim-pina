/* Sogrim Pina — /api/rewrite (v-SEC1)
   פרוקסי אל Make Webhook של הקופירייטר (rewritePost). POST בלבד. */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('MAKE_REWRITE_WEBHOOK_URL', { allowGet: false });
