import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import useCart from '../../hooks/useCart';

const OrderSummary = ({ cart, subtotal, deliveryFee, serviceFee, total, orderType, paidNow, remaining }) => {
    const { updateQuantity } = useCart();

    return (
        <div className="bg-dark-950 rounded-xl sm:rounded-2xl flex flex-col mb-1.5">
            <div className="p-3.5 sm:p-4 border-b border-white/[0.06] space-y-3 sm:space-y-4">
                <div className="flex justify-between items-center text-slate-300 gap-2">
                    <h3 className="text-[12px] sm:text-[13px] font-black uppercase tracking-wider">ملخص الطلب</h3>
                    <span className="text-[10px] font-bold bg-dark-800/90 px-2 py-1 rounded-lg border border-white/[0.05] tabular-nums">{cart.length} أصناف</span>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-start gap-4 group">
                            <div className="flex flex-1 items-start gap-3">
                                {/* Quantity Toggles */}
                                <div className="flex items-center bg-dark-900 border border-white/5 rounded-xl p-1 shrink-0 shadow-sm">
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary/20 rounded-lg transition-all active:scale-90"
                                    >
                                        <Plus size={14} />
                                    </button>
                                    <span className="min-w-[1.5rem] text-center font-bold text-white text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all active:scale-90"
                                    >
                                        <Minus size={14} />
                                    </button>
                                </div>
                                
                                {/* Item Details */}
                                <div className="pt-1.5">
                                    <p className="text-sm font-bold text-slate-200 leading-tight">{item.name}</p>
                                    <p className="text-[11px] text-slate-500 font-bold mt-0.5">{formatCurrency(item.price)}</p>
                                </div>
                            </div>
                            
                            {/* Line Total */}
                            <span className="text-sm font-black text-white pt-1.5">
                                {formatCurrency(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-3.5 sm:p-4 bg-dark-900/55 space-y-2.5 sm:space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span className="text-slate-300">{formatCurrency(subtotal)}</span>
                </div>

                {orderType === 'delivery' && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>رسوم التوصيل</span>
                        <span className="text-slate-300">{formatCurrency(deliveryFee)}</span>
                    </div>
                )}

                {orderType === 'pickup' && (
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                        <span>رسوم الخدمة</span>
                        <span className="text-slate-300">{formatCurrency(serviceFee)}</span>
                    </div>
                )}

                <div className="pt-2 border-t border-white/5">
                    <div className="flex justify-between items-center text-white">
                        <span className="text-sm font-black">الإجمالي</span>
                        <span className="text-lg font-black display-font text-primary">{formatCurrency(total)}</span>
                    </div>
                </div>

                {orderType === 'pickup' && (
                    <div className="mt-3 flex flex-col gap-1.5 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">المطلوب دفعه الآن</span>
                            <span className="font-black text-emerald-400">{formatCurrency(paidNow)}</span>
                        </div>
                        <div className="flex justify-between items-center opacity-80">
                            <span className="text-[10px] font-bold text-slate-400">المتبقي عند الاستلام</span>
                            <span className="text-[10px] font-bold text-slate-400">{formatCurrency(remaining)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;
