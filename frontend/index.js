/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { ThemeProvider } from './src/ThemeContext';
import { AuthProvider } from './src/AuthContext';
import { SessionProvider } from './src/SessionContext';
import { ChatProvider } from './src/ChatContext';

const Root = () => (
    <SessionProvider>
        <AuthProvider>
            <ChatProvider>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </ChatProvider>
        </AuthProvider>
    </SessionProvider>
);

AppRegistry.registerComponent(appName, () => Root);
