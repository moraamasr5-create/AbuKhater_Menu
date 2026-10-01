/**
 * Security & Anti-Scraping Protection for Order Tracking
 * - Rate Limiting & Cooldown Timers
 * - Multi-Phone Enumeration / Hopping Detection
 * - Data Masking (Phone, Sensitive Details)
 * - Generic Neutral Error Messaging
 */

const STORAGE_KEY_FAILURES = 'tracking_failed_attempts';
const STORAGE_KEY_LOCKOUT = 'tracking_lockout_until';
const STORAGE_KEY_PHONE_HISTORY = 'tracking_searched_phones';

export const GENERIC_NOT_FOUND_MESSAGE = 'لم نتمكن من العثور على طلبات مطابقة للبيانات المدخلة.';

/**
 * Masks Egyptian phone number: 01012345678 -> 010****5678
 */
export const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const clean = String(phone).trim();
    if (clean.length < 8) return '****';
    const start = clean.slice(0, 3);
    const end = clean.slice(-4);
    return `${start}****${end}`;
};

/**
 * Gets currently active lockout remaining seconds (if any)
 */
export const getLockoutRemainingSeconds = () => {
    try {
        const lockoutUntil = parseInt(sessionStorage.getItem(STORAGE_KEY_LOCKOUT) || '0', 10);
        const now = Date.now();
        if (lockoutUntil > now) {
            return Math.ceil((lockoutUntil - now) / 1000);
        }
    } catch {
        // ignore
    }
    return 0;
};

/**
 * Sets a temporary lockout duration in seconds
 */
export const setLockoutDuration = (seconds) => {
    try {
        const until = Date.now() + (seconds * 1000);
        sessionStorage.setItem(STORAGE_KEY_LOCKOUT, String(until));
    } catch {
        // ignore
    }
};

/**
 * Clears lockout
 */
export const clearLockout = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY_LOCKOUT);
        sessionStorage.removeItem(STORAGE_KEY_FAILURES);
    } catch {
        // ignore
    }
};

/**
 * Checks for suspicious multi-phone hopping activity in a 5-minute sliding window
 * Returns { isSuspicious: boolean, distinctCount: number }
 */
export const recordAndCheckPhoneActivity = (phone) => {
    if (!phone) return { isSuspicious: false, distinctCount: 0 };
    const cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 8) return { isSuspicious: false, distinctCount: 0 };

    try {
        const now = Date.now();
        const FIVE_MINUTES = 5 * 60 * 1000;
        const rawHistory = sessionStorage.getItem(STORAGE_KEY_PHONE_HISTORY);
        let history = rawHistory ? JSON.parse(rawHistory) : [];

        // Filter out entries older than 5 minutes
        history = history.filter(item => (now - item.timestamp) < FIVE_MINUTES);

        // Add current search
        history.push({ phone: cleanPhone, timestamp: now });
        sessionStorage.setItem(STORAGE_KEY_PHONE_HISTORY, JSON.stringify(history));

        // Count distinct phones in 5-minute window
        const distinctPhones = new Set(history.map(item => item.phone));
        const isSuspicious = distinctPhones.size >= 3;

        return {
            isSuspicious,
            distinctCount: distinctPhones.size
        };
    } catch {
        return { isSuspicious: false, distinctCount: 0 };
    }
};

/**
 * Records a search failure and returns calculated cooldown seconds if threshold reached
 */
export const recordSearchFailure = () => {
    try {
        const currentFailures = parseInt(sessionStorage.getItem(STORAGE_KEY_FAILURES) || '0', 10) + 1;
        sessionStorage.setItem(STORAGE_KEY_FAILURES, String(currentFailures));

        let cooldownSec = 0;
        if (currentFailures >= 5) {
            cooldownSec = 90; // 90 seconds for 5+ failures
        } else if (currentFailures >= 3) {
            cooldownSec = 30; // 30 seconds for 3-4 failures
        }

        if (cooldownSec > 0) {
            setLockoutDuration(cooldownSec);
        }

        return {
            failuresCount: currentFailures,
            cooldownSec
        };
    } catch {
        return { failuresCount: 0, cooldownSec: 0 };
    }
};

/**
 * Records a successful search (resets consecutive failure counter)
 */
export const recordSearchSuccess = () => {
    try {
        sessionStorage.removeItem(STORAGE_KEY_FAILURES);
    } catch {
        // ignore
    }
};
