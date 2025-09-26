import { createContext, useContext, useState } from "react";
import { useColorScheme } from "react-native";

type ThemeContextType = {
    isDarkTheme: boolean;
    toggleTheme: () => boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const theme = useColorScheme();
    const [isDarkTheme, setIsDarkTheme] = useState(theme === 'dark');

    const toggleTheme = () => {
        setIsDarkTheme((prevTheme) => !prevTheme);
        return !isDarkTheme ? true : false;
    }

    return(
        <ThemeContext.Provider value={{ isDarkTheme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if(!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}