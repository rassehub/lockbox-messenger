import React from 'react';
import type {PropsWithChildren} from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

import {NavigationContainer} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/Home';
import ProfileScreen from './src/screens/Profile';
import NavBar from './src/components/NavBar';
import ChatScreen from './src/screens/Chat';
import NewChatScreen from './src/screens/NewChat';
import FriendProfileScreen from './src/screens/FriendProfile';

export type StackParams = {
  Home: undefined;
  Profile: {userId: string};
  Chat: {chatId: string};
  NewChat: undefined;
  FriendProfile: {userId: string};
}

const Stack = createNativeStackNavigator<StackParams>();

function App(): React.JSX.Element {

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{headerShown: false}}
        />
        <Stack.Screen 
          name="Chat"
          component={ChatScreen}
          options={{
            headerTitle: 'Name Placeholder',
          }}
        />
        <Stack.Screen 
          name="NewChat"
          component={NewChatScreen}
        />
        <Stack.Screen 
          name='FriendProfile'
          component={FriendProfileScreen}
        />
      </Stack.Navigator>
      <NavBar />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
});

export default App;
