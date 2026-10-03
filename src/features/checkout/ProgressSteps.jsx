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
        <nav className="w-full bg-dark-950/40 backdrop-blur-md py-1.5 sm:py-2 px-3 sm:px-4 border-b border-white/[0.04]" aria-label="خطوات إتمام الطلب">
            <div className="flex items-center justify-between relative max-w-xs sm:max-w-sm mx-auto">
                <div className="absolute left-0 right-0 top-3 h-0.5 bg-dark-800/80 -z-0 rounded-full" aria-hidden />

                <div
                    className="absolute left-0 top-3 h-0.5 bg-gradient-to-l from-primary to-orange-500 transition-all duration-700 -z-0 rounded-full"
                    style={{ width: `${((currentStepIndex - 1) / (steps.length - 1)) * 100}%` }}
                    aria-hidden
                />

                {steps.map((step) => {
                    const isCompleted = step.id < currentStepIndex;
                    const isActive = step.id === currentStepIndex;
                    const isUpcoming = step.id > currentStepIndex;

                    const circleClass = `w-7 h-7 rounded-xl flex items-center justify-center font-black text-[10px] transition-all duration-300 border
                                    ${isCompleted
                            ? 'bg-gradient-to-b from-teal-500 to-teal-600 border-teal-400/40 text-white shadow-md shadow-teal-900/30'
                            : isActive
                                ? 'bg-gradient-to-b from-[#f97316] to-[#ea580c] border-white/30 text-white shadow-md shadow-orange-950/50 scale-110 ring-2 ring-primary/25'
                                : 'bg-dark-900/90 border-white/[0.06] text-slate-500 shadow-inner'
                        }`;

                    const labelClass = `text-[10px] mt-1 font-bold transition-all duration-300 tracking-tight text-center leading-tight
                                    ${isActive ? 'text-primary' : isCompleted ? 'text-teal-400' : 'text-slate-500'}`;

                    if (isCompleted) {
                        return (
                            <button
                                key={step.id}
                                type="button"
                                onClick={() => navigate(step.path)}
                                className="flex flex-col items-center relative z-10 bg-dark-950 px-1 transition-all duration-300 rounded-lg hover:scale-105 active:scale-95 focus-visible:ring-offset-dark-950"
                                aria-label={`الرجوع إلى خطوة ${step.label}`}
                            >
                                <span className={circleClass} aria-hidden>
                                    <Check size={13} strokeWidth={3} />
                                </span>
                                <span className={labelClass}>{step.label}</span>
                            </button>
                        );
                    }

                    return (
                        <div
                            key={step.id}
                            className="flex flex-col items-center relative z-10 bg-dark-950 px-1 transition-all duration-300"
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


