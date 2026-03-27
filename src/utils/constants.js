export const RESTAURANT_LOCATION = {
    lat: 30.126131,
    lon: 31.298350
};

export const PRICING_RULES = {
    BASE_RATE: 20,           // 25 EGP (Fixed for first 500m)
    BASE_DISTANCE: 0.5,      // 500m
    ADDITIONAL_RATE: 1.5,      // 1 EGP
    ADDITIONAL_DISTANCE: 0.1 // 100m (0.1km)
};

export const MAX_DELIVERY_DISTANCE = 15; // 15 km

export const FIXED_AREAS = [
    { id: 'mataria', name: 'المطرية', fee: 25 },
    { id: 'zaitoun', name: 'الزيتون', fee: 35 },
    { id: 'shams', name: 'عين شمس', fee: 40 },
    { id: 'marg', name: 'المرج', fee: 45 },
    { id: 'khosos', name: 'الخصوص', fee: 50 },
    { id: 'heliopolis', name: 'مصر الجديدة', fee: 55 },
    { id: 'nasr_city', name: 'مدينة نصر', fee: 60 }
];

export const DEFAULT_DELIVERY_FEE = 35;
export const ESTIMATED_PREPARATION_TIME = 25; // base minutes
