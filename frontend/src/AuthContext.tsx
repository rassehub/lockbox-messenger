import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { User } from "./types/User";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthService } from "./services/auth";

type AuthContextType = {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    loading: boolean;
    loadStoredAuth: () => Promise<void>;
    handleAuthentication: (phonenumber: string, password: string) => Promise<boolean>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const isAuthenticated = !!token && !!user;

    const loadStoredAuth = useCallback(async () => {
        try {
            const [storedToken, storedUser] = await Promise.all([
                AsyncStorage.getItem('authToken'),
                AsyncStorage.getItem('userData'),
            ]);

            if(storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStoredAuth();
    }, [loadStoredAuth]);

    const handleAuthentication = async (phonenumber: string, password: string) => {
        try {
            setLoading(true);

            // TEMP
            if(!phonenumber.trim() || !password.trim()) {
                return false
            }

            const mockToken = `temp-token-${Date.now()}`;
            const mockUser = {
                userID: "temp-user",
                phonenumber: phonenumber.trim(),
                userName: "temp",
                email: "temp@temp.com",
            } as User;

            await Promise.all([
                AsyncStorage.setItem("authToken", mockToken),
                AsyncStorage.setItem("userData", JSON.stringify(mockUser)),
            ])

            setToken(mockToken);
            setUser(mockUser);
            console.log("Phone number: ", phonenumber, " Password: ", password);
            return true;
        } catch {
            return false;
        } finally {
            setLoading(false);
        }
    };

    const logout = async () => {
        await Promise.all([
            AsyncStorage.removeItem("authToken"),
            AsyncStorage.removeItem("userData"),
            console.log('logout')
        ]);
        setToken(null);
        setUser(null);
    };
    
    return(
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, loadStoredAuth, handleAuthentication, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthentication = (): AuthContextType => {
    const context = useContext(AuthContext);
    if(!context) {
        throw new Error('useAuthentication must be used within a AuthProvider');
    }
    return context;
}