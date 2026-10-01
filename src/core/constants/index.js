/**
 * Default fallback constants (authoritative values are fetched dynamically from Supabase restaurant_settings)
 */
export const RESTAURANT_LOCATION = {
    lat: 30.126131,
    lon: 31.298350
};

export const PRICING_RULES = {
    BASE_RATE: 25,             // 25 ج.م لأول 0.5 كم
    BASE_DISTANCE: 0.5,        // 0.5 كم
    PER_KM_RATE: 12.5,         // 12.5 ج.م لكل كم إضافي (1.25 ج.م لكل 100م)
    ROUNDING_STEP: 5           // تقريب لأقرب 5 ج.م
};

export const MAX_DELIVERY_DISTANCE = 12; // 12 km

export const DEFAULT_DELIVERY_FEE = 25;
export const ESTIMATED_PREPARATION_TIME = 25; // base minutes
