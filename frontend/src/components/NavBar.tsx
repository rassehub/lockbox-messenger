import { Animated, Dimensions, View, StyleSheet, Image, TouchableOpacity } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useTheme } from "../ThemeContext";

const chat = require('../assets/chat.png');
const chatDark = require('../assets/chat-dark-temp.png');
const profile = require('../assets/profile.png');
const profileDark = require('../assets/profile-dark.png');

const NavBar = () => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()

    const [selected, setSelected] = useState('profile');

    const {width} = Dimensions.get('window');
    const positions = [
        ((width / 2) / 2) - 20,
        ((width / 2) / 2) + 122,
    ];

    console.log(positions)

    const animated = useRef(new Animated.Value(0)).current;
    const isMounted = useRef(false);

    useEffect(() => {
        Animated.spring(animated, {
            toValue: selected === 'home' ? positions[0] : positions[1],
            useNativeDriver: true,
        }).start();
        
        console.log('valittu: ', selected);
    }, [selected]);

    return (
        <View style={styles.mainContainer}>
            <View style={[styles.mainView, {backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF'}]}>
                <View style={[
                    styles.roundedView1, 
                    {
                        borderTopRightRadius: 18,
                        width: selected === 'home' ? '20%' : '56.3%',
                    }
                ]}/>

                <View style={[
                    styles.roundedView2,
                    {
                        borderTopLeftRadius: 18,
                        width: selected === 'profile' ? '20%' : '56.4%',
                    }
                ]}/>
            </View>

            <View style={styles.icons}>
                <TouchableOpacity
                    onPress={() => {
                        setSelected('home');
                        navigation.navigate('Home');
                    }}
                    style={[
                        styles.iconContainerView,
                        { bottom: selected === 'home' ? 0 : -20 }
                    ]}
                >
                    <Image source={chat} />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
                        setSelected('profile');
                        navigation.navigate('Profile', {
                            userId: 'tttt',
                        });
                    }}
                    style={[
                        styles.iconContainerView,
                        { bottom: selected === 'profile' ? 0 : -20 }
                    ]}
                >
                    <Image source={profile} />
                </TouchableOpacity>
            </View>
            
            <Animated.View style={[
                styles.backgroundView, 
                {
                    backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF',
                    transform: [{translateX: animated}],
                }
            ]}>
                    
            </Animated.View>

            <View style={[styles.bottomLayer, {alignSelf: selected === 'home' ? 'flex-start' : 'flex-end'}]}></View>
            
        </View>
    )
}

const styles = StyleSheet.create({
    navBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#A8A5FF',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    navItem: {
        width: '50%',
        alignItems: 'center',
        padding: '5%',
    },
    mainContainer: {
        width: '100%',
    },
    mainView: {
        width: '100%',
        height: 80,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    icons: {
        width: '60%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignSelf: 'center',
        position: 'absolute',
        zIndex: 30,
    },
    roundedView1: {
        backgroundColor: '#A8A5FF',
        width: '20%',
        height: 80,
        bottom: -20,
        borderTopLeftRadius: 10, 
    },
    backgroundView: {
        borderBottomLeftRadius: '50%',
        borderBottomRightRadius: '50%',
        width: '24%',
        height: 60,
        position: 'absolute',
        zIndex: 20,
    },
    iconContainerView: {
        width: '40%',
        height: 60,
        borderBottomLeftRadius: '50%',
        borderBottomRightRadius: '50%',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
    },
    roundedView2: {
        backgroundColor: '#A8A5FF',
        height: 80,
        bottom: -20,
        borderTopRightRadius: 10, 
    },
    bottomLayer: {
        position: 'absolute',
        bottom: 0,
        backgroundColor: '#A8A5FF',
        width: '45%',
        height: 45,
        zIndex: 8,
    }
})

export default NavBar;