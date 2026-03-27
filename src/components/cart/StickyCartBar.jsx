import React from 'react';
import { ShoppingBag, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';

const StickyCartBar = () => {
    const { cart } = useCart();
    const navigate = useNavigate();

    if (cart.length === 0) return null;

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[70] max-w-lg mx-auto">
            <button
                onClick={() => navigate('/review')}
                className="group w-full bg-dark-900/90 text-white p-2 pr-5 rounded-[2rem] shadow-2xl shadow-black/60 border border-white/10 backdrop-blur-xl flex items-center justify-between transition-all active:scale-95 animate-in slide-in-from-bottom-10 duration-500"
            >
                {/* Left Side: Summary */}
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center relative shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                        <ShoppingBag size={24} className="text-white" />
                        <span className="absolute -top-1 -right-1 bg-white text-primary text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full border-2 border-primary ring-2 ring-dark-900">
                            {totalItems}
                        </span>
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">إجمالي السلة</span>
                        <span className="font-black text-xl text-white">{formatCurrency(subtotal)}</span>
                    </div>
                </div>

                {/* Right Side: Action */}
                <div className="bg-dark-800 text-white flex items-center gap-2 px-6 py-4 rounded-[1.5rem] font-black text-sm group-hover:bg-primary transition-colors border border-white/5">
                    <span>عرض السلة</span>
                    <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                </div>
            </button>
        </div>
    );
};

export default StickyCartBar;
