/* Sogrim Pina — /api/new-product (v-SEC1)
   פרוקסי אל Make Webhook של "הצייד" (_npSubmit — הוספת מוצר חדש).
   POST בלבד. הסטטוס של Make חוזר כמו שהוא (הקוד בודק resp.ok). */
import { createProxy, rawBodyConfig } from './_proxy.js';
export const config = rawBodyConfig;
export default createProxy('MAKE_NEW_PRODUCT_WEBHOOK_URL', { allowGet: false });
