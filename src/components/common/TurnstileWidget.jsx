import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

export const TURNSTILE_SITE_KEY = 
    import.meta.env.VITE_TURNSTILE_SITE_KEY || 
    import.meta.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || 
    '';

/**
 * Cloudflare Turnstile CAPTCHA Widget
 * Zero external library dependencies, lazy-loads official Cloudflare script.
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

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY) {
            // When site key is not configured, inform onVerify with null (safe bypass)
            return;
        }

        let isMounted = true;

        // Ensure official Turnstile script is loaded in <head>
        if (!window.turnstile && !document.getElementById('cf-turnstile-script')) {
            const script = document.createElement('script');
            script.id = 'cf-turnstile-script';
            script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }

        const checkAndRender = () => {
            if (!isMounted) return;
            if (window.turnstile && containerRef.current && !widgetIdRef.current) {
                try {
                    widgetIdRef.current = window.turnstile.render(containerRef.current, {
                        sitekey: TURNSTILE_SITE_KEY,
                        theme,
                        language: 'ar',
                        callback: (token) => {
                            if (isMounted && onVerify) onVerify(token);
                        },
                        'expired-callback': () => {
                            if (isMounted && onExpire) onExpire();
                        },
                        'error-callback': (err) => {
                            console.warn('[Turnstile] Challenge error:', err);
                            if (isMounted && onError) onError(err);
                        }
                    });
                } catch (e) {
                    console.error('[Turnstile] Render exception:', e);
                }
            }
        };

        const interval = setInterval(checkAndRender, 100);

        return () => {
            isMounted = false;
            clearInterval(interval);
            if (window.turnstile && widgetIdRef.current) {
                try {
                    window.turnstile.remove(widgetIdRef.current);
                } catch {
                    // ignore
                }
                widgetIdRef.current = null;
            }
        };
    }, [onVerify, onExpire, onError, theme]);

    if (!TURNSTILE_SITE_KEY) return null;

    return (
        <div className={`my-3 flex justify-center items-center ${className}`}>
            <div ref={containerRef} className="rounded-2xl overflow-hidden border border-white/10 shadow-lg" />
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
