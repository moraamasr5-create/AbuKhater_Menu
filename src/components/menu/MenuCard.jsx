import React, { memo } from 'react';
import { Plus, Minus } from 'lucide-react';
import useCart from '../../hooks/useCart';
import { formatCurrency } from '../../utils/formatters';

const MenuCard = memo(({ item }) => {
    const { cart, addToCart, updateQuantity } = useCart();
    const cartItem = cart.find(i => i.id === item.id);
    const qty = cartItem ? cartItem.quantity : 0;
    const isAvailable = item.status === 'available';

    return (
        <div className={`bg-slate-900 rounded-xl shadow-sm border border-slate-800 overflow-hidden flex flex-col h-full transform transition-all duration-200 ${!isAvailable ? 'grayscale opacity-75' : 'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50'}`}>
            <div className="relative h-40 overflow-hidden">
                <img
                    src={item.image || '/logo.jpg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/logo.jpg'; }}
                />
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            غير متاح حالياً
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-100 text-lg leading-tight">{item.name}</h3>
                    <span className="font-bold text-primary whitespace-nowrap">{formatCurrency(item.price)}</span>
                </div>
                <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-grow">{item.description}</p>

                <div className="mt-auto">
                    {isAvailable ? (
                        qty > 0 ? (
                            <div className="flex items-center justify-between bg-slate-800 rounded-lg p-1 border border-slate-700">
                                <button
                                    onClick={() => updateQuantity(item.id, -1)}
                                    className="w-8 h-8 flex items-center justify-center bg-slate-700 rounded-md shadow-sm text-slate-200 hover:bg-slate-600 active:scale-95 transition-all"
                                >
                                    <Minus size={16} />
                                </button>
                                <span className="font-bold text-slate-100 w-8 text-center">{qty}</span>
                                <button
                                    onClick={() => updateQuantity(item.id, 1)}
                                    className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-md shadow-sm hover:bg-orange-600 active:scale-95 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => addToCart(item)}
                                className="w-full bg-slate-800 text-slate-200 font-semibold py-2 rounded-lg hover:bg-primary hover:text-white active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-700 hover:border-primary"
                            >
                                <Plus size={18} />
                                <span>إضافة للسلة</span>
                            </button>
                        )
                    ) : (
                        <button disabled className="w-full bg-slate-800 text-slate-500 font-semibold py-2 rounded-lg cursor-not-allowed border border-slate-700">
                            غير متاح
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

export default MenuCard;
