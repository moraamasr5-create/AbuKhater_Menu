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
            className="fixed z-[70] max-w-lg mx-auto left-3 right-3 sm:left-4 sm:right-4"
            style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
        >
            <button
                type="button"
                onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(15);
                    navigate('/review');
                }}
                className="group w-full surface-float-3d text-white p-2.5 pr-4 sm:pr-5 rounded-[1.75rem] sm:rounded-[2rem] flex items-center justify-between gap-2 transition-all active:scale-[0.98] animate-in slide-in-from-bottom-10 duration-500 min-h-[3.5rem]"
                aria-label={`متابعة الطلب: ${totalItems} عناصر في السلة، الإجمالي ${formatCurrency(subtotal)}. اضغط لمراجعة السلة`}
            >
                {/* Left Side: Summary */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 btn-soft-3d-primary rounded-full flex items-center justify-center relative group-hover:scale-105 transition-transform">
                        <ShoppingBag size={22} className="text-white sm:w-6 sm:h-6 drop-shadow-sm" />
                        <span className="absolute -top-1 -right-1 bg-white text-primary text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-primary ring-2 ring-dark-950 tabular-nums shadow-md">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex flex-col items-start min-w-0">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">إجمالي السلة</span>
                        <span className="font-black text-lg sm:text-xl text-white truncate tabular-nums">{formatCurrency(subtotal)}</span>
                    </div>
                </div>

                {/* Right Side: Action */}
                <div className="btn-soft-3d-primary text-white flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl sm:rounded-[1.5rem] font-black text-xs sm:text-sm shrink-0">
                    <span>عرض السلة</span>
                    <ChevronLeft size={17} className="sm:w-[18px] sm:h-[18px] transition-transform group-hover:-translate-x-1" />
                </div>
            </button>
        </div>
    );
});

export default StickyCartBar;


