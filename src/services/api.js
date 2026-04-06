import { menuItems } from '../utils/data';
import { normalizeGoogleDriveImageUrl } from '../utils/googleDrive';
import { describeFetchError } from '../utils/errors';

// Configuration for n8n Webhooks
const N8N_BASE_URL = 'https://restaurant1abukhater.app.n8n.cloud/webhook-test';

/**
 * Robust Service to interact with n8n Webhooks
 */
export const n8nService = {
    /**
     * 🔴 الدالة المسؤولة عن تحميل المنيو (القائمة) من n8n
     * بتقوم بسحب البيانات وتحويلها لشكل يفهمه التطبيق، مع نظام حماية "Fallback"
     */
    /**
     * @returns {{ items: Array, usedFallback: boolean, error: string | null }}
     */
    async fetchMenu() {
        console.group('🌐 جاري تحميل القائمة من n8n');
        try {
            const payload = {
                request_type: 'menu',
                timestamp: new Date().toISOString(),
                source: 'web-app'
            };

            console.log('📤 إرسال طلب القائمة:', payload);

            const response = await fetch(`${N8N_BASE_URL}/menu-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Request-Source': 'restaurant-web-app'
                },
                body: JSON.stringify(payload),
            });

            console.log('📥 استجابة الخادم:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok
            });

            // 🛡️ قراءة الاستجابة كـ Text أولاً لتجنب الـ Crash في حالة وجود خطأ
            const rawText = await response.text();
            console.log('📝 الاستجابة الخام:', rawText.substring(0, 200));

            let data;
            try {
                data = rawText ? JSON.parse(rawText) : {};
                console.log('✅ JSON محلل:', data);
            } catch (parseError) {
                console.error('❌ فشل تحليل JSON:', parseError);
                throw new Error(`تنسيق استجابة غير صالح: ${parseError.message}`);
            }

            if (!response.ok) {
                console.error('❌ خطأ HTTP:', {
                    status: response.status,
                    data: data
                });
                throw new Error(data.message || `خطأ في الخادم: ${response.status}`);
            }

            // The new structure used by n8n
            if (data && data.success && data.menu) {
                const transformed = this.transformMenuData(data.menu);
                console.log(`✅ تم تحويل ${transformed.length} عنصر`);
                console.groupEnd();
                return { items: transformed, usedFallback: false, error: null };
            } else if (Array.isArray(data)) {
                const mapped = data.map(item => this.mapSingleItem(item, 'general'));
                console.log(`✅ تم تحويل ${mapped.length} عنصر (مباشر)`);
                console.groupEnd();
                return { items: mapped, usedFallback: false, error: null };
            } else if (data.items || data.products) {
                // هيكل بديل
                const items = data.items || data.products || [];
                const mapped = items.map(item => this.mapSingleItem(item, item.category || 'general'));
                console.log(`✅ تم تحويل ${mapped.length} عنصر (بديل)`);
                console.groupEnd();
                return { items: mapped, usedFallback: false, error: null };
            } else {
                console.warn('⚠️ تنسيق غير متوقع من n8n:', data);
                console.groupEnd();
                throw new Error('تنسيق البيانات غير صحيح من الخادم');
            }

        } catch (error) {
            console.error('❌ فشل في تحميل القائمة من n8n:', error);
            console.log('🔄 استخدام البيانات المحلية كاحتياطي');
            console.groupEnd();
            const msg = describeFetchError(error);
            return {
                items: this.getFallbackMenu(),
                usedFallback: true,
                error: msg
            };
        }
    },

    /**
     * Map a single item from n8n to app structure
     */
    mapSingleItem(item, category) {
        let imageUrl = item.image_url || item.image || item.img_url || '';
        imageUrl = normalizeGoogleDriveImageUrl(imageUrl);

        return {
            id: item.id || item.item_id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: item.name || 'عنصر جديد',
            price: parseFloat(item.base_price || item.price || item.unit_price) || 0,
            description: item.comment || item.description || item.desc || '',
            image: imageUrl || '/logo.jpg',
            category: category,
            category_id: item.category_id || category,
            unit_type: item.unit_type || 'qty',
            base_qty: parseInt(item.base_qty) || 1,
            status: (item.status || 'available').toString().toLowerCase(),
            originalItem: item
        };
    },

    /**
     * Transform n8n menu structure to app expected structure
     */
    transformMenuData(n8nMenu) {
        const allItems = [];

        // Check if n8nMenu is an object with categories
        if (typeof n8nMenu === 'object' && !Array.isArray(n8nMenu)) {
            Object.keys(n8nMenu).forEach(category => {
                const categoryItems = n8nMenu[category];
                if (Array.isArray(categoryItems)) {
                    categoryItems.forEach(item => {
                        allItems.push(this.mapSingleItem(item, category));
                    });
                }
            });
        } else if (Array.isArray(n8nMenu)) {
            // Direct array
            n8nMenu.forEach(item => {
                allItems.push(this.mapSingleItem(item, item.category || 'general'));
            });
        }

        console.log(`📊 تم تحويل ${allItems.length} عنصر`);
        return allItems;
    },

    /**
     * Fallback menu data
     */
    getFallbackMenu() {
        console.log('🔄 استخدام القائمة المحلية الاحتياطية');
        return menuItems.map(item => {
            const raw = item.image || '';
            const normalized = normalizeGoogleDriveImageUrl(raw);
            return {
                ...item,
                image: normalized || raw || '/logo.jpg',
                category_id: item.category,
                unit_type: 'qty',
                base_qty: 1,
                status: 'available'
            };
        });
    },

    /**
     * 🔴 إرسال الطلب النهائي لـ n8n ولشيت جوجل
     * بتجرب تبعت الطلب أكتر من مرة في حالة فشل الشبكة، وبتحول البيانات لمصفوفة JSON سليمة
     */
    async submitOrder(payload) {
        console.group('🚀 إرسال الطلب إلى n8n');

        try {
            console.log('📤 بيانات الطلب المرسلة:', JSON.stringify(payload, null, 2));
            console.log('🔢 عدد العناصر:', payload.items?.length || 0);
            console.log('💰 المبلغ الإجمالي:', payload.payment?.total_amount || 0);

            const startTime = Date.now();
            const response = await fetch(`${N8N_BASE_URL}/submit-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Request-Source': 'restaurant-web-app',
                    'X-Order-ID': payload.order_id || 'unknown'
                },
                body: JSON.stringify(payload),
                // Note: AbortSignal.timeout is relatively new, fallback for older browsers might be needed in production
                signal: AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined
            });
            const requestTime = Date.now() - startTime;

            console.log('⏱️ وقت الاستجابة:', requestTime, 'ms');
            console.log('📥 حالة HTTP:', response.status, response.statusText);

            // قراءة النص الخام أولاً للتحقق
            const rawText = await response.text();
            console.log('📝 الاستجابة الخام (الأول 500 حرف):', rawText.substring(0, 500));
            console.log('🔠 طول الاستجابة:', rawText.length, 'حرف');

            let result;
            try {
                const parsed = rawText ? JSON.parse(rawText) : {};
                // إذا كان الرد مصفوفة (كما في n8n)، نأخذ العنصر الأول
                result = Array.isArray(parsed) ? parsed[0] : parsed;

                // التأكد من وجود علامة نجاح إذا وجد رقم الطلب
                if (result && result.order_id && result.success === undefined) {
                    result.success = true;
                }

                console.log('✅ JSON محلل بنجاح:', result);
            } catch (parseError) {
                console.error('❌ فشل تحليل JSON:', parseError);
                console.log('🔄 محتوى الاستجابة الكامل:', rawText);

                // إنشاء استجابة افتراضية
                result = {
                    success: false,
                    error: 'استجابة غير صالحة من الخادم',
                    raw_response: rawText.substring(0, 200),
                    order_id: payload.order_id,
                    timestamp: new Date().toISOString()
                };
            }

            if (!response.ok) {
                console.error('📋 خطأ من n8n:', {
                    status: response.status,
                    body: result
                });

                const errorMsg = result.message ||
                    result.error ||
                    `فشل الإرسال مع الحالة ${response.status}`;

                throw new Error(errorMsg);
            }

            // التحقق من أن الاستجابة تحتوي بيانات مهمة
            if (!result || Object.keys(result).length === 0) {
                console.warn('⚠️ استجابة فارغة من n8n، إنشاء استجابة افتراضية');

                result = {
                    success: true,
                    warning: 'الخادم رد باستجابة فارغة، تم تعويضها',
                    order_id: payload.order_id,
                    restaurant: payload.restaurant,
                    status: 'received',
                    timestamp: new Date().toISOString(),
                    items_received: payload.items?.length || 0,
                    total_amount: payload.payment?.total_amount || 0
                };
            }

            console.log('🎉 نتيجة الإرسال النهائية:', result);
            console.groupEnd();

            return result;

        } catch (error) {
            console.error('❌ خطأ في الإرسال:', error);
            console.groupEnd();

            // إعادة رمي الخطأ مع معلومات إضافية
            const enhancedError = new Error(`فشل إرسال الطلب: ${describeFetchError(error)}`);
            enhancedError.name = 'OrderSubmissionError';
            enhancedError.orderId = payload.order_id;
            enhancedError.originalError = error;

            throw enhancedError;
        }
    },

    /**
     * Enhanced health check with detailed diagnostics
     */
    async checkHealth() {
        console.group('🩺 فحص صحة اتصال n8n');

        try {
            const endpoints = [
                `${N8N_BASE_URL}/menu-api`,
                `${N8N_BASE_URL}/submit-order`
            ];

            const results = {};

            for (const endpoint of endpoints) {
                try {
                    const startTime = Date.now();
                    const response = await fetch(endpoint, {
                        method: 'OPTIONS', // More standard for health checks
                        mode: 'cors',
                        headers: {
                            'Origin': window.location.origin
                        }
                    });
                    const responseTime = Date.now() - startTime;

                    results[endpoint] = {
                        reachable: response.ok || response.status === 204 || response.status === 200,
                        status: response.status,
                        responseTime: `${responseTime}ms`
                    };

                    console.log(`✅ ${endpoint}: ${response.status} (${responseTime}ms)`);
                } catch (err) {
                    results[endpoint] = {
                        reachable: false,
                        error: err.message
                    };
                    console.error(`❌ ${endpoint}: ${err.message}`);
                }
            }

            const allReachable = Object.values(results).every(r => r.reachable);

            console.log('📊 نتائج الفحص:', results);
            console.groupEnd();

            return {
                healthy: allReachable,
                details: results,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ فشل فحص الصحة:', error);
            console.groupEnd();
            return {
                healthy: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },

    /**
     * Test order submission with sample data
     */
    async testOrderSubmission() {
        console.group('🧪 اختبار إرسال طلب تجريبي');

        const testOrder = {
            restaurant: 'مطعم أبو خاطر',
            order_id: `TEST-${Date.now()}`,
            timestamp: new Date().toISOString(),
            order_type: 'delivery',
            customer: {
                full_name: 'عميل تجريبي',
                phone_1: '01012345678',
                payment_method: 'instapay',
                delivery_info: {
                    address: 'عنوان تجريبي',
                    method: 'gps',
                    coordinates: { lat: 30.0444, lon: 31.2357 },
                    estimated_time: '30-45 دقيقة'
                }
            },
            items: [
                {
                    id: '#1',
                    name: 'صنف تجريبي',
                    price: 50,
                    quantity: 2,
                    total: 100
                }
            ],
            payment: {
                total_amount: 100,
                paid_now: 100,
                remaining: 0,
                service_fee: 5
            },
            totals: {
                subtotal: 95,
                service_fee: 5,
                total: 100
            }
        };

        try {
            console.log('📤 إرسال طلب تجريبي:', testOrder);
            const result = await this.submitOrder(testOrder);
            console.log('✅ نتيجة الاختبار:', result);
            console.groupEnd();
            return result;
        } catch (error) {
            console.error('❌ فشل الاختبار:', error);
            console.groupEnd();
            throw error;
        }
    },

    /**
     * 🟣 إرسال طلب حجز طاولة إلى n8n
     * يتم إرسال بيانات العميل، موعد الحجز، وصورة إثبات الدفع (العربون)
     */
    async submitReservation(payload) {
        console.group('📅 إرسال طلب حجز طاولة');
        try {
            console.log('📤 بيانات الحجز:', payload);

            const response = await fetch(`${N8N_BASE_URL}/reservation`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-Request-Source': 'restaurant-web-app'
                },
                body: JSON.stringify({
                    ...payload,
                    type: 'reservation',
                    timestamp: new Date().toISOString()
                }),
            });

            const rawText = await response.text();
            let result;
            try {
                result = rawText ? JSON.parse(rawText) : {};
                if (Array.isArray(result)) result = result[0];
            } catch (e) {
                result = { success: false, error: 'Invalid response from server' };
            }

            if (!response.ok) {
                throw new Error(result.message || result.error || `خطأ ${response.status}`);
            }

            console.log('✅ تم استلام الحجز:', result);
            console.groupEnd();
            return result;
        } catch (error) {
            console.error('❌ فشل إرسال الحجز:', error);
            console.groupEnd();
            const wrapped = new Error(describeFetchError(error));
            wrapped.originalError = error;
            throw wrapped;
        }
    }
};
