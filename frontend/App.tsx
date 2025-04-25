import React from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/Home';
import ProfileScreen from './src/screens/Profile';
import NavBar from './src/components/NavBar';
import ChatScreen from './src/screens/Chat';
import NewChatScreen from './src/screens/NewChat';
import FriendProfileScreen from './src/screens/FriendProfile';
import AccountSettings from './src/screens/settings/Account';
import PrivacySettings from './src/screens/settings/Privacy';
import NotificationSettings from './src/screens/settings/Notifications';
import ChatSettings from './src/screens/settings/Chats';
import { dummyContacts } from './src/mockData/Contatcs';
import { useTheme } from './src/ThemeContext';

export type StackParams = {
  Home: undefined;
  Profile: {userId: string};
  Chat: {chatId: string};
  NewChat: undefined;
  FriendProfile: {userId: string};
  AccountSettings: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  ChatSettings: undefined;
}

const Stack = createNativeStackNavigator<StackParams>();

function App(): React.JSX.Element {
  const { isDarkTheme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName='Home'
        screenOptions={{
          headerStyle: { backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF' },
          headerTitleStyle: { color: isDarkTheme ? '#A8A5FF' : '#594EFF' },
          headerTintColor: isDarkTheme ? '#A8A5FF' : '#594EFF',
          contentStyle: {
            backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF',
            paddingHorizontal: '8%',
            paddingVertical: '5%',
          }
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Chat"
          component={ChatScreen}
          options={({ navigation, route }) => ({
            headerTitle: () => {
              const { chatId } = route.params;
              const userId = dummyContacts.find(contact => contact.chatId === chatId)?.userId || 'Unknown';
              const name = dummyContacts.find(contact => contact.chatId === chatId)?.name || 'Unknown';

              return (
                <TouchableOpacity
                  onPress={() => {
                    navigation.navigate('FriendProfile', { userId });
                  }}
                >
                  <Text style={{ color: isDarkTheme ? '#A8A5FF' : '#594EFF', fontWeight: 'bold', fontSize: 18 }}>
                    {name}
                  </Text>
                </TouchableOpacity>
              );
            },
          })}
        />
        <Stack.Screen
          name="NewChat"
          component={NewChatScreen}
          options={{ headerTitle: "New Chat" }}
        />
        <Stack.Screen
          name='FriendProfile'
          component={FriendProfileScreen}
          options={({ route }) => ({
            headerTitle: () => {
              const { userId } = route.params;
              const name = dummyContacts.find(contact => contact.userId === userId)?.name || 'Unknown';

              return (
                <Text style={{ color: isDarkTheme ? '#A8A5FF' : '#594EFF', fontWeight: 'bold', fontSize: 18 }}>{name}</Text>
              );
            }
          })}
        />
        <Stack.Screen
          name='AccountSettings'
          component={AccountSettings}
          options={{ headerTitle: "Account settings" }}
        />
        <Stack.Screen
          name='PrivacySettings'
          component={PrivacySettings}
          options={{ headerTitle: "Privacy settings" }}
        />
        <Stack.Screen
          name='NotificationSettings'
          component={NotificationSettings}
          options={{ headerTitle: "Notification settings" }}
        />
        <Stack.Screen
          name='ChatSettings'
          component={ChatSettings}
          options={{ headerTitle: "Chat settings" }}
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
