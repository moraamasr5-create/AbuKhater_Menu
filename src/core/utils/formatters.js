export const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

/**
 * Normalizes an Egyptian phone number to standard E.164 format (+201xxxxxxxxx)
 * @param {string} phone
 * @returns {string} E.164 formatted phone number with leading +
 */
export const normalizePhoneToE164 = (phone) => {
    if (!phone) return '';
    let cleaned = String(phone).replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) {
        cleaned = cleaned.slice(1);
    }

    if (cleaned.startsWith('0020')) {
        cleaned = '20' + cleaned.slice(4);
    } else if (cleaned.startsWith('20')) {
        // already has country code
    } else if (cleaned.startsWith('0')) {
        cleaned = '20' + cleaned.slice(1);
    } else if (cleaned.length === 10 && /^[1][0125]/.test(cleaned)) {
        cleaned = '20' + cleaned;
    }

    return '+' + cleaned;
};
