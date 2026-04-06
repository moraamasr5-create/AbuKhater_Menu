/**
 * Map low-level fetch/network errors to short Arabic messages for UI / wrapping.
 */
export function describeFetchError(error) {
    if (error == null) return 'حدث خطأ غير معروف';
    const name = error.name || '';
    const msg = (error.message || '').toLowerCase();

    if (name === 'AbortError' || msg.includes('abort')) {
        return 'انتهت مهلة الاتصال بالخادم.';
    }
    if (msg === 'failed to fetch' || name === 'TypeError') {
        return 'تعذر الاتصال بالخادم. تحقق من الإنترنت.';
    }
    if (msg.includes('network')) {
        return 'خطأ في الشبكة. حاول مرة أخرى.';
    }
    return error.message || 'حدث خطأ غير متوقع';
}
