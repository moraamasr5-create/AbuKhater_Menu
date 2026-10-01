import { RESTAURANT_LOCATION, PRICING_RULES } from '../constants';

/**
 * Calculates Haversine distance in kilometers between two coordinates
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dLat === 0 && dLon === 0 ? 0 : R * c;
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Calculates delivery fee based on distance and authoritative settings from Supabase
 * @param {number} distanceKm - Distance in kilometers
 * @param {Object} settings - Dynamic restaurant settings from Supabase
 * @returns {number} Rounded delivery fee
 */
export const getDeliveryFee = (distanceKm, settings = {}) => {
    const baseFee = parseFloat(settings.delivery_base_fee) || PRICING_RULES.BASE_RATE;
    const baseDist = parseFloat(settings.delivery_base_distance_km) || PRICING_RULES.BASE_DISTANCE;
    const perKmRate = parseFloat(settings.delivery_per_km_rate) || PRICING_RULES.PER_KM_RATE;
    const roundingStep = parseFloat(settings.delivery_rounding_step) || PRICING_RULES.ROUNDING_STEP;

    if (distanceKm <= baseDist) {
        return baseFee;
    }

    const extraDistance = distanceKm - baseDist;
    // 100-meter chunks
    const rawFee = baseFee + Math.ceil(extraDistance * 10.0) * (perKmRate / 10.0);

    if (roundingStep > 1) {
        return Math.round(rawFee / roundingStep) * roundingStep;
    }
    return Math.ceil(rawFee);
};

/**
 * Calculates payment service fee for online/electronic payments
 * @param {number} amount - Subtotal + delivery fee
 * @param {Object} settings - Dynamic restaurant settings from Supabase
 * @returns {number} Service fee
 */
export const calculateServiceFee = (amount, settings = {}) => {
    const isEnabled = settings.payment_service_fee_enabled !== 'false' && settings.payment_service_fee_enabled !== false;
    if (!isEnabled) return 0;

    const chunkSize = parseFloat(settings.payment_service_fee_chunk) || 500;
    const feePerChunk = parseFloat(settings.payment_service_fee_per_chunk) || 10;

    if (amount <= 0) return 0;
    return Math.ceil(amount / chunkSize) * feePerChunk;
};
