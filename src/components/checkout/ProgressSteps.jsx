import React from 'react';
import { Check } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const steps = [
    { id: 1, path: '/', label: 'المنيو' },
    { id: 2, path: '/review', label: 'السلة' },
    { id: 3, path: '/customer', label: 'البيانات' },
    { id: 4, path: '/payment', label: 'الدفع' }
];

const ProgressSteps = () => {
    const location = useLocation();

    const currentStepIndex = steps.findIndex(s => s.path === location.pathname) + 1 ||
        (location.pathname === '/' ? 1 : 0);

    return (
        <div className="w-full bg-dark-950/50 backdrop-blur-md pt-4 pb-3 px-4 border-b border-white/5">
            <div className="flex items-center justify-between relative max-w-lg mx-auto">
                {/* Background Line */}
                <div className="absolute left-0 right-0 top-[14px] h-[2px] bg-dark-800 -z-0"></div>

                {/* Active Progress Line */}
                <div
                    className="absolute left-0 top-[14px] h-[2px] bg-primary transition-all duration-700 -z-0"
                    style={{ width: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%` }}
                ></div>

                {steps.map((step) => {
                    const isCompleted = step.id < currentStepIndex;
                    const isActive = step.id === currentStepIndex;

                    return (
                        <div key={step.id} className="flex flex-col items-center relative z-10 bg-dark-950 px-1.5 transition-all duration-300">
                            <div
                                className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-[10px] transition-all duration-500 border-2
                                    ${isCompleted
                                        ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-[360deg]'
                                        : isActive
                                            ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-110'
                                            : 'bg-dark-900 border-dark-700 text-slate-600'
                                    }`}
                            >
                                {isCompleted ? <Check size={14} strokeWidth={4} /> : step.id}
                            </div>
                            <span
                                className={`text-[9px] mt-1.5 font-black transition-all duration-300 tracking-tighter
                                    ${isActive ? 'text-primary' : 'text-slate-600'}
                                `}
                            >
                                {step.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressSteps;
