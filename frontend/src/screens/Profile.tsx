import { Image, View, Text, StyleSheet } from 'react-native'
import React from 'react'
import { dummyUsers } from '../mockData/Users';
import SettingItem from '../components/SettingItem';

const profilePicture = require('../assets/avatar-big.png');

const ProfileScreen = ({route}: any) => {
    const userId = route.params.userId;
    const user = dummyUsers.filter((user) => user.userID === userId);
    console.log(user);

    return (
        <View style={styles.mainContainer}>
            <Image style={styles.profilePicture} source={profilePicture} />
            <Text style={styles.name}>{user[0].displayName ? user[0].displayName : user[0].userName}</Text>
            <SettingItem category='Account' description='Security notifications' />
            <SettingItem category='Privacy' description='Block contacts, dissapearing messages' />
            <SettingItem category='Notifications' description='Message sound' />
            <SettingItem category='Chats' description='Theme, wallpaper' />
            <SettingItem category='Setting Category' description='Type of setting' />
            <SettingItem category='Setting Category' description='Type of setting' />
            <SettingItem category='Setting Category' description='Type of setting' />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
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
})

export default ProfileScreen;