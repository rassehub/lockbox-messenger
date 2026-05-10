import { createContext, useContext, useEffect, useState } from "react";
import { bootstrap, AppSession, PartialSession } from "./bootstrap";

const SERVER_URL = 'https://ydinmarsu.dns.army';

type SessionContextType = {
    session: AppSession | null;
    partial: PartialSession | null;
    loading: boolean;
    setSession: (session: AppSession) => void;
    clearSession: () => void;
    getNewPartial: () => Promise<PartialSession | null>;
};

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<AppSession | null>(null);
    const [partial, setPartial] = useState<PartialSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        bootstrap(SERVER_URL).then((result) => {
            if('completeInit' in result) {
                setPartial(result);
            } else {
                setSession(result);
            }
        }).finally(() => setLoading(false));
    }, []);

    const clearSession = () => {
        setSession(null);
        setPartial(null);
    };

    const getNewPartial = async (): Promise<PartialSession | null> => {
        try {
            const result = await bootstrap(SERVER_URL);
            if('completeInit' in result) {
                setPartial(result)
                return result;
            } else {
                setSession(result);
                return null;
            }
        } catch(err) {
            console.log('getNewPartial error', err);
            return null;
        }
    }

    return(
        <SessionContext.Provider value={{ session, partial, loading, setSession, clearSession, getNewPartial }}>
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if(!context) {
        throw new Error('useSession must be used within SessionProvider');
    }
    return context;
};