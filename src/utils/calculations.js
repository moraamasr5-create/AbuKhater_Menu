import { PRICING_RULES } from './constants';

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
};

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

export const getDeliveryFee = (distanceKm) => {
    if (distanceKm <= PRICING_RULES.BASE_DISTANCE) {
        return PRICING_RULES.BASE_RATE;
    }

    const extraDistance = distanceKm - PRICING_RULES.BASE_DISTANCE;
    const extraChunks = Math.ceil(extraDistance / PRICING_RULES.ADDITIONAL_DISTANCE);

    return PRICING_RULES.BASE_RATE + (extraChunks * PRICING_RULES.ADDITIONAL_RATE);
};

export const calculateServiceFee = (amount) => {
    const CHUNK_SIZE = 250;
    const FEE_PER_CHUNK = 5;
    return Math.ceil(amount / CHUNK_SIZE) * FEE_PER_CHUNK;
};
