/**
 * Normalize Google Drive (and related) image URLs for reliable <img src> loading.
 * Keeps non-Drive URLs unchanged.
 */
export function normalizeGoogleDriveImageUrl(raw) {
    if (!raw || typeof raw !== 'string') return '';
    const trimmed = raw.trim();
    if (!trimmed) return '';

    if (trimmed.includes('drive.google.com/thumbnail')) {
        return trimmed.includes('sz=') ? trimmed : `${trimmed}${trimmed.includes('?') ? '&' : '?'}sz=w400`;
    }

    if (!trimmed.includes('drive.google.com') && !trimmed.includes('googleusercontent.com')) {
        return trimmed;
    }

    let m = trimmed.match(/googleusercontent\.com\/d\/([^/?#]+)/i);
    if (m?.[1]) {
        return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
    }

    if (!trimmed.includes('drive.google.com')) {
        return trimmed;
    }

    m = trimmed.match(/\/file\/d\/([^/]+)/i);
    if (m?.[1]) {
        return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
    }

    m = trimmed.match(/\/d\/([^/?#]+)/);
    if (m?.[1]) {
        return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
    }

    m = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (m?.[1]) {
        return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w400`;
    }

    return trimmed;
}
