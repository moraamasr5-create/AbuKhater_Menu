import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import {
    X,
    Phone,
    ShieldCheck,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    Sparkles,
    KeyRound
} from 'lucide-react';
import { supabase } from '../../services/supabase/supabaseClient';
import { normalizePhoneToE164 } from '../../core/utils/formatters';
import LoadingSpinner from './LoadingSpinner';

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

const PhoneOtpModal = ({
    isOpen,
    onClose,
    onSuccess,
    initialPhone = '',
    title = 'التحقق من رقم الهاتف',
    description = 'لإتمام طلبك ومتابعته بأمان، يرجى تأكيد رقم هاتفك برمز التحقق'
}) => {
    const [phone, setPhone] = useState('');
    const [step, setStep] = useState('phone'); // 'phone' | 'otp'
    const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [timer, setTimer] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);

    const inputRefs = useRef([]);

    // Initialize or reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            const raw = initialPhone || '';
            const clean = raw.replace(/[^\d+]/g, '');
            setPhone(clean);
            setError(null);
            setIsLoading(false);
            setIsSuccess(false);
            setOtpDigits(Array(OTP_LENGTH).fill(''));

            // If a valid Egyptian phone is provided, start directly on OTP or phone step
            if (clean.length >= 10) {
                setStep('phone');
            } else {
                setStep('phone');
            }
        }
    }, [isOpen, initialPhone]);

    // Countdown timer effect
    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => {
            setTimer((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [timer]);

    if (!isOpen) return null;

    /**
     * Send OTP via Supabase Auth
     */
    const handleSendOtp = async (targetPhone = phone) => {
        setError(null);
        const formatted = normalizePhoneToE164(targetPhone);

        if (!formatted || formatted.length < 12) {
            setError('يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678)');
            return;
        }

        setIsLoading(true);
        try {
            console.log('📲 Sending Supabase OTP to:', formatted);
            const { error: otpError } = await supabase.auth.signInWithOtp({
                phone: formatted
            });

            if (otpError) {
                console.error('❌ signInWithOtp error:', otpError);
                if (otpError.message?.includes('rate limit') || otpError.status === 429) {
                    setError('تجاوزت الحد المسموح من المحاولات. يرجى الانتظار بضع دقائق ثم المحاولة ثانية.');
                } else if (otpError.message?.includes('provider')) {
                    setError('خدمة الرسائل غير مفعلة حالياً.');
                } else {
                    setError(otpError.message || 'تعذر إرسال رمز التحقق. يرجى التأكد من الرقم.');
                }
                return;
            }

            setStep('otp');
            setTimer(COUNTDOWN_SECONDS);
            setOtpDigits(Array(OTP_LENGTH).fill(''));
            setTimeout(() => {
                inputRefs.current[0]?.focus();
            }, 100);
        } catch (err) {
            console.error('❌ Failed to send OTP:', err);
            setError('حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة ثانية.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Verify OTP code with Supabase
     */
    const handleVerifyOtp = async (codeToVerify) => {
        const token = codeToVerify || otpDigits.join('');
        if (token.length !== OTP_LENGTH) {
            setError(`يرجى إدخال رمز التحقق كاملاً (${OTP_LENGTH} أرقام)`);
            return;
        }

        setError(null);
        setIsLoading(true);

        const formatted = normalizePhoneToE164(phone);
        try {
            console.log('🔐 Verifying OTP for:', formatted, 'token:', token);
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                phone: formatted,
                token: token,
                type: 'sms'
            });

            if (verifyError) {
                console.error('❌ verifyOtp error:', verifyError);
                if (verifyError.message?.includes('expired') || verifyError.message?.includes('invalid')) {
                    setError('رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى المحاولة مرة أخرى.');
                } else {
                    setError(verifyError.message || 'فشل التحقق من الرمز.');
                }
                return;
            }

            console.log('✅ OTP Verified! User session:', data?.session?.user?.id);
            setIsSuccess(true);

            // Short delay to display success animation, then fire callback
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(data.user, data.session);
                }
                onClose();
            }, 700);
        } catch (err) {
            console.error('❌ Error during OTP verification:', err);
            setError('حدث خطأ أثناء التحقق. يرجى المحاولة لاحقاً.');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Handle single digit change in OTP inputs
     */
    const handleDigitChange = (index, value) => {
        const val = value.replace(/\D/g, '');
        if (!val) {
            const updated = [...otpDigits];
            updated[index] = '';
            setOtpDigits(updated);
            return;
        }

        // Support pasting multi-digit code
        if (val.length > 1) {
            const pasted = val.slice(0, OTP_LENGTH).split('');
            const updated = [...otpDigits];
            pasted.forEach((d, i) => {
                if (index + i < OTP_LENGTH) {
                    updated[index + i] = d;
                }
            });
            setOtpDigits(updated);

            const nextFocus = Math.min(index + pasted.length, OTP_LENGTH - 1);
            inputRefs.current[nextFocus]?.focus();

            if (updated.every((d) => d !== '')) {
                handleVerifyOtp(updated.join(''));
            }
            return;
        }

        const updated = [...otpDigits];
        updated[index] = val.slice(-1);
        setOtpDigits(updated);

        // Auto advance to next input
        if (index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto verify if all digits filled
        if (updated.every((d) => d !== '')) {
            handleVerifyOtp(updated.join(''));
        }
    };

    /**
     * Handle backspace navigation in OTP inputs
     */
    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-otp-modal-title"
        >
            <div
                className="bg-dark-900 border border-white/10 rounded-[1.75rem] sm:rounded-[2.25rem] w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative animate-in zoom-in-95 duration-200"
                dir="rtl"
            >
                {/* Modal Header */}
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-dark-800/40">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="p-2 bg-dark-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl transition-all disabled:opacity-50"
                        aria-label="إلغاء"
                    >
                        <X size={18} />
                    </button>

                    <h2 id="phone-otp-modal-title" className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                        <span>{title}</span>
                        <ShieldCheck className="text-primary" size={18} />
                    </h2>

                    <div className="w-8" />
                </div>

                {/* Modal Body */}
                <div className="p-5 sm:p-6 space-y-5">
                    {/* Success State */}
                    {isSuccess ? (
                        <div className="py-8 text-center space-y-3 animate-in zoom-in-90 duration-300">
                            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={36} />
                            </div>
                            <h3 className="text-base font-black text-white">تم تأكيد رقم هاتفك بنجاح!</h3>
                            <p className="text-xs text-slate-400">جاري متابعة طلبك مباشرة...</p>
                        </div>
                    ) : step === 'phone' ? (
                        /* Step 1: Phone Input */
                        <div className="space-y-4">
                            <div className="text-center space-y-1.5">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                                    <Phone size={22} />
                                </div>
                                <h3 className="text-base font-black text-white">أدخل رقم هاتفك</h3>
                                <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                                    {description}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="phone-otp-input" className="block text-[11px] font-bold text-slate-400">
                                    رقم الهاتف (مصر)
                                </label>
                                <div className="relative flex items-center bg-dark-950 rounded-2xl border border-white/10 px-3.5 py-2.5 focus-within:border-primary transition-all">
                                    <span className="text-xs font-bold text-slate-400 ltr pl-2 border-l border-white/10">
                                        🇪🇬 +20
                                    </span>
                                    <input
                                        id="phone-otp-input"
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="01012345678"
                                        className="w-full bg-transparent text-white font-mono font-bold text-base px-3 outline-none ltr text-right placeholder:text-slate-600"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => handleSendOtp(phone)}
                                disabled={isLoading || !phone}
                                className="w-full py-3.5 bg-gradient-to-r from-primary to-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                            >
                                {isLoading ? (
                                    <LoadingSpinner size={18} color="text-white" />
                                ) : (
                                    <>
                                        <span>إرسال رمز التحقق</span>
                                        <Sparkles size={16} />
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        /* Step 2: OTP Digits Input */
                        <div className="space-y-5">
                            <div className="text-center space-y-1">
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                                    <KeyRound size={22} />
                                </div>
                                <h3 className="text-base font-black text-white">أدخل رمز التحقق</h3>
                                <p className="text-xs text-slate-400">
                                    تم إرسال كود التحقق المكون من 6 أرقام إلى{' '}
                                    <span className="text-primary font-bold font-mono ltr inline-block">
                                        {normalizePhoneToE164(phone)}
                                    </span>
                                </p>
                            </div>

                            {/* 6 Digit Input Boxes */}
                            <div className="flex justify-center gap-2 sm:gap-2.5 ltr" dir="ltr">
                                {otpDigits.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={(el) => (inputRefs.current[idx] = el)}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(idx, e)}
                                        disabled={isLoading}
                                        className={`w-11 h-13 sm:w-12 sm:h-14 rounded-2xl text-center text-xl font-mono font-black border transition-all outline-none ${
                                            digit
                                                ? 'bg-primary/15 border-primary text-white shadow-md shadow-primary/20'
                                                : 'bg-dark-950 border-white/10 text-slate-300 focus:border-primary'
                                        }`}
                                    />
                                ))}
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-xs font-bold">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => handleVerifyOtp()}
                                    disabled={isLoading || otpDigits.some((d) => !d)}
                                    className="w-full py-3.5 bg-gradient-to-r from-primary to-orange-600 text-white font-black text-sm rounded-2xl transition-all shadow-lg shadow-primary/25 hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                                >
                                    {isLoading ? (
                                        <LoadingSpinner size={18} color="text-white" />
                                    ) : (
                                        <>
                                            <span>تأكيد الرمز والمتابعة</span>
                                            <CheckCircle2 size={17} />
                                        </>
                                    )}
                                </button>

                                <div className="flex items-center justify-between text-xs px-1">
                                    <button
                                        type="button"
                                        onClick={() => setStep('phone')}
                                        disabled={isLoading}
                                        className="text-slate-400 hover:text-white flex items-center gap-1 font-bold transition-colors"
                                    >
                                        <ArrowLeft size={14} />
                                        <span>تغيير الرقم</span>
                                    </button>

                                    {timer > 0 ? (
                                        <span className="text-slate-500 font-bold font-mono">
                                            إعادة الإرسال بعد ({timer} ثانية)
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSendOtp(phone)}
                                            disabled={isLoading}
                                            className="text-primary hover:underline font-bold flex items-center gap-1"
                                        >
                                            <RotateCcw size={13} />
                                            <span>إعادة إرسال الرمز</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

PhoneOtpModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onSuccess: PropTypes.func.isRequired,
    initialPhone: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string
};

export default PhoneOtpModal;
