import { Animated, Dimensions, View, StyleSheet, TouchableOpacity, Keyboard, Platform } from "react-native";
import { useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useTheme } from "../ThemeContext";

const chat = require('../assets/chat.png');
const profile = require('../assets/profile.png');
const activeBackground = require('../assets/active-background.png');
const activeBackgroundDark = require('../assets/active-background-dark.png');

const NavBar = () => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()

    const [selected, setSelected] = useState('home');
    const [keyboardOpen, setKeyboardOpen] = useState(false);

    const navTranslateY = useRef(new Animated.Value(0)).current;
    const navOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

        const showSub = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
        const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));

        return () => {
            showSub.remove();
            hideSub.remove();
        }
    }, []);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(navTranslateY, {
                toValue: keyboardOpen ? 120 : 0,
                duration: 220,
                useNativeDriver: true,
            }),
            Animated.timing(navOpacity, {
                toValue: keyboardOpen ? 0 : 1,
                duration: 180,
                useNativeDriver: true,
            })
        ]).start();
    }, [keyboardOpen, navTranslateY, navOpacity]);

    const {width} = Dimensions.get('window');
    const positions = [
        ((width / 2) / 2) - 50.5,
        ((width / 2) / 2) + 146,
    ];

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
            <Animated.View
                pointerEvents={keyboardOpen ? "none" : "auto"}
                style={[
                    styles.navBar,
                    {
                        opacity: navOpacity,
                        transform: [{ translateY: navTranslateY }],
                    },
                ]}
            >
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
                        <Animated.Image style={{ bottom: homeBottom }} source={chat} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.navItem}
                        onPress={() => {
                            setSelected('profile');
                            navigation.navigate('Profile', {
                                userId: 'tttt',
                            });
                        }}>
                        <Animated.Image style={{ bottom: profileBottom }} source={profile} />
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

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
})

export default NavBar;