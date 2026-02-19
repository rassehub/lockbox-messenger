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
const activeBackground = require('../assets/active-background.png');
const activeBackgroundDark = require('../assets/active-background-dark.png');

const NavBar = () => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()

    const [selected, setSelected] = useState('home');

    const {width} = Dimensions.get('window');
    const positions = [
        ((width / 2) / 2) - 50.5,
        ((width / 2) / 2) + 146,
    ];
    console.log(positions);

    const animated = useRef(new Animated.Value(0)).current;
    const homeBottom = useRef(new Animated.Value(25)).current;
    const profileBottom = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.spring(animated, {
            toValue: selected === 'home' ? positions[0] : positions[1],
            useNativeDriver: true,
        }).start();

        Animated.spring(homeBottom, {
            toValue: selected === 'home' ? 25 : 0,
            useNativeDriver: false,
        }).start();

        Animated.spring(profileBottom, {
            toValue: selected === 'profile' ? 25 : 0,
            useNativeDriver: false,
        }).start();
    }, [selected]);

    return (
        <View>
            <View style={styles.navBar}>
                <Animated.Image 
                    style={[
                        styles.activeBackground,
                        { transform: [{ translateX: animated }] }
                    ]} 
                    source={isDarkTheme ? activeBackgroundDark : activeBackground} 
                />
                <View style={styles.navItems}>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => {
                            setSelected('home');
                            navigation.navigate('Home');
                        }}>
                        <Animated.Image style={{bottom: homeBottom}} source={chat} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => {
                            setSelected('profile');
                            navigation.navigate('Profile', {
                                userId: 'tttt',
                            });
                        }}>
                        <Animated.Image style={{bottom: profileBottom}} source={profile} />
                    </TouchableOpacity>  
                </View> 
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    navBar: {
        
        backgroundColor: '#A8A5FF',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    activeBackground: {
        position: 'absolute',
    },
    navItems: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',

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
        borderTopLeftRadius: 15, 
    },
    backgroundView: {
        borderBottomLeftRadius: '50%',
        borderBottomRightRadius: '50%',
        width: '18%',
        height: 60,
        position: 'absolute',
        zIndex: 20,
    },
    iconContainerView: {
        width: '30%',
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
        borderTopRightRadius: 15, 
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