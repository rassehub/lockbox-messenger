import { createContext, useContext, useEffect, useState } from "react";
import { bootstrap, AppSession, PartialSession } from "./bootstrap";

const SERVER_URL = 'https://';

type SessionContextType = {
    session: AppSession | null;
    partial: PartialSession | null;
    loading: boolean;
    setSession: (session: AppSession) => void;
    clearSession: () => void;
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

    return(
        <SessionContext.Provider value={{ session, partial, loading, setSession, clearSession }}>
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