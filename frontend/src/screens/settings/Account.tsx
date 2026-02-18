import { Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../ThemeContext";
import { useAuthentication } from "../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../../App";
import { useState } from "react";

const logout = require('../../assets/logout.png');
const logoutDark = require('../../assets/logout-dark.png');

const trash = require('../../assets/delete.png');
const trashDark = require('../../assets/delete-dark.png');

const AccountSettings = () => {
    const { isDarkTheme } = useTheme();
    const { logout } = useAuthentication();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    const [username, onUsernameChanged] = useState('');
    const [email, onEmailChanged] = useState('');

    const handleLogout = async () => {
        await logout();
        navigation.navigate('Login');
    }

    return(
        <View style={styles.mainContainer}>
            <Text style={styles.categoryText}>Account Settings</Text>

            <TextInput
                style={[styles.base, styles.settingText]}
                onChangeText={onUsernameChanged}
                value={username}
                placeholder="Username"
                placeholderTextColor={'#A8A5FF'}
                
            />

            <TextInput
                style={[styles.base, styles.settingText]}
                onChangeText={onEmailChanged}
                value={email}
                placeholder="Email"
                placeholderTextColor={'#A8A5FF'}
                
            />

            <Text style={styles.categoryText}>Danger zone</Text>

            <Pressable 
                onPress={handleLogout}
                style={styles.base}
            >
                <Text style={styles.settingText}>Logout</Text>
                <Image style={styles.settingIcon} source={isDarkTheme ? logoutDark : logout} />
            </Pressable>

            <Pressable style={styles.base}>
                <Text style={styles.settingText}>Delete Account</Text>
                <Image style={styles.settingIcon} source={isDarkTheme ? trashDark : trash}/>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingTop: '5%',
        paddingHorizontal: '5%',
    },
    categoryText: {
        color: '#A8A5FF',
        fontSize: 14,
        paddingTop: '10%',
    },
    base: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '5%',
    },
    settingText: {
        color: '#A8A5FF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    settingIcon: {
        marginTop: '2%',
        width: 24,
        height: 24,
    },
});

export default AccountSettings;