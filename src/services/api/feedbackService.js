import { supabase } from '../supabase/supabaseClient';

export const feedbackService = {
    /**
     * Submit feedback/complaint to Supabase
     */
    async submitFeedback(payload) {
        console.group('📝 Submitting feedback to Supabase');
        
        try {
            const { data, error } = await supabase
                .from('feedback')
                .insert([{
                    full_name: payload.fullName,
                    phone: payload.phone,
                    type: payload.type,
                    message: payload.message,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Feedback submitted successfully');
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


