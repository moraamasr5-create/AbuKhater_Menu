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
        <div className="min-h-screen pb-24 bg-slate-950">
            <ProgressSteps />

            <div className="max-w-md mx-auto p-4 pt-6">
                <h2 className="text-2xl font-bold text-slate-100 mb-6">مراجعة الطلب</h2>

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

                <div className="space-y-4">
                    <h3 className="font-bold text-slate-200">طريقة الاستلام</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setOrderType('delivery')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${orderType === 'delivery'
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            <Bike size={32} />
                            <span className="font-bold">توصيل للمنزل</span>
                        </button>

                        <button
                            onClick={() => setOrderType('pickup')}
                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${orderType === 'pickup'
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
                                }`}
                        >
                            <Store size={32} />
                            <div className="text-center">
                                <span className="block font-bold">استلام من المطعم</span>
                                <span className="text-xs opacity-75">دفع 50% </span>
                            </div>
                        </button>
                    </div>
                </div>

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={() => navigate('/')}
                        className="flex-1 py-4 rounded-xl font-bold text-slate-400 border border-slate-700 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowRight size={20} />
                        <span>عودة</span>
                    </button>
                    <button
                        onClick={() => navigate('/customer')}
                        className="flex-[2] bg-primary text-white py-4 rounded-xl font-bold shadow-lg hover:bg-orange-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span>المتابعة</span>
                        <ArrowLeft size={20} className="rtl:rotate-180" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReviewPage;
