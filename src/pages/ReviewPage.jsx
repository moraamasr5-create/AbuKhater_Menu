import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import useCart from '../hooks/useCart';
import ProgressSteps from '../features/checkout/ProgressSteps';
import StickyCartBar from '../features/cart/StickyCartBar';
import OrderSummary from '../features/checkout/OrderSummary';
import { calculateServiceFee } from '../core/utils/calculations';

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
    const serviceFee = calculateServiceFee(subtotal);
    const pickupTotal = subtotal + serviceFee;
    const remaining = 0;
    const paidNow = pickupTotal;

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

                <div className="card-soft-3d rounded-2xl sm:rounded-[1.5rem] p-1.5 overflow-hidden">
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
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                setOrderType('delivery');
                            }}
                            className={`p-4 sm:p-5 min-h-[120px] sm:min-h-0 rounded-xl sm:rounded-[1.25rem] transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] ${orderType === 'delivery'
                                ? 'btn-soft-3d-primary text-white scale-[1.02]'
                                : 'card-soft-3d text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Bike size={28} className={`sm:w-8 sm:h-8 ${orderType === 'delivery' ? 'opacity-100 drop-shadow-sm' : 'opacity-70'}`} />
                            <span className="font-bold text-[13px] sm:text-sm text-center leading-snug">توصيل للمنزل</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                if (typeof window !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
                                setOrderType('pickup');
                            }}
                            className={`p-4 sm:p-5 min-h-[120px] sm:min-h-0 rounded-xl sm:rounded-[1.25rem] transition-all flex flex-col items-center justify-center gap-2 sm:gap-3 active:scale-[0.98] ${orderType === 'pickup'
                                ? 'btn-soft-3d-primary text-white scale-[1.02]'
                                : 'card-soft-3d text-slate-400 hover:text-slate-200'
                                }`}
                        >
                            <Store size={28} className={`sm:w-8 sm:h-8 ${orderType === 'pickup' ? 'opacity-100 drop-shadow-sm' : 'opacity-70'}`} />
                            <div className="text-center space-y-0.5">
                                <span className="block font-bold text-[13px] sm:text-sm leading-snug">استلام من المطعم</span>
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
                        className="btn-soft-3d-dark flex-1 min-h-[52px] sm:h-14 rounded-xl sm:rounded-2xl font-bold text-slate-200 w-full flex items-center justify-center gap-2 text-[15px] sm:text-sm"
                        aria-label="العودة إلى قائمة الطعام لإضافة المزيد"
                    >
                        <ArrowRight size={18} aria-hidden />
                        <span>عودة للمنيو</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/customer')}
                        className="btn-soft-3d-primary flex-[2] min-h-[52px] sm:h-14 text-white rounded-xl sm:rounded-2xl font-black w-full flex items-center justify-center gap-2"
                        aria-label="المتابعة لإدخال بيانات التوصيل والدفع"
                    >
                        <span className="text-[15px]">المتابعة للبيانات</span>
                        <ArrowLeft size={18} className="rtl:rotate-180" aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;


