import React, { memo } from 'react';
import { Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const steps = [
    { id: 1, path: '/', label: 'المنيو' },
    { id: 2, path: '/review', label: 'السلة' },
    { id: 3, path: '/customer', label: 'البيانات' },
    { id: 4, path: '/payment', label: 'الدفع' }
];

const ProgressSteps = memo(function ProgressSteps() {
    const location = useLocation();
    const navigate = useNavigate();

    const currentStepIndex = steps.findIndex(s => s.path === location.pathname) + 1 ||
        (location.pathname === '/' ? 1 : 0);

    return (
        <nav className="w-full bg-dark-950/60 backdrop-blur-lg pt-3 pb-2.5 sm:pt-4 sm:pb-3 px-3 sm:px-4 border-b border-white/[0.06]" aria-label="خطوات إتمام الطلب">
            <div className="flex items-center justify-between relative max-w-lg mx-auto">
                <div className="absolute left-0 right-0 top-4 h-0.5 bg-dark-800/90 -z-0 rounded-full" aria-hidden />

                <div
                    className="absolute left-0 top-4 h-0.5 bg-gradient-to-l from-primary to-orange-500 transition-all duration-700 -z-0 rounded-full"
                    style={{ width: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%` }}
                    aria-hidden
                />

                {steps.map((step) => {
                    const isCompleted = step.id < currentStepIndex;
                    const isActive = step.id === currentStepIndex;
                    const isUpcoming = step.id > currentStepIndex;

                    const circleClass = `w-8 h-8 sm:w-7 sm:h-7 rounded-xl flex items-center justify-center font-black text-[10px] transition-all duration-500 border-2
                                    ${isCompleted
                            ? 'bg-teal-600 border-teal-500 text-white shadow-md shadow-teal-900/30'
                            : isActive
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/35 scale-105 sm:scale-110'
                                : 'bg-dark-900 border-dark-700/80 text-slate-500'
                        }`;

                    const labelClass = `text-[10px] sm:text-[9px] mt-2 sm:mt-1.5 font-bold transition-all duration-300 tracking-normal max-w-[4.5rem] sm:max-w-none text-center leading-tight
                                    ${isActive ? 'text-primary' : isCompleted ? 'text-teal-500/90' : 'text-slate-500'}`;

                    if (isCompleted) {
                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => navigate(step.path)}
                                className="flex flex-col items-center relative z-10 bg-dark-950 px-1 sm:px-1.5 transition-all duration-300 rounded-lg hover:opacity-95 focus-visible:ring-offset-dark-950"
                                aria-label={`الرجوع إلى خطوة ${step.label}`}
                            >
                                <span className={circleClass} aria-hidden>
                                    <Check size={15} strokeWidth={3} className="sm:w-[14px] sm:h-[14px]" />
                                </span>
                                <span className={labelClass}>{step.label}</span>
                            </button>
                        );
                    }

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative z-10 bg-dark-950 px-1 sm:px-1.5 transition-all duration-300"
                            aria-current={isActive ? 'step' : undefined}
                        >
                            <span className={circleClass} aria-hidden>
                                {step.id}
                            </span>
                            <span className={labelClass}>
                                {step.label}
                                {isUpcoming && <span className="sr-only"> (لم تُكمَل بعد)</span>}
                            </span>
                        </div>
                    );
                })}
            </div>
        </nav>
    );
});

export default ProgressSteps;
