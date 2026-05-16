import { supabase } from '../supabase/supabaseClient';

export const orderService = {
    /**
     * Submit order directly to Supabase
     */
    async submitOrder(payload) {
        console.group('🚀 Submitting order to Supabase');
        try {
            // 1. Insert main order record
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: payload.customer?.full_name,
                    customer_phone: payload.customer?.phone_1,
                    order_type: payload.order_type,
                    total_amount: payload.payment?.total_amount,
                    status: 'pending',
                    delivery_address: payload.customer?.delivery_info?.address,
                    payment_method: payload.customer?.payment_method,
                    created_at: new Date().toISOString(),
                    raw_payload: payload // Storing full payload as backup
                }])
                .select()
                .single();

            if (orderError) {
                console.error("Order failed:", orderError);
                console.groupEnd();
                throw orderError;
            }

            const insertedOrderId = orderData.id;

            // 2. Insert order items if table exists
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


