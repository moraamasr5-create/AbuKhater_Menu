import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import useCart from '../../hooks/useCart';

const OrderSummary = ({ cart, subtotal, deliveryFee, serviceFee, total, orderType, paidNow, remaining }) => {
    const { updateQuantity } = useCart();

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mb-6">
            <div className="p-4 border-b border-slate-700">
                <h3 className="font-bold text-slate-100 mb-4">ملخص الطلب</h3>
                <div className="space-y-4">
                    {cart.map(item => (
                        <div key={item.id} className="flex justify-between items-center text-sm group">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                                    <button
                                        onClick={() => updateQuantity(item.id, 1)}
                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-primary rounded-md transition-all active:scale-90"
                                    >
                                        <Plus size={10} />
                                    </button>
                                    <span className="min-w-[1.25rem] text-center font-bold text-white text-xs">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.id, -1)}
                                        className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-slate-800 rounded-md transition-all active:scale-90"
                                    >
                                        <Minus size={10} />
                                    </button>
                                </div>
                                <span className="text-slate-300 font-medium whitespace-nowrap">{item.name}</span>
                            </div>
                            <span className="text-slate-100 font-bold font-mono">
                                {formatCurrency(item.price * item.quantity)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-4 bg-slate-900/50 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                    <span>المجموع الفرعي</span>
                    <span>{formatCurrency(subtotal)}</span>
                </div>

                {orderType === 'delivery' && (
                    <div className="flex justify-between text-slate-400">
                        <span>رسوم التوصيل</span>
                        <span>{formatCurrency(deliveryFee)}</span>
                    </div>
                )}

                {orderType === 'pickup' && (
                    <div className="flex justify-between text-slate-400">
                        <span>رسوم الخدمة</span>
                        <span>{formatCurrency(serviceFee)}</span>
                    </div>
                )}

                <div className="my-2 border-t border-slate-700"></div>

                <div className="flex justify-between text-slate-100 font-bold text-lg">
                    <span>الإجمالي</span>
                    <span>{formatCurrency(total)}</span>
                </div>

                {orderType === 'pickup' && (
                    <>
                        <div className="flex justify-between text-emerald-400 font-bold mt-2 bg-emerald-400/10 p-2 rounded">
                            <span>المطلوب دفعه الآن (شامل الرسوم)</span>
                            <span>{formatCurrency(paidNow)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500 text-xs px-2">
                            <span>المتبقي عند الاستلام</span>
                            <span>{formatCurrency(remaining)}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderSummary;
