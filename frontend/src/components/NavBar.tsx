import { View, StyleSheet, Image, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

const chat = require('../assets/chat.png');
const profile = require('../assets/profile.png');

const NavBar = () => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()

    return (
        <View>
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
                        navigation.navigate('Profile', {
                            userId: 'tttt',
                        })
                    }}>
                    <Image source={profile} />
                </TouchableOpacity>   
            </View>
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
})

export default NavBar;