import { supabase } from '../supabase/supabaseClient';

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

export const reservationService = {
    /**
     * Submit reservation directly to Supabase
     */
    async submitReservation(payload) {
        console.group('📅 Submitting reservation to Supabase');

        try {
            let screenshotUrl = payload.payment_screenshot;

            if (screenshotUrl && typeof screenshotUrl === 'string' && screenshotUrl.startsWith('data:image')) {
                console.log('📸 Uploading reservation payment screenshot to storage...');
                const blob = base64ToBlob(screenshotUrl);

                if (blob) {
                    const fileExt = blob.type.split('/')[1] || 'jpg';
                    const fileName = `${crypto.randomUUID()}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('payment-screenshots')
                        .upload(filePath, blob, {
                            contentType: blob.type,
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('⚠️ Screenshot upload failed:', uploadError.message);
                    } else {
                        const { data: publicUrlData } = supabase.storage
                            .from('payment-screenshots')
                            .getPublicUrl(filePath);

                        if (publicUrlData && publicUrlData.publicUrl) {
                            screenshotUrl = publicUrlData.publicUrl;
                            console.log('✅ Screenshot uploaded:', screenshotUrl);
                        }
                    }
                }
            }

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
                    payment_proof_url: screenshotUrl,
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


