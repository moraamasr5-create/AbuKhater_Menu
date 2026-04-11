/**
 * Client-side order id: Online#DD-MM-YYYY-HHMM (local time, 24h clock).
 * Example: Online#26-04-2026-1930
 */
export function generateOnlineOrderId(date = new Date()) {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const h = date.getHours().toString().padStart(2, '0');
    const min = date.getMinutes().toString().padStart(2, '0');
    return `Online#${d}-${m}-${y}-${h}${min}`;
}
