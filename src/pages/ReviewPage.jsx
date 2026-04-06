import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import useCart from '../hooks/useCart';
import ProgressSteps from '../components/checkout/ProgressSteps';
import StickyCartBar from '../components/cart/StickyCartBar';
import OrderSummary from '../components/checkout/OrderSummary';
import { calculateServiceFee } from '../utils/calculations';

const ReviewPage = () => {
    /**
     * 🔴 الدالة المسؤولة عن حساب إجمالي الطلب ومراجعته قبل الدفع
     * بتتأكد إن السلة مش فاضية وبتحسب فرق السعر بين التوصيل والاستلام
     */
    const { cart, orderType, setOrderType, deliveryFee } = useCart();
    const navigate = useNavigate();

    useEffect(() => {
        if (cart.length === 0) {
            navigate('/');
        }
    }, [cart.length, navigate]);

    if (cart.length === 0) {
        return null;
    }

    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Pickup Calculations
    const pickupSubtotalHalf = subtotal / 2;
    const serviceFee = calculateServiceFee(pickupSubtotalHalf);
    const requiredDeposit = pickupSubtotalHalf;
    // The user has to pay: Deposit + Fee NOW.
    // Total Order Cost (Pickup) = Subtotal + Fee ? NO.
    // Prompt says: "Total = 155". "Remaining = 77.5". "Paid Now = 87.5" (77.5 + 10).
    // So Total Order Cost to customer is 155 + 10 = 165? 
    // "Total Amount" in JSON is 155. "Paid Now" 87.5. "Remaining" 77.5. 
    // 87.5 + 77.5 = 165.
    // So Yes, Total (to customer) is Subtotal + Fee.

    // Let's refine variables to match Prompt's logic:
    // "Total (subtotal)" = 155.
    // "First Half" = 77.5.
    // "Service Fee" = 10.
    // "Current Amount (Paid Now)" = 87.5.
    // "Remaining" = 77.5.

    const pickupTotal = subtotal + serviceFee; // This is the final effective total including fee
    const remaining = pickupSubtotalHalf;
    const paidNow = requiredDeposit + serviceFee;

    // 🔴 تحديد المبلغ الإجمالي بناءً على نوع الطلب (توصيل أو استلام)
    const total = orderType === 'delivery' ? (subtotal + deliveryFee) : pickupTotal;

    return (
        <div className="min-h-[100dvh] bg-dark-950 pb-[max(9rem,env(safe-area-inset-bottom,0px))] sm:pb-36 relative scroll-smooth overflow-x-hidden">
            <ProgressSteps />

            <div className="max-w-md mx-auto w-full px-3 sm:px-4 pt-5 sm:pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 sm:space-y-8">
                <header className="text-center space-y-2">
                    <h2 className="text-[1.35rem] sm:text-2xl font-black text-white display-font tracking-tight">مراجعة الطلب</h2>
                    <p className="text-slate-400/95 text-[13px] sm:text-xs font-semibold leading-relaxed px-1">تأكد من طلبك واختر طريقة الاستلام</p>
                </header>

                <div className="bg-dark-900 rounded-2xl sm:rounded-[1.5rem] border border-white/[0.07] p-1 overflow-hidden shadow-md">
                    <OrderSummary
                        cart={cart}
                        subtotal={subtotal}
                        deliveryFee={deliveryFee}
                        serviceFee={serviceFee}
                        total={total}
                        orderType={orderType}
                        paidNow={paidNow}
                        remaining={remaining}
                    />
                </div>

                <div className="space-y-3 sm:space-y-4">
                    <h3 className="text-[12px] sm:text-[13px] font-black text-slate-300 px-1 sm:px-2 uppercase tracking-wider flex items-center gap-2">
                        <Store size={16} className="text-primary shrink-0" /> طريقة الاستلام
                    </h3>
                    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 px-0.5 sm:px-1">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`p-4 sm:p-5 min-h-[120px] sm:min-h-0 rounded-xl sm:rounded-[1.25rem] border-2 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] ${
                                orderType === 'delivery'
                                    ? 'bg-gradient-to-br from-primary to-orange-600 border-transparent text-white shadow-lg shadow-primary/25'
                                    : 'bg-dark-900 border-dark-800/80 text-slate-400 hover:bg-dark-800 hover:text-slate-200'
                            }`}
                        >
                            <Bike size={28} className={`sm:w-8 sm:h-8 ${orderType === 'delivery' ? 'opacity-100' : 'opacity-70'}`} />
                            <span className="font-bold text-[13px] sm:text-sm text-center leading-snug">توصيل للمنزل</span>
                        </button>

                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`p-4 sm:p-5 min-h-[120px] sm:min-h-0 rounded-xl sm:rounded-[1.25rem] border-2 transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] ${
                                orderType === 'pickup'
                                    ? 'bg-gradient-to-br from-primary to-orange-600 border-transparent text-white shadow-lg shadow-primary/25'
                                    : 'bg-dark-900 border-dark-800/80 text-slate-400 hover:bg-dark-800 hover:text-slate-200'
                            }`}
                        >
                            <Store size={28} className={`sm:w-8 sm:h-8 ${orderType === 'pickup' ? 'opacity-100' : 'opacity-70'}`} />
                            <div className="text-center space-y-0.5">
                                <span className="block font-bold text-[13px] sm:text-sm leading-snug">استلام من المطعم</span>
                                <span className={`text-[10px] ${orderType === 'pickup' ? 'text-white/85' : 'text-slate-500'}`}>دفع 50%</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar for Mobile */}
            <div className="checkout-bottom-bar">
                <div className="max-w-md mx-auto flex gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex-1 min-h-[52px] sm:h-14 rounded-xl sm:rounded-2xl font-bold border border-white/[0.08] bg-dark-800 text-slate-300 hover:bg-dark-700 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2 text-[15px] sm:text-sm"
                        aria-label="العودة إلى قائمة الطعام لإضافة المزيد"
                    >
                        <ArrowRight size={18} aria-hidden />
                        <span>عودة للمنيو</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/customer')}
                        className="flex-[2] min-h-[52px] sm:h-14 bg-gradient-to-r from-primary to-orange-600 text-white rounded-xl sm:rounded-2xl font-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] transition-all w-full flex items-center justify-center gap-2"
                        aria-label="المتابعة لإدخال بيانات التوصيل والدفع"
                    >
                        <span className="text-[15px] sm:text-[15px]">المتابعة للبيانات</span>
                        <ArrowLeft size={18} className="rtl:rotate-180" aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;
