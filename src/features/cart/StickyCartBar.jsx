import React, { memo } from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../core/utils/formatters';

const StickyCartBar = memo(function StickyCartBar() {
    const { cart } = useCart();
    const navigate = useNavigate();

    if (cart.length === 0) return null;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div
            className="fixed z-[70] max-w-lg mx-auto left-3 right-3 sm:left-4 sm:right-4 pointer-events-none"
            style={{ bottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}
        >
            <button
                type="button"
                onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(15);
                    navigate('/review');
                }}
                className="pointer-events-auto group w-full surface-float-3d text-white p-2.5 pr-3.5 sm:pr-4.5 rounded-2xl sm:rounded-3xl flex items-center justify-between gap-3 transition-all active:scale-[0.98] shadow-2xl min-h-[3.6rem]"
                aria-label={`متابعة الطلب: ${totalItems} عناصر في السلة، الإجمالي ${formatCurrency(subtotal)}. اضغط لمراجعة السلة`}
            >
                {/* Right Side (RTL): Summary with Bag Icon */}
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0 btn-soft-3d-primary rounded-xl sm:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105">
                        <ShoppingBag size={20} className="text-white drop-shadow-sm" />
                        <span
                            key={totalItems}
                            className="absolute -top-1.5 -right-1.5 bg-white text-primary text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-primary ring-2 ring-dark-950 tabular-nums shadow-md animate-cart-bump"
                        >
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-400">إجمالي الطلب</span>
                        <span
                            key={subtotal}
                            className="font-black text-base sm:text-lg text-amber-400 truncate tabular-nums leading-snug animate-in fade-in duration-200"
                        >
                            {formatCurrency(subtotal)}
                        </span>
                    </div>
                </div>

                {/* Left Side (RTL): CTA Button */}
                <div className="btn-soft-3d-primary text-white flex items-center gap-1.5 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shrink-0 shadow-sm group-hover:brightness-105 transition-all">
                    <span>عرض السلة</span>
                    <ChevronLeft size={16} className="transition-transform group-hover:-translate-x-1" />
                </div>
            </button>
        </div>
    );
});

export default StickyCartBar;


