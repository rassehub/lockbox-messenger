import { createContext, useContext, useState } from "react"

type AuthContextType = {
    isAuthenticated: boolean;
    handleAuthentication: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const handleAuthentication = () => {
        setIsAuthenticated((prevAuthState) => !prevAuthState);
        return !isAuthenticated ? true : false;
    }
    
    return(
        <AuthContext.Provider value={{ isAuthenticated, handleAuthentication }}>
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