import { supabase } from '../supabase/supabaseClient';

export const feedbackService = {
    /**
     * Submit feedback/complaint to Supabase
     */
    async submitFeedback(payload) {
        console.group('📝 Submitting feedback to Supabase');
        
        try {
            const idempotencyKey = payload.idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : null);

            const { data, error } = await supabase.rpc('submit_feedback', {
                p_full_name: payload.fullName || payload.full_name || '',
                p_phone: payload.phone || '',
                p_type: payload.type || 'suggestion',
                p_message: payload.message || '',
                p_idempotency_key: idempotencyKey,
                p_turnstile_token: payload.turnstile_token || payload.turnstileToken || null
            });

            if (error) throw error;

            console.log('✅ Feedback submitted successfully via RPC:', data);
            console.groupEnd();
            
            return {
                success: true,
                data
            };
        } catch (error) {
            console.error('❌ Feedback submission failed:', error);
            console.groupEnd();
            throw error;
        }
    }
};

export default feedbackService;


