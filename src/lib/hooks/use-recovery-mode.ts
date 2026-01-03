import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Session, User } from '@supabase/supabase-js';

export function useRecoveryMode() {
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkRecovery = (session: Session | null) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            const accessToken = session?.access_token;
            if (accessToken) {
                try {
                    const base64Url = accessToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const payload = JSON.parse(atob(base64));
                    const amr = payload.amr || [];

                    const isRecovery = Array.isArray(amr) && amr.some((item: any) => {
                        if (typeof item === 'string') return item === 'recovery';
                        if (item && typeof item === 'object') return item.method === 'recovery';
                        return false;
                    });

                    setIsRecoveryMode(isRecovery);
                } catch (e) {
                    setIsRecoveryMode(false);
                }
            } else {
                setIsRecoveryMode(false);
            }
        };

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            checkRecovery(session);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkRecovery(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase.auth]);

    return { isRecoveryMode, user };
}
