import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

const chat = require('../assets/chat.png');
const profile = require('../assets/profile.png');

const NavBar = () => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()
    return (
        <View style={styles.navBar}>
            <TouchableOpacity 
                style={styles.navItem} 
                onPress={() => {
                    navigation.navigate('Home')
                }}>
                <Image source={chat} />
            </TouchableOpacity>

            <TouchableOpacity 
                style={styles.navItem}
                onPress={() => {
                    navigation.navigate('Profile')
                }}>
                <Image source={profile} />
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    navBar: {
        flexDirection: 'row',
        backgroundColor: '#A8A5FF',
        width: '100%',
        position: 'absolute',
        bottom: 0,
    },
    navItem: {
        width: '50%',
        alignItems: 'center',
        padding: '5%',
    },
})

export default NavBar;