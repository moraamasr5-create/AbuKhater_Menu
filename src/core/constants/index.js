export const RESTAURANT_LOCATION = {
    lat: 30.126131,
    lon: 31.298350
};

export const PRICING_RULES = {
    BASE_RATE: 25,             // 25 ج.م ثابت لأول 1.5 كم
    BASE_DISTANCE: 0.5,        // 1.5 كم
    ADDITIONAL_RATE: 1.25,        // 3 ج.م
    ADDITIONAL_DISTANCE: 0.1  // كل 500 متر إضافية
};

export const MAX_DELIVERY_DISTANCE = 10; // 15 km

export const FIXED_AREAS = [
    { id: 'mataria', name: 'المطرية', fee: 30 },
    { id: 'zaitoun', name: 'الزيتون', fee: 50 },
    { id: 'shams', name: 'عين شمس', fee: 50 },
    { id: 'marg', name: 'المرج', fee: 70 },
    { id: 'khosos', name: 'الخصوص', fee: 60 },
    { id: 'heliopolis', name: 'مصر الجديدة', fee: 70 },
    { id: 'nasr_city', name: 'مدينة نصر', fee: 80 }
];

export const DEFAULT_DELIVERY_FEE = 35;
export const ESTIMATED_PREPARATION_TIME = 25; // base minutes


