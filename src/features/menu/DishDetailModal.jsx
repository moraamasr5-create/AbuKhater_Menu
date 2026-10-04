import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
    X,
    Sparkles,
    AlertCircle,
    ShoppingBag,
    Plus,
    Minus,
    Utensils,
    Check,
    FileText
} from 'lucide-react';
import { formatCurrency } from '../../core/utils/formatters';
import { getVariantSectionLabel } from '../../core/utils/pricingEngine';

const DishDetailModal = ({ item, isOpen, onClose, currentQty, onAddToCart, onUpdateQuantity }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [localQty, setLocalQty] = useState(currentQty > 0 ? currentQty : 1);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Dynamic selection state
    const [selectedVariantId, setSelectedVariantId] = useState(null);
    const [selectedOptionsMap, setSelectedOptionsMap] = useState({}); // { [groupId]: optionId or [optionId1, ...] }
    const [userNotes, setUserNotes] = useState('');

    // Reset and initialize selections on item or open change
    useEffect(() => {
        if (!item || !isOpen) return;

        setLocalQty(currentQty > 0 ? currentQty : 1);
        setIsZoomed(false);
        setImgLoaded(false);
        setImgError(false);
        setUserNotes('');

        // 1. Initialize Variant (default to first available variant if present)
        const variants = Array.isArray(item.variants) ? item.variants : [];
        if (variants.length > 0) {
            const firstAvailable = variants.find(v => v.is_available !== false) || variants[0];
            setSelectedVariantId(firstAvailable?.id || null);
        } else {
            setSelectedVariantId(null);
        }

        // 2. Initialize Option Groups (default single required to first option)
        const initialOptions = {};
        const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
        optionGroups.forEach(group => {
            const opts = Array.isArray(group.options) ? group.options : [];
            if (group.selection_type === 'single') {
                if (group.required && opts.length > 0) {
                    const firstOpt = opts.find(o => o.is_available !== false) || opts[0];
                    initialOptions[group.id] = firstOpt?.id || null;
                } else {
                    initialOptions[group.id] = null;
                }
            } else {
                // multiple
                initialOptions[group.id] = [];
            }
        });
        setSelectedOptionsMap(initialOptions);
    }, [item, isOpen, currentQty]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleHaptic = useCallback(() => {
        if (typeof window !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(15);
        }
    }, []);

    if (!isOpen || !item) return null;

    const isAvailable = item.status === 'available';
    const isOutOfStock = item.status === 'out_of_stock';
    const isPaused = item.status === 'paused';
    const statusLabel = isOutOfStock ? 'نفذت الكمية' : (isPaused ? 'غير متاح مؤقتاً' : 'غير متاح');
    const hasRealImage = Boolean(item.image && item.image !== '/logo.jpg' && !imgError);

    const variants = Array.isArray(item.variants) ? item.variants : [];
    const optionGroups = Array.isArray(item.option_groups) ? item.option_groups : [];
    const hasVariants = variants.length > 0;
    const hasOptions = optionGroups.length > 0;

    // Selected Variant Object
    const selectedVariant = hasVariants ? variants.find(v => v.id === selectedVariantId) : null;

    // Calculate authoritative price
    const baseUnitPrice = selectedVariant ? selectedVariant.price : (parseFloat(item.price) || 0);

    let optionsDeltaTotal = 0;
    const flatSelectedOptions = [];

    optionGroups.forEach(group => {
        const selection = selectedOptionsMap[group.id];
        if (!selection) return;

        const opts = Array.isArray(group.options) ? group.options : [];
        if (group.selection_type === 'multiple' && Array.isArray(selection)) {
            selection.forEach(optId => {
                const opt = opts.find(o => o.id === optId);
                if (opt) {
                    const delta = parseFloat(opt.price_delta) || 0;
                    optionsDeltaTotal += delta;
                    flatSelectedOptions.push({
                        group_id: group.id,
                        group_name: group.name,
                        option_id: opt.id,
                        option_name: opt.name,
                        price_delta: delta
                    });
                }
            });
        } else if (typeof selection === 'string') {
            const opt = opts.find(o => o.id === selection);
            if (opt) {
                const delta = parseFloat(opt.price_delta) || 0;
                optionsDeltaTotal += delta;
                flatSelectedOptions.push({
                    group_id: group.id,
                    group_name: group.name,
                    option_id: opt.id,
                    option_name: opt.name,
                    price_delta: delta
                });
            }
        }
    });

    const finalUnitPrice = baseUnitPrice + optionsDeltaTotal;
    const finalTotalPrice = finalUnitPrice * localQty;

    // Validation Check
    const validationErrors = [];

    if (hasVariants && !selectedVariant) {
        validationErrors.push('يرجى اختيار الحجم المطلوب');
    }

    optionGroups.forEach(group => {
        const selection = selectedOptionsMap[group.id];
        if (group.required) {
            if (group.selection_type === 'single' && !selection) {
                validationErrors.push(`يرجى تحديد (${group.name})`);
            } else if (group.selection_type === 'multiple') {
                const count = Array.isArray(selection) ? selection.length : 0;
                const minReq = group.min_selections || 1;
                if (count < minReq) {
                    validationErrors.push(`يرجى اختيار ${minReq} على الأقل من (${group.name})`);
                }
            }
        }
    });

    const isFormValid = validationErrors.length === 0;

    // Handlers
    const handleVariantSelect = (vId) => {
        handleHaptic();
        setSelectedVariantId(vId);
    };

    const handleSingleOptionSelect = (groupId, optId) => {
        handleHaptic();
        setSelectedOptionsMap(prev => ({
            ...prev,
            [groupId]: prev[groupId] === optId ? null : optId
        }));
    };

    const handleMultipleOptionToggle = (group, optId) => {
        handleHaptic();
        setSelectedOptionsMap(prev => {
            const current = Array.isArray(prev[group.id]) ? [...prev[group.id]] : [];
            const exists = current.includes(optId);

            if (exists) {
                return { ...prev, [group.id]: current.filter(id => id !== optId) };
            } else {
                const max = group.max_selections || 999;
                if (current.length >= max) {
                    return prev; // Reached max
                }
                return { ...prev, [group.id]: [...current, optId] };
            }
        });
    };

    const handleAdd = () => {
        if (!isFormValid || !isAvailable) return;
        handleHaptic();

        // Create structured configured item
        const configuredItem = {
            ...item,
            product_id: item.product_id || item.id,
            price: finalUnitPrice,
            unit_price: finalUnitPrice,
            selected_variant: selectedVariant ? {
                id: selectedVariant.id,
                name: selectedVariant.name,
                price: parseFloat(selectedVariant.price),
                weight_kg: selectedVariant.weight_kg || null
            } : null,
            selected_options: flatSelectedOptions,
            notes: userNotes.trim() || null,
            quantity: localQty
        };

        onAddToCart(configuredItem, localQty);
        onClose();
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dish-modal-title"
            dir="rtl"
            className="fixed inset-0 z-[150] bg-dark-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="relative w-full max-w-lg surface-float-3d rounded-t-[2rem] sm:rounded-[2rem] overflow-hidden flex flex-col max-h-[90dvh] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-300">
                {/* Header Actions */}
                <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-soft-3d-dark w-10 h-10 rounded-full text-white flex items-center justify-center hover:text-red-400 transition-all shadow-md"
                        aria-label="إغلاق النافذة"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Image Section */}
                <div className="relative w-full h-52 sm:h-64 bg-dark-950 overflow-hidden flex items-center justify-center select-none shrink-0">
                    {hasRealImage ? (
                        <>
                            {!imgLoaded && (
                                <div className="absolute inset-0 shimmer bg-dark-800" />
                            )}
                            <img
                                src={item.image}
                                alt={item.name}
                                onLoad={() => setImgLoaded(true)}
                                onError={() => setImgError(true)}
                                className={`w-full h-full object-cover transition-transform duration-500 cursor-zoom-in ${isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100 hover:scale-105'
                                    } ${!isAvailable ? 'grayscale opacity-60' : ''}`}
                                onClick={() => setIsZoomed(!isZoomed)}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent pointer-events-none" />
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-950 via-dark-900 to-dark-850 p-6 text-center border-b border-white/5">
                            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-2 shadow-inner">
                                <Utensils size={30} />
                            </div>
                            <span className="text-xs font-bold text-slate-400">وصفة خاصة وطازجة من مطبخ أبو خاطر</span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {item.is_popular && (
                            <span className="badge-soft-3d inline-flex items-center gap-1 bg-amber-500/90 text-dark-950 font-black text-xs px-3 py-1 rounded-full border border-amber-300/40 shadow-sm">
                                <Sparkles size={13} /> صنف مميز
                            </span>
                        )}
                        {!isAvailable && (
                            <span className={`badge-soft-3d inline-flex items-center gap-1 text-white font-black text-xs px-3 py-1 rounded-full ${isOutOfStock ? 'bg-red-600/90' : 'bg-amber-600/90'
                                }`}>
                                <AlertCircle size={13} /> {statusLabel}
                            </span>
                        )}
                    </div>
                </div>

                {/* Scrollable Details Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-5 custom-scrollbar">
                    {/* Title and Dynamic Unit Price */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h2 id="dish-modal-title" className="text-xl sm:text-2xl font-black text-white leading-snug">
                                {item.name}
                            </h2>
                            {item.category && (
                                <span className="inline-block mt-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md border border-primary/20">
                                    {item.category}
                                </span>
                            )}
                        </div>
                        <div className="text-left shrink-0">
                            <span className="text-2xl font-black text-primary tabular-nums">
                                {formatCurrency(finalUnitPrice)}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                        <div className="surface-recessed-3d rounded-2xl p-3.5">
                            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    )}

                    {/* 1. Dynamic Variants Selection */}
                    {hasVariants && (
                        <div className="space-y-2.5 pt-1">
                            <div className="flex items-center justify-between">
                                <label className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                    <span>{getVariantSectionLabel(item.commercial_type)}</span>
                                    <span className="text-red-400 text-xs">*</span>
                                </label>
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">مطلوب</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {variants.map((variant) => {
                                    const isSelected = selectedVariantId === variant.id;
                                    return (
                                        <button
                                            key={variant.id}
                                            type="button"
                                            onClick={() => handleVariantSelect(variant.id)}
                                            className={`p-3 rounded-xl border text-right flex items-center justify-between transition-all active:scale-[0.98] ${isSelected
                                                ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/10 ring-1 ring-primary'
                                                : 'bg-dark-900/60 border-white/[0.08] text-slate-300 hover:bg-dark-800'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-slate-500'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold truncate">{variant.name}</span>
                                            </div>
                                            <span className="text-xs font-black text-primary mr-2 tabular-nums">
                                                {formatCurrency(variant.price)}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* 2. Dynamic Option Groups (الخيارات والإضافات) */}
                    {hasOptions && (
                        <div className="space-y-4 pt-1">
                            {optionGroups.map((group) => {
                                const isSingle = group.selection_type === 'single';
                                const currentSelection = selectedOptionsMap[group.id];
                                const selectedCount = isSingle
                                    ? (currentSelection ? 1 : 0)
                                    : (Array.isArray(currentSelection) ? currentSelection.length : 0);

                                return (
                                    <div key={group.id} className="space-y-2 surface-recessed-3d rounded-2xl p-3.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs sm:text-sm font-black text-white flex items-center gap-1.5">
                                                <span>{group.name}</span>
                                                {group.required && <span className="text-red-400 text-xs">*</span>}
                                            </label>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${group.required
                                                ? (selectedCount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400')
                                                : 'bg-slate-800 text-slate-400'
                                                }`}>
                                                {group.required ? (selectedCount > 0 ? 'تم الاختيار ✓' : 'إجباري') : 'اختياري'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {(group.options || []).map((opt) => {
                                                const isSelected = isSingle
                                                    ? currentSelection === opt.id
                                                    : (Array.isArray(currentSelection) && currentSelection.includes(opt.id));

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => isSingle
                                                            ? handleSingleOptionSelect(group.id, opt.id)
                                                            : handleMultipleOptionToggle(group, opt.id)
                                                        }
                                                        className={`p-2.5 rounded-xl border text-right flex items-center justify-between transition-all active:scale-[0.98] ${isSelected
                                                            ? 'bg-primary/15 border-primary text-white shadow-sm ring-1 ring-primary'
                                                            : 'bg-dark-950/60 border-white/[0.08] text-slate-300 hover:bg-dark-900'
                                                            }`}
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <div className={`w-4 h-4 rounded-${isSingle ? 'full' : 'md'} border flex items-center justify-center shrink-0 ${isSelected ? 'border-primary bg-primary' : 'border-slate-500'}`}>
                                                                {isSelected && (isSingle ? <div className="w-1.5 h-1.5 rounded-full bg-white" /> : <Check size={11} className="text-white" />)}
                                                            </div>
                                                            <span className="text-xs font-bold truncate">{opt.name}</span>
                                                        </div>
                                                        {parseFloat(opt.price_delta) > 0 && (
                                                            <span className="text-[11px] font-black text-amber-400 mr-2 tabular-nums">
                                                                +{formatCurrency(opt.price_delta)}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* 3. Customer Notes */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <FileText size={13} className="text-primary" />
                            <span>ملاحظات خاصة على الصنف (اختياري)</span>
                        </label>
                        <input
                            type="text"
                            value={userNotes}
                            onChange={(e) => setUserNotes(e.target.value)}
                            placeholder="مثال: بدون شطة، زيادة طحينة..."
                            className="w-full bg-dark-950/60 border border-white/[0.08] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-primary focus:outline-none transition-all"
                            maxLength={100}
                        />
                    </div>

                    {/* Validation Errors Notice (if any) */}
                    {validationErrors.length > 0 && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={15} className="shrink-0" />
                            <span>{validationErrors[0]}</span>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-5 bg-dark-950/95 border-t border-white/10 backdrop-blur-md flex items-center gap-3 shrink-0">
                    {isAvailable ? (
                        <>
                            {/* Quantity Controls */}
                            <div className="stepper-container-3d p-1 rounded-2xl flex items-center shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleHaptic();
                                        setLocalQty(q => Math.max(1, q - 1));
                                    }}
                                    disabled={localQty <= 1}
                                    className="btn-soft-3d-dark w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-30"
                                    aria-label="تقليل الكمية"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-9 sm:w-10 text-center font-black text-white text-base tabular-nums">
                                    {localQty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleHaptic();
                                        setLocalQty(q => q + 1);
                                    }}
                                    className="btn-soft-3d-primary w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center transition-all"
                                    aria-label="زيادة الكمية"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={!isFormValid}
                                className={`btn-soft-3d-primary flex-1 min-h-[48px] py-3 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base transition-all ${!isFormValid ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                <ShoppingBag size={18} />
                                <span>{currentQty > 0 ? 'تحديث الطلب' : 'إضافة للطلب'}</span>
                                <span className="mr-1 opacity-90 text-xs font-mono font-normal">
                                    ({formatCurrency(finalTotalPrice)})
                                </span>
                            </button>
                        </>
                    ) : (
                        <div className="w-full text-center py-3 bg-dark-800/40 rounded-2xl border border-white/5 text-slate-400 font-bold text-sm">
                            هذا الصنف {statusLabel} حالياً
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

DishDetailModal.propTypes = {
    item: PropTypes.object,
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    currentQty: PropTypes.number,
    onAddToCart: PropTypes.func.isRequired,
    onUpdateQuantity: PropTypes.func.isRequired
};

DishDetailModal.defaultProps = {
    currentQty: 0
};

export default DishDetailModal;

