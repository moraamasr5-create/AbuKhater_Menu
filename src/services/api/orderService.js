import { supabase } from '../supabase/supabaseClient';

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
            let screenshotUrl = payload.payment?.screenshot;

            // 1. Handle payment screenshot upload if it's a base64 string
            if (screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image')) {
                console.log('📸 Uploading payment screenshot to storage...');
                const blob = base64ToBlob(screenshotUrl);

                if (blob) {
                    const fileExt = blob.type.split('/')[1] || 'jpg';
                    const fileName = `${crypto.randomUUID()}.${fileExt}`;
                    const filePath = `payments/${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('payment-screenshots')
                        .upload(filePath, blob, {
                            contentType: blob.type,
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('⚠️ Screenshot upload failed, falling back to original:', uploadError.message);
                    } else {
                        const { data: publicUrlData } = supabase.storage
                            .from('payment-screenshots')
                            .getPublicUrl(filePath);

                        screenshotUrl = publicUrlData.publicUrl;
                        console.log('✅ Screenshot uploaded successfully:', screenshotUrl);
                    }
                }
            }

            // 2. Prepare items with genuine menu item IDs
            const itemsForRpc = (payload.items || []).map(item => ({
                item_id: item.itemId || item.menuItemId || item.id,
                name: item.name,
                quantity: parseInt(item.quantity || item.count || 1, 10),
                notes: item.notes || null
            }));

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
                p_payment_screenshot: screenshotUrl || null,
                p_location_method: payload.customer?.delivery_info?.method || 'gps',
                p_area_id: payload.customer?.delivery_info?.area_id || null,
                p_latitude: payload.customer?.delivery_info?.coordinates?.lat ?? null,
                p_longitude: payload.customer?.delivery_info?.coordinates?.lon ?? payload.customer?.delivery_info?.coordinates?.lng ?? null,
                p_items: itemsForRpc,
                p_idempotency_key: idempotencyKey,
                p_source: 'online'
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
    }
};

export default orderService;
