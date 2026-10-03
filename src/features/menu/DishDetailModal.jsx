import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    X,
    ZoomIn,
    ZoomOut,
    Flame,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    ShoppingBag,
    Plus,
    Minus,
    Utensils
} from 'lucide-react';
import { formatCurrency } from '../../core/utils/formatters';

const DishDetailModal = ({ item, isOpen, onClose, currentQty, onAddToCart, onUpdateQuantity }) => {
    const [isZoomed, setIsZoomed] = useState(false);
    const [localQty, setLocalQty] = useState(currentQty > 0 ? currentQty : 1);
    const [imgLoaded, setImgLoaded] = useState(false);
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
        setLocalQty(currentQty > 0 ? currentQty : 1);
        setIsZoomed(false);
        setImgLoaded(false);
        setImgError(false);
    }, [item, currentQty]);

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

    const handleAdd = () => {
        handleHaptic();
        if (currentQty === 0) {
            onAddToCart(item);
            if (localQty > 1) {
                // adjust difference
                onUpdateQuantity(item.id, localQty - 1);
            }
        } else {
            const diff = localQty - currentQty;
            if (diff !== 0) {
                onUpdateQuantity(item.id, diff);
            }
        }
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
                        className="btn-soft-3d-dark w-10 h-10 rounded-full text-white flex items-center justify-center hover:text-red-400 transition-all"
                        aria-label="إغلاق النافذة"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Image Section */}
                <div className="relative w-full h-56 sm:h-72 bg-dark-950 overflow-hidden flex items-center justify-center select-none">
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
                            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-inner">
                                <Utensils size={36} />
                            </div>
                            <span className="text-xs font-bold text-slate-400">وصفة خاصة وطازجة من مطبخ أبو خاطر</span>
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10 pointer-events-none">
                        {item.is_popular && (
                            <span className="badge-soft-3d inline-flex items-center gap-1 bg-amber-500/90 text-dark-950 font-black text-xs px-3 py-1 rounded-full border border-amber-300/40">
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

                {/* Details Body */}
                <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
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
                                {formatCurrency(item.price)}
                            </span>
                        </div>
                    </div>

                    <div className="surface-recessed-3d rounded-2xl p-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-1.5"> الوصـف </h3>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            {item.description || ' طازجة ومحضرة بأجود المكونات والتوابل الخاصة على طريقة مطاعم أبو خاطر.'}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 sm:p-6 bg-dark-950/90 border-t border-white/10 backdrop-blur-md flex items-center gap-3">
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
                                    className="btn-soft-3d-dark w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all disabled:opacity-30"
                                    aria-label="تقليل الكمية"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="w-10 text-center font-black text-white text-base tabular-nums">
                                    {localQty}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleHaptic();
                                        setLocalQty(q => q + 1);
                                    }}
                                    className="btn-soft-3d-primary w-10 h-10 rounded-xl text-white flex items-center justify-center transition-all"
                                    aria-label="زيادة الكمية"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleAdd}
                                className="btn-soft-3d-primary flex-1 min-h-[48px] py-3.5 text-white font-black rounded-2xl flex items-center justify-center gap-2 text-sm sm:text-base"
                            >
                                <ShoppingBag size={18} />
                                <span>{currentQty > 0 ? 'تحديث الطلب' : 'إضافة للطلب'}</span>
                                <span className="mr-1 opacity-90 text-xs font-mono font-normal">
                                    ({formatCurrency(item.price * localQty)})
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
