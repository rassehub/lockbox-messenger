import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react"
import { useSession } from "./SessionContext";
import { ChatStorage } from "./chat/chatStorage";

type AuthContextType = {
    userId: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    chatStorage: ChatStorage | undefined;
    login: (phoneNumber: string, password: string) => Promise<boolean>;
    register: (username: string, phoneNumber: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, partial, loading, setSession, clearSession, getNewPartial } = useSession();
    const [chatStorage, setChatStorage] = useState<ChatStorage>();
    
    const login = async (phoneNumber: string, password: string) : Promise<boolean> => {
        let currPartial = partial;
        if(!currPartial) {
            currPartial = await getNewPartial();
        }
        if(!currPartial) return false;
        try {
            const userId = await currPartial.auth.login(phoneNumber, password);
            const fullSession = await currPartial.completeInit(userId);
            setSession(fullSession);
            setChatStorage(fullSession.chatStorage);

            return true;
        } catch {
            return false;
        }
    };

    const register = async (username: string, phoneNumber: string, password: string): Promise<boolean> => {
        if(!partial) return false;
        try {
            const userId = await partial.auth.register(username, phoneNumber, password);
            return true;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        if(!session) return;
        await session.auth.logout();
        clearSession();
    };
    
    return(
        <AuthContext.Provider value={{ 
            userId: session?.userId ?? null,  
            isAuthenticated: session !== null, 
            loading, 
            chatStorage,
            login,
            register,
            logout,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthentication = (): AuthContextType => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error('useAuthentication must be used within AuthProvider');
    }
    return context;
}