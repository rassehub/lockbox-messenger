/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/AuthContext';

const Root = () => (
    <AuthProvider>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </AuthProvider>
)

AppRegistry.registerComponent(appName, () => Root);
