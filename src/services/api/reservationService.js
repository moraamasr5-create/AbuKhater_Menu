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
     * Submit reservation directly to Supabase via submit_reservation RPC
     */
    async submitReservation(payload) {
        console.group('📅 Submitting reservation to Supabase');

        try {
            let screenshotStoragePath = null;
            let fileToUpload = payload.payment_screenshot;

            if (fileToUpload) {
                if (typeof fileToUpload === 'string') {
                    if (fileToUpload.startsWith('data:image')) {
                        fileToUpload = base64ToBlob(fileToUpload);
                    } else {
                        screenshotStoragePath = fileToUpload;
                        fileToUpload = null;
                    }
                }

                if (fileToUpload && (fileToUpload instanceof File || fileToUpload instanceof Blob)) {
                    console.log('📸 Uploading reservation payment screenshot to private storage...');
                    const fileExt = fileToUpload.type ? (fileToUpload.type.split('/')[1] || 'jpg') : 'jpg';
                    const fileName = `${crypto.randomUUID()}.${fileExt}`;
                    const filePath = `reservations/${fileName}`;

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('payment-screenshots')
                        .upload(filePath, fileToUpload, {
                            contentType: fileToUpload.type || 'image/jpeg',
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (uploadError) {
                        console.error('⚠️ Screenshot upload failed:', uploadError.message);
                        throw new Error(`فشل رفع صورة الإيصال: ${uploadError.message}`);
                    } else {
                        screenshotStoragePath = uploadData?.path || filePath;
                        console.log('✅ Screenshot uploaded to path:', screenshotStoragePath);
                    }
                }
            }

            const idempotencyKey = payload.idempotencyKey || (
                typeof crypto !== 'undefined' && crypto.randomUUID
                    ? crypto.randomUUID()
                    : null
            );

            const { data, error } = await supabase.rpc('submit_reservation', {
                p_customer_name: payload.name || payload.customer_name || '',
                p_customer_phone: payload.phone || payload.customer_phone || '',
                p_reservation_date: payload.date || payload.reservation_date,
                p_reservation_time: payload.time || payload.reservation_time,
                p_guests_count: parseInt(payload.guests || payload.guests_count || 2, 10),
                p_location_type: payload.location_type || payload.locationType || 'restaurant',
                p_notes: payload.notes || null,
                p_payment_proof_url: screenshotStoragePath,
                p_idempotency_key: idempotencyKey,
                p_turnstile_token: payload.turnstile_token || payload.turnstileToken || null
            });

            if (error) throw error;

            console.log('✅ Reservation submitted successfully via RPC:', data);
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
