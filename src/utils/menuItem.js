/**
 * Normalize category strings for consistent filtering (UI keys are lowercase: grills, trays, …).
 */
export function normalizeCategoryKey(value) {
    if (value == null) return '';
    const s = String(value).trim();
    if (!s) return '';
    return s.toLowerCase();
}

/**
 * Prefer explicit item category from payload over the parent bucket (fixes wrong n8n grouping).
 */
export function resolveItemCategory(item, bucketCategory) {
    const fromItem = item?.category_id ?? item?.category;
    if (fromItem != null && String(fromItem).trim() !== '') {
        return normalizeCategoryKey(fromItem);
    }
    const bucket = normalizeCategoryKey(bucketCategory);
    return bucket || 'general';
}

/**
 * Raw row must have a real id and non-empty name (no synthetic ids).
 */
export function isValidRawMenuItem(item) {
    if (!item || typeof item !== 'object') return false;
    const name = String(item.name ?? '').trim();
    if (!name) return false;
    const rawId = item.id ?? item.item_id;
    if (rawId == null || String(rawId).trim() === '') return false;
    return true;
}
