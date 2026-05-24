export const RESTAURANT_LOCATION = {
    lat: 30.126131,
    lon: 31.298350
};

export const PRICING_RULES = {
    BASE_RATE: 25,             // 25 ج.م ثابت لأول 1.5 كم
    BASE_DISTANCE: 0.6,        // 1.5 كم
    ADDITIONAL_RATE: 3,        // 3 ج.م
    ADDITIONAL_DISTANCE: 0.3   // كل 500 متر إضافية
};

export const MAX_DELIVERY_DISTANCE = 12; // 15 km

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


