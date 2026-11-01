import { useEffect, useState } from 'react';
import { authToken } from '@/lib/auth';

export function useAuth() {
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;

        // if the jwt token gets updated in the extension storage (by log out or log in) automatically update the token state
        const unwatch = authToken.watch((newToken) => {
            if (active) {
                setToken(newToken ?? null);
                setLoading(false);
            }
        })

        // get token value initially
        authToken.getValue().then((value) => {
            if (active) {
                setToken(value ?? null);
                setLoading(false);
            }
        });

        return () => {
            active = false;
            unwatch();
        };
    }, []);

    return {
        token, isAuthenticated: !!token, loading
    };
}