import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bike, Store, ArrowRight, ArrowLeft } from 'lucide-react';
import useCart from '../hooks/useCart';
import ProgressSteps from '../components/checkout/ProgressSteps';
import StickyCartBar from '../components/cart/StickyCartBar';
import OrderSummary from '../components/checkout/OrderSummary';
import { calculateDistance, getDeliveryFee, calculateServiceFee } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

const ReviewPage = () => {
    const { cart, orderType, setOrderType, deliveryFee, clearCart } = useCart();
    const navigate = useNavigate();

    if (cart.length === 0) {
        navigate('/');
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

    const total = orderType === 'delivery' ? (subtotal + deliveryFee) : pickupTotal;

    return (
        <div className="min-h-[100dvh] bg-dark-950 pb-36 relative scroll-smooth overflow-x-hidden">
            <ProgressSteps />

            <div className="max-w-md mx-auto w-full p-4 pt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                <header className="text-center space-y-1">
                    <h2 className="text-2xl font-black text-white display-font">مراجعة الطلب</h2>
                    <p className="text-slate-400 text-xs font-bold">تأكد من طلبك واختر طريقة الاستلام</p>
                </header>

                <div className="bg-dark-900 rounded-[1.5rem] border border-white/5 p-1 overflow-hidden shadow-sm">
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

                <div className="space-y-4">
                    <h3 className="text-[13px] font-black text-slate-300 px-2 uppercase tracking-widest flex items-center gap-2">
                        <Store size={16} className="text-primary" /> طريقة الاستلام
                    </h3>
                    <div className="grid grid-cols-2 gap-3 px-1">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`p-5 rounded-[1.25rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${
                                orderType === 'delivery'
                                    ? 'bg-gradient-to-br from-primary to-orange-500 border-transparent text-white shadow-lg shadow-primary/20'
                                    : 'bg-dark-900 border-dark-800 text-slate-400 hover:bg-dark-800 hover:text-slate-200'
                            }`}
                        >
                            <Bike size={32} className={orderType === 'delivery' ? 'opacity-100' : 'opacity-70'} />
                            <span className="font-bold text-sm">توصيل للمنزل</span>
                        </button>

                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`p-5 rounded-[1.25rem] border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${
                                orderType === 'pickup'
                                    ? 'bg-gradient-to-br from-primary to-orange-500 border-transparent text-white shadow-lg shadow-primary/20'
                                    : 'bg-dark-900 border-dark-800 text-slate-400 hover:bg-dark-800 hover:text-slate-200'
                            }`}
                        >
                            <Store size={32} className={orderType === 'pickup' ? 'opacity-100' : 'opacity-70'} />
                            <div className="text-center space-y-0.5">
                                <span className="block font-bold text-sm">استلام من المطعم</span>
                                <span className={`text-[10px] ${orderType === 'pickup' ? 'text-white/80' : 'text-slate-500'}`}>دفع 50%</span>
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Fixed Bottom Action Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-dark-950/90 backdrop-blur-xl border-t border-white/5 p-4 z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-md mx-auto flex gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 h-14 rounded-2xl font-bold border border-white/10 bg-dark-800 text-slate-300 hover:bg-dark-700 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={18} />
                        <span className="text-sm">عودة</span>
                    </button>
                    <button
                        onClick={() => navigate('/customer')}
                        className="flex-[2] h-14 bg-gradient-to-r from-primary to-orange-500 text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:brightness-110 active:scale-95 transition-all w-full flex items-center justify-center gap-2"
                    >
                        <span className="text-[15px]">المتابعة</span>
                        <ArrowLeft size={18} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;
