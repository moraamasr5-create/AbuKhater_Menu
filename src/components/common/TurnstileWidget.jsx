import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { ShieldCheck, Loader2 } from 'lucide-react';

export const TURNSTILE_SITE_KEY = 
    import.meta.env.VITE_TURNSTILE_SITE_KEY || 
    import.meta.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 
    '';

/**
 * Cloudflare Turnstile CAPTCHA Widget
 * Zero external library dependencies, robust lifecycle handling & dark theme.
 */
export const TurnstileWidget = ({
    onVerify,
    onExpire,
    onError,
    theme = 'dark',
    className = ''
}) => {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const [widgetState, setWidgetState] = useState('loading'); // 'loading' | 'rendered' | 'verified' | 'error'

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            // Safe bypass when site key is not configured
            setWidgetState('idle');
            return;
        }

        let isMounted = true;
        let intervalId = null;

        const renderTurnstile = () => {
            if (!isMounted) return;
            if (window.turnstile && containerRef.current && !widgetIdRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: TURNSTILE_SITE_KEY,
                        theme,
                        language: 'ar',
                        callback: (token) => {
                            if (!isMounted) return;
                            setWidgetState('verified');
                            if (onVerify) onVerify(token);
                        },
                        'expired-callback': () => {
                            if (!isMounted) return;
                            setWidgetState('rendered');
                            if (onExpire) onExpire();
                        },
                        'error-callback': (err) => {
                            console.warn('[Turnstile] Challenge error/failed:', err);
                            if (!isMounted) return;
                            setWidgetState('error');
                            if (onError) onError(err);
                        }
                    });
                    setWidgetState('rendered');
                    if (intervalId) clearInterval(intervalId);
                } catch (e) {
                    console.error('[Turnstile] Render exception:', e);
                }
            }
        };

        // If turnstile script is already available
        if (window.turnstile) {
            renderTurnstile();
        } else {
            intervalId = setInterval(() => {
                if (window.turnstile) {
                    renderTurnstile();
                }
            }, 100);
        }

        return () => {
            isMounted = false;
            if (intervalId) clearInterval(intervalId);
            if (window.turnstile && widgetIdRef.current) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // ignore cleanup error
                }
                widgetIdRef.current = null;
            }
        };
    }, [theme, onVerify, onExpire, onError]);

    if (!TURNSTILE_SITE_KEY) {
        return null;
    }

    return (
        <div className={`my-4 flex flex-col items-center justify-center ${className}`}>
            <div className="relative min-h-[65px] min-w-[300px] flex items-center justify-center rounded-2xl bg-dark-950/40 border border-white/10 p-1.5 shadow-inner">
                {widgetState === 'loading' && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 text-slate-400 text-xs font-bold animate-pulse">
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>جاري تحميل التحقق الأمني...</span>
                    </div>
                )}
                <div ref={containerRef} className="turnstile-wrapper" />
            </div>
            {widgetState === 'verified' && (
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold mt-1.5 animate-in fade-in">
                    <ShieldCheck size={14} />
                    <span>تم التحقق الأمني بنجاح</span>
                </div>
            )}
        </div>
    );
};

TurnstileWidget.propTypes = {
    onVerify: PropTypes.func.isRequired,
    onExpire: PropTypes.func,
    onError: PropTypes.func,
    theme: PropTypes.string,
    className: PropTypes.string
};

export default TurnstileWidget;
