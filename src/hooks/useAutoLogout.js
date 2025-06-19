import { useEffect } from 'react';

export function useAutoLogout(logout, navigate, timeoutMinutes = 10) {
    useEffect(() => {
        let timeout;

        const resetTimer = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                logout();
                navigate('/');
            }, timeoutMinutes * 60 * 1000);
        };

        window.addEventListener('mousemove', resetTimer);
        window.addEventListener('keydown', resetTimer);
        resetTimer();

        return () => {
            window.removeEventListener('mousemove', resetTimer);
            window.removeEventListener('keydown', resetTimer);
            clearTimeout(timeout);
        };
    }, [logout, navigate, timeoutMinutes]);
}
