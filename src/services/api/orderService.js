import { supabase } from '../supabase/supabaseClient';
import { formatCommercialItemName } from '../../core/utils/pricingEngine';

/**
 * Converts a base64 string to a Blob object
 * @param {string} base64Data - The base64 string (data:image/...)
 * @returns {Blob} The converted Blob
 */
const base64ToBlob = (base64Data) => {
    try {
        const parts = base64Data.split(';base64,');
        const contentType = parts[0].split(':')[1];
        const raw = window.atob(parts[1]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);

        for (let i = 0; i < rawLength; ++i) {
            uInt8Array[i] = raw.charCodeAt(i);
        }

        return new Blob([uInt8Array], { type: contentType });
    } catch (error) {
        console.error("❌ Error converting base64 to blob:", error);
        return null;
    }
};

export const orderService = {
    /**
     * Submit order via authoritative server-side create_order RPC
     */
    async submitOrder(payload) {
        console.group('🚀 Submitting order via create_order RPC');
        try {
            let screenshotStoragePath = null;
            const rawScreenshot = payload.payment?.screenshot;

            // 1. Handle payment screenshot upload if present
            if (rawScreenshot && typeof rawScreenshot === 'string' && rawScreenshot.startsWith('data:image')) {
                console.log('📸 Uploading payment screenshot to private storage bucket...');
                const blob = base64ToBlob(rawScreenshot);

                if (blob) {
                    const fileExt = blob.type.split('/')[1] || 'jpg';
                    const fileName = `${crypto.randomUUID()}.${fileExt}`;
                    const filePath = `payments/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('payment-screenshots')
                        .upload(filePath, blob, {
                            contentType: blob.type || 'image/jpeg',
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('⚠️ Screenshot upload failed:', uploadError.message);
                    } else {
                        // Store relative storage path in DB (private bucket accessed via signed URLs by staff)
                        screenshotStoragePath = uploadData?.path || filePath;
                        console.log('✅ Screenshot uploaded to storage path:', screenshotStoragePath);
                    }
                }
            } else if (rawScreenshot && typeof rawScreenshot === 'string') {
                screenshotStoragePath = rawScreenshot;
            }

            // 2. Prepare items with genuine menu item UUIDs and formatted commercial names
            const itemsForRpc = (payload.items || []).map(item => {
                const canonicalItemId = item.product_id || item.itemId || item.menuItemId || item.id;
                const formattedName = formatCommercialItemName(item, item.selected_variant, item.selected_options);
                const unitPrice = parseFloat(item.unit_price || item.price) || 0;
                const qty = parseInt(item.quantity || item.count || 1, 10);

                return {
                    item_id: canonicalItemId,
                    name: formattedName,
                    quantity: qty,
                    unit_price: unitPrice,
                    line_total: unitPrice * qty,
                    selected_variant: item.selected_variant || null,
                    selected_options: item.selected_options || [],
                    notes: item.notes || null
                };
            });

            const idempotencyKey = payload.idempotency_key || (
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : null
            );

            const rpcParams = {
                p_order_type: payload.order_type || 'delivery',
                p_customer_name: payload.customer?.full_name || '',
                p_customer_phone: payload.customer?.phone_1 || '',
                p_customer_phone_2: payload.customer?.phone_2 || null,
                p_delivery_address: payload.customer?.delivery_info?.address || null,
                p_payment_method: payload.customer?.payment_method || 'cash',
                p_payment_screenshot: screenshotStoragePath,
                p_location_method: payload.customer?.delivery_info?.method || 'gps',
                p_area_id: payload.customer?.delivery_info?.area_id || null,
                p_latitude: payload.customer?.delivery_info?.coordinates?.lat ?? null,
                p_longitude: payload.customer?.delivery_info?.coordinates?.lon ?? payload.customer?.delivery_info?.coordinates?.lng ?? null,
                p_items: itemsForRpc,
                p_idempotency_key: idempotencyKey,
                p_source: 'online',
                p_turnstile_token: payload.turnstile_token || payload.turnstileToken || null
            };

            console.log('📦 Invoking create_order RPC with authoritative parameters:', rpcParams);

            const { data: rpcResult, error: rpcError } = await supabase.rpc('create_order', rpcParams);

            if (rpcError) {
                console.error("❌ create_order RPC failed:", rpcError);
                console.groupEnd();
                throw rpcError;
            }

            console.log('✅ Order created authoritatively by server:', rpcResult);
            console.groupEnd();

            return {
                success: true,
                order_id: rpcResult?.order_id,
                order_number: rpcResult?.order_number,
                total_amount: rpcResult?.total_amount,
                delivery_fee: rpcResult?.delivery_fee,
                service_fee: rpcResult?.service_fee,
                paid_now: rpcResult?.paid_now,
                remaining_amount: rpcResult?.remaining_amount,
                data: rpcResult
            };
        } catch (error) {
            console.error('❌ Order submission failed:', error);
            console.groupEnd();
            throw error;
        }
    },

    /**
     * Track order status for customer via authoritative tracking RPC
     * @param {Object} params - { orderId, orderNumber, phone }
     */
    async trackOrder({ orderId = null, orderNumber = null, phone = null }) {
        try {
            const { data, error } = await supabase.rpc('get_customer_order_tracking', {
                p_order_id: orderId,
                p_order_number: orderNumber ? String(orderNumber) : null,
                p_customer_phone: phone ? String(phone) : null
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Order tracking failed:', error);
            throw error;
        }
    },

    /**
     * Get up to 3 recent orders for a customer by phone number and/or order number
     * @param {Object} params - { phone, orderNumber, limit, turnstileToken }
     */
    async fetchRecentOrders({ phone = null, orderNumber = null, limit = 3, turnstileToken = null }) {
        try {
            const { data, error } = await supabase.rpc('get_customer_recent_orders', {
                p_customer_phone: phone ? String(phone) : null,
                p_order_number: orderNumber ? String(orderNumber) : null,
                p_limit: limit,
                p_turnstile_token: turnstileToken || null
            });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('❌ Fetching recent customer orders failed:', error);
            throw error;
        }
    }
};

export default orderService;
