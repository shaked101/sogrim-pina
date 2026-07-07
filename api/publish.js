/* Sogrim Pina — /api/publish (v-SEC1)
   פרוקסי אל Make Webhook של שיגור הפוסטים (confirmPublish → TG/FB/IG).
   POST בלבד. */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('MAKE_PUBLISH_WEBHOOK_URL', { allowGet: false });
