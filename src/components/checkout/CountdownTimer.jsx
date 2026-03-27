import React, { useEffect, useState } from 'react';
import { Timer } from 'lucide-react';

const CountdownTimer = ({ initialSeconds = 600, onExpire }) => {
    const [seconds, setSeconds] = useState(initialSeconds);

    useEffect(() => {
        if (seconds <= 0) {
            onExpire && onExpire();
            return;
        }

        const timer = setInterval(() => {
            setSeconds(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [seconds, onExpire]);

    const formatTime = (totalSeconds) => {
        const m = Math.floor(totalSeconds / 60);
        const s = totalSeconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex items-center justify-between text-yellow-500 bg-yellow-500/10 p-4 rounded-xl border border-yellow-500/20 mb-6">
            <div className="flex items-center gap-2">
                <Timer size={20} />
                <span className="font-bold text-sm">مهلة الدفع المتوقعة</span>
            </div>
            <span className="font-mono font-bold text-2xl tracking-wider">
                {formatTime(seconds)}
            </span>
        </div>
    );
};

export default CountdownTimer;
