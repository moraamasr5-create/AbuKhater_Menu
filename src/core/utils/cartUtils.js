/**
 * Cart Item Identity & Helper Utilities
 * Single Source of Truth for deterministic cart keys and pricing calculations
 */

/**
 * Generates a deterministic key for a cart item based on:
 * - product_id (or id)
 * - selected_variant.id
 * - sorted list of selected_options IDs
 * 
 * Simple items return just their product_id to ensure 100% backward compatibility.
 * 
 * @param {Object} item - The cart item or menu item candidate
 * @returns {string} Deterministic key string
 */
export function generateCartItemKey(item) {
    if (!item) return '';

    const productId = item.product_id || item.id;
    if (!productId) return '';

    const variantId = item.selected_variant?.id 
        || (typeof item.selected_variant === 'string' ? item.selected_variant : null);

    let optionIds = [];
    if (Array.isArray(item.selected_options)) {
        optionIds = item.selected_options
            .map(opt => {
                if (!opt) return null;
                if (typeof opt === 'string') return opt;
                return opt.option_id || opt.id || null;
            })
            .filter(Boolean)
            .map(String)
            .sort(); // Deterministic alphabetical sort
    }

    const hasVariant = Boolean(variantId);
    const hasOptions = optionIds.length > 0;

    // Simple item with no configurations
    if (!hasVariant && !hasOptions) {
        return String(productId);
    }

    const varPart = variantId ? String(variantId) : 'base';
    const optPart = hasOptions ? optionIds.join(',') : 'none';

    return `${productId}::${varPart}::${optPart}`;
}

/**
 * Calculates authoritative item unit price from variant price + sum of option price deltas
 * 
 * @param {Object} item 
 * @returns {number} Unit price
 */
export function calculateItemUnitPrice(item) {
    if (!item) return 0;

    const basePrice = item.selected_variant?.price != null
        ? (parseFloat(item.selected_variant.price) || 0)
        : (parseFloat(item.price) || 0);

    let optionsDelta = 0;
    if (Array.isArray(item.selected_options)) {
        optionsDelta = item.selected_options.reduce((sum, opt) => {
            const delta = parseFloat(opt?.price_delta) || 0;
            return sum + delta;
        }, 0);
    }

    return basePrice + optionsDelta;
}
