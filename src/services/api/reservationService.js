import { supabase } from '../supabase/supabaseClient';

export const reservationService = {
    /**
     * Submit reservation directly to Supabase
     */
    async submitReservation(payload) {
        console.group('📅 Submitting reservation to Supabase');
        
        try {
            const { data, error } = await supabase
                .from('reservations')
                .insert([{
                    customer_name: payload.name,
                    customer_phone: payload.phone,
                    reservation_date: payload.date,
                    reservation_time: payload.time,
                    guests_count: payload.guests,
                    location_type: payload.location_type,
                    notes: payload.notes,
                    status: payload.status || 'pending',
                    payment_proof_url: payload.payment_screenshot,
                    created_at: payload.created_at || new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Reservation submitted successfully');
            console.groupEnd();
            
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('❌ Reservation submission failed:', error);
            console.groupEnd();
            throw error;
        }
    }
};

export default reservationService;


