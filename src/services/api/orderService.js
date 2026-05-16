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
     * Submit order directly to Supabase
     */
    async submitOrder(payload) {
        console.group('🚀 Submitting order to Supabase');
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
                        console.error('⚠️ Screenshot upload failed, falling back to base64:', uploadError.message);
                    } else {
                        const { data: publicUrlData } = supabase.storage
                            .from('payment-screenshots')
                            .getPublicUrl(filePath);

                        screenshotUrl = publicUrlData.publicUrl;
                        console.log('✅ Screenshot uploaded successfully:', screenshotUrl);
                    }
                }
            }

            // 2. Create a compact payload for the raw_payload backup (prevents duplicating data)
            const compactPayload = {
                order_id: payload.order_id,
                timestamp: payload.timestamp,
                order_type: payload.order_type,
                restaurant: payload.restaurant,
                items: payload.items
            };

            // 3. Insert main order record
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: payload.customer?.full_name,
                    customer_phone: payload.customer?.phone_1,
                    customer_phone_2: payload.customer?.phone_2,
                    order_type: payload.order_type,
                    total_amount: payload.payment?.total_amount,
                    service_fee: payload.payment?.service_fee,
                    paid_now: payload.payment?.paid_now,
                    remaining_amount: payload.payment?.remaining,
                    status: 'pending',
                    delivery_address: payload.customer?.delivery_info?.address,
                    delivery_fee: payload.customer?.delivery_info?.delivery_fee,
                    latitude: payload.customer?.delivery_info?.coordinates?.lat,
                    longitude: payload.customer?.delivery_info?.coordinates?.lon,
                    payment_method: payload.customer?.payment_method,
                    payment_screenshot: screenshotUrl, // Now using URL or fallback to original
                    created_at: new Date().toISOString(),
                    raw_payload: compactPayload // Storing compact payload as backup
                }])
                .select()
                .single();

            if (orderError) {
                console.error("Order failed:", orderError);
                console.groupEnd();
                throw orderError;
            }

            const insertedOrderId = orderData.id;

            // 4. Insert order items if table exists
            if (payload.items && payload.items.length > 0) {
                const itemsToInsert = payload.items.map(item => ({
                    order_id: insertedOrderId,
                    product_id: item.id,
                    product_name: item.name,
                    quantity: item.quantity,
                    unit_price: item.price,
                    total_price: item.total
                }));

                const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(itemsToInsert);

                if (itemsError) {
                    console.warn('⚠️ Order created but items failed to insert:', itemsError.message);
                }
            }

            console.log('✅ Order submitted successfully:', insertedOrderId);
            console.groupEnd();

            return {
                success: true,
                order_id: insertedOrderId,
                data: orderData
            };
        } catch (error) {
            console.error('❌ Order submission failed:', error);
            console.groupEnd();
            throw error;
        }
    }
};

export default orderService;



