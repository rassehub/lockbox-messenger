import { createContext, useCallback, useContext, useEffect, useState, useRef } from "react"
/*import { User } from "./types/User";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "src/auth/auth";
import { HttpClient } from "src/http/HttpClient";
import { Alert } from "react-native";
import { useHttpClient } from "./ClientContext";*/
import { useSession } from "./SessionContext";

type AuthContextType = {
    //user: User | null;
    userId: string | null;
    //token: string | undefined;
    isAuthenticated: boolean;
    loading: boolean;
    //loadStoredAuth: () => Promise<void>;
    //handleAuthentication: (phonenumber: string, password: string) => Promise<boolean>;
    login: (phoneNumber: string, password: string) => Promise<boolean>;
    register: (username: string, phoneNumber: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { session, partial, loading, setSession, clearSession } = useSession();
    
    const login = async (phoneNumber: string, password: string) : Promise<boolean> => {
        if(!partial) return false;
        try {
            const userId = await partial.auth.login(phoneNumber, password);
            const fullSession = await partial.completeInit(userId);
            return true;
        } catch {
            return false;
        }
    };

    const register = async (username: string, phoneNumber: string, password: string): Promise<boolean> => {
        if(!partial) return false;
        try {
            const userId = await partial.auth.register(username, phoneNumber, password);
            const fullSession = await partial.completeInit(userId);
            setSession(fullSession);
            return true;
        } catch {
            return false;
        }
    };

    const logout = async () => {
        if(!session) return;
        await session.auth.logout();
        clearSession();
        /*await Promise.all([
            AsyncStorage.removeItem("authToken"),
            AsyncStorage.removeItem("userData"),
            console.log('logout')
        ]);
        setToken(undefined);
        setUser(undefined);*/
    };
    
    return(
        <AuthContext.Provider value={{ 
            userId: session?.userId ?? null,  
            isAuthenticated: session !== null, 
            loading, 
            login,
            register,
            logout 
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