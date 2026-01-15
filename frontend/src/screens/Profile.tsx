import React, { useCallback, useEffect, useState } from 'react'
import { Image, View, Text, StyleSheet, Pressable, Modal, FlatList, ScrollView, Platform, PermissionsAndroid } from 'react-native'
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { StackParams } from '../../App';
import { CameraOptions, ImageLibraryOptions, launchCamera, launchImageLibrary } from 'react-native-image-picker';

import SettingItem from '../components/SettingCategoryItem';

import { dummyUsers } from '../mockData/Users';
import { useTheme } from '../ThemeContext';

const profPic = require('../assets/profile-pic.jpg');
const profilePicture = require('../assets/avatar-big.png');
const profilePictureDark = require('../assets/avatar-big-dark.png');

const ProfileScreen = ({route}: any) => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [profilePicModalVisible, setProfilePicModalVisible] = useState(false);    
    const [selectedImage, setSelectedImage] = useState<any>(profilePictureDark);
    const [response, setResponse] = useState<any>(null);

    const userId = route.params.userId;
    const user = dummyUsers.filter((user) => user.userID === userId);

    const getPermissions = (type : 'capture' | 'library') => {
        console.log(type);
        const granted = requestAndroidPermissions(type);
        console.log(granted);
        if(!granted) {
            console.warn('permission not granted');
            return;
        }
    }

    const onButtonPress = useCallback(async (type: 'capture' | 'library', options : CameraOptions | ImageLibraryOptions) => {
       getPermissions(type);
       console.log(getPermissions);

        const cb = (res: any) => {
            console.log('image-picker response', res);
            setResponse(res);
            if(res?.assets) {
                console.log(res.assets[0].uri);
                setSelectedImage(res.assets[0].uri);
                console.log(selectedImage);
            }
            setProfilePicModalVisible(false);
            console.log(res.assets[0].uri);
            console.log(selectedImage);
        };

        if(type === 'capture') {
            launchCamera(options, cb);
        } else {
            launchImageLibrary(options, cb);
        }
    }, []);

    const requestAndroidPermissions = async (type: 'capture' | 'library') => {
        if(Platform.OS !== 'android') return true;
        try {
            if(type === 'capture') {
                const camera = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
                const write = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
                return camera === PermissionsAndroid.RESULTS.GRANTED && write === PermissionsAndroid.RESULTS.GRANTED;
            } else {
                const read = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
                return read === PermissionsAndroid.RESULTS.GRANTED;
            }
        } catch(e) {
            console.warn('permission request error ', e);
            return false;
        }
    }

    return (
        <View style={styles.mainContainer}>
            <Modal
                animationType='slide'
                transparent={true}
                visible={profilePicModalVisible}
                onRequestClose={() => {
                    setProfilePicModalVisible(!profilePicModalVisible);
                }}>
                <View style={styles.profilePictureModal} onTouchEnd={() => setProfilePicModalVisible(false)}>
                    <View style={styles.buttonContainer}>
                        {actions.map(({title, type, options}) => {
                            return (
                                <Pressable 
                                    style={styles.button}
                                    key={title}
                                    onPress={() => onButtonPress(type, options)}>
                                    <Text style={[
                                        styles.buttonText,
                                        { color: isDarkTheme ? '#161616' : '#FFFFFF'}
                                    ]}>{title}</Text>
                                </Pressable>
                            );
                        })}
                    </View>
                </View>
            </Modal>
            
            <Pressable
                onPress={() => {
                    setProfilePicModalVisible(true);
                }}>
                <View style={styles.profilePictureContainer}>
                    <Image style={styles.profilePicture} source={typeof selectedImage === 'string' ? { uri: selectedImage } : selectedImage} />
                </View>
            </Pressable>
            
            <Text style={[styles.name, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{user[0].displayName ? user[0].displayName : user[0].userName}</Text>
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
            </View>
        </View>
    )
}

interface Action {
    title: string;
    type: 'capture' | 'library';
    options: CameraOptions | ImageLibraryOptions;
}

const actions: Action[] = [
    {
        title: 'Take Image',
        type: 'capture',
        options: {
            saveToPhotos: true,
            mediaType: 'photo',
            includeBase64: false,
        },
    },
    {
        title: 'Select Image',
        type: 'library',
        options: {
            selectionLimit: 0,
            mediaType: 'photo',
            includeBase64: false,
        },
    },
]

const styles = StyleSheet.create({
    mainContainer: {
        width: '100%',
        paddingTop: '10%',
        paddingHorizontal: '5%',
        alignItems: 'center',
        flex: 1,
    },
    profilePictureModal: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '60%',
        backgroundColor: '#1C1C1C',
        paddingTop: 30,
        paddingBottom: 30,
        borderRadius: 20,
        shadowOffset: {
          width: -10,
          height: 4,
        },
        shadowOpacity: 0.5,
        shadowRadius: 4,
        elevation: 5,
    },
    button: {
        width: 120,
        backgroundColor: '#A8A5FF',
        borderRadius: 20,
        marginTop: 10,
        marginBottom: 10,
        paddingVertical: 10,
        elevation: 2,
        textAlign: 'center',
    },
    buttonText: {
        textAlign: 'center',
        fontWeight: 'bold',
    },
    buttonStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    profilePictureContainer: {
        borderRadius: '50%',
        width: 160,
        height: 160,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
    },
    profilePicture: {
        width: 160,
        height: 160,
        resizeMode: 'cover'
    },
    editIcon: {
        position: 'absolute',
        right: 10,
        bottom: 10,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        paddingBottom: '20%',
        paddingTop: 10,
    },
    settingsContainer: {
        width: '100%',
        alignItems: 'flex-start',
    }
})

export default ProfileScreen;