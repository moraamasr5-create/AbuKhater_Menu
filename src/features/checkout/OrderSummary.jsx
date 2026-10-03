import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../core/utils/formatters';
import useCart from '../../hooks/useCart';

const OrderSummary = ({ cart, subtotal, deliveryFee, serviceFee, total, orderType, paidNow, remaining }) => {
    const { updateQuantity } = useCart();

    return (
        <div className="surface-recessed-3d rounded-xl sm:rounded-2xl flex flex-col mb-1.5 overflow-hidden">
            <div className="p-3.5 sm:p-4 border-b border-white/[0.06] space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center text-slate-300 gap-2">
                    <h3 className="text-[12px] sm:text-[13px] font-black uppercase tracking-wider">ملخص الطلب</h3>
                    <span className="badge-soft-3d text-[10px] font-bold bg-dark-800/90 px-2.5 py-0.5 rounded-lg border border-white/[0.08] tabular-nums text-slate-300">{cart.length} أصناف</span>
                </div>
                
                <div className="space-y-3 sm:space-y-3.5">
                    {cart.map(item => {
                        const itemKey = item.cart_item_key || item.id;
                        return (
                            <div key={itemKey} className="flex justify-between items-start gap-3 sm:gap-4 group">
                                <div className="flex flex-1 items-start gap-2.5 sm:gap-3 min-w-0">
                                    {/* Quantity Toggles */}
                                    <div className="stepper-container-3d rounded-xl p-0.5 flex items-center shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                                updateQuantity(itemKey, 1);
                                            }}
                                            className="btn-soft-3d-dark w-7 h-7 flex items-center justify-center text-slate-300 hover:text-white rounded-lg transition-all"
                                            aria-label={`زيادة كمية ${item.name}`}
                                        >
                                            <Plus size={14} />
                                        </button>
                                        <span className="min-w-[1.5rem] text-center font-bold text-white text-sm tabular-nums">{item.quantity}</span>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                                updateQuantity(itemKey, -1);
                                            }}
                                            className="btn-soft-3d-dark w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 rounded-lg transition-all"
                                            aria-label={`تقليل كمية ${item.name}`}
                                        >
                                            <Minus size={14} />
                                        </button>
                                    </div>
                                    
                                    {/* Item Details */}
                                    <div className="pt-0.5 min-w-0 flex-1">
                                        <p className="text-sm font-bold text-slate-200 leading-tight truncate">{item.name}</p>
                                        
                                        {/* Variant Subtitle */}
                                        {item.selected_variant && (
                                            <p className="text-xs font-semibold text-primary mt-0.5">
                                                {item.selected_variant.name}
                                            </p>
                                        )}

                                        {/* Selected Options List */}
                                        {Array.isArray(item.selected_options) && item.selected_options.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.selected_options.map((opt, idx) => (
                                                    <span key={idx} className="inline-block text-[10px] font-medium bg-dark-950/80 text-slate-300 px-1.5 py-0.5 rounded border border-white/5">
                                                        {opt.option_name || opt.name}
                                                        {parseFloat(opt.price_delta) > 0 && ` (+${formatCurrency(opt.price_delta)})`}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Notes */}
                                        {item.notes && (
                                            <p className="text-[11px] text-amber-400/90 italic mt-0.5 line-clamp-1">
                                                ملاحظة: {item.notes}
                                            </p>
                                        )}

                                        <p className="text-[11px] text-slate-500 font-bold mt-0.5">{formatCurrency(item.price)}</p>
                                    </div>
                                </div>
                                
                                {/* Line Total */}
                                <span className="text-sm font-black text-white pt-1 tabular-nums shrink-0">
                                    {formatCurrency(item.price * item.quantity)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-dark-900/70 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span className="text-slate-200 tabular-nums">{formatCurrency(subtotal)}</span>
                </div>

                {orderType === 'delivery' && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>رسوم التوصيل</span>
                        <span className="text-slate-200 tabular-nums">{formatCurrency(deliveryFee)}</span>
                    </div>
                )}

                {orderType === 'pickup' && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>رسوم الخدمة</span>
                        <span className="text-slate-200 tabular-nums">{formatCurrency(serviceFee)}</span>
                    </div>
                )}

                <div className="pt-2 border-t border-white/[0.08]">
                    <div className="flex justify-between items-center text-white">
                        <span className="text-sm font-black">الإجمالي</span>
                        <span className="text-lg sm:text-xl font-black display-font text-primary tabular-nums">{formatCurrency(total)}</span>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderSummary;


