import React from 'react'
import { Image, View, Text, StyleSheet, Pressable } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StackParams } from '../../App';
import SettingItem from '../components/SettingCategoryItem';

import { dummyUsers } from '../mockData/Users';

const profilePicture = require('../assets/avatar-big.png');

const ProfileScreen = ({route}: any) => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const userId = route.params.userId;
    const user = dummyUsers.filter((user) => user.userID === userId);

    return (
        <View style={styles.mainContainer}>
            <Image style={styles.profilePicture} source={profilePicture} />
            <Text style={styles.name}>{user[0].displayName ? user[0].displayName : user[0].userName}</Text>
            <View style={styles.settingsContainer}>
                <Pressable onPress={() => {navigation.navigate('AccountSettings')}}>
                    <SettingItem category='Account' description='Security notifications' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('PrivacySettings')}}>
                    <SettingItem category='Privacy' description='Block contacts, dissapearing messages' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('NotificationSettings')}}>
                    <SettingItem category='Notifications' description='Message sound' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('ChatSettings')}}>
                    <SettingItem category='Chats' description='Theme, wallpaper' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('AccountSettings')}}>
                    <SettingItem category='Setting Category' description='Type of setting' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('AccountSettings')}}>
                    <SettingItem category='Setting Category' description='Type of setting' />
                </Pressable>
                <Pressable onPress={() => {navigation.navigate('AccountSettings')}}>
                    <SettingItem category='Setting Category' description='Type of setting' />
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        paddingTop: '15%',
        paddingHorizontal: '15%',
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    profilePicture: {

    },
    name: {
        fontSize: 18,
        color: '#594EFF',
        fontWeight: 'bold',
        paddingBottom: '20%',
    },
    settingsContainer: {
        width: '100%',
        alignItems: 'flex-start',
    }
})

export default ProfileScreen;