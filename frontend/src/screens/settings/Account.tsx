import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../ThemeContext";
import { useAuthentication } from "../../AuthContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../../App";

const logout = require('../../assets/logout.png');
const logoutDark = require('../../assets/logout-dark.png');

const trash = require('../../assets/delete.png');
const trashDark = require('../../assets/delete-dark.png');

const AccountSettings = () => {
    const { isDarkTheme } = useTheme();
    const { handleAuthentication } = useAuthentication();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    return(
        <View style={styles.mainContainer}>
            <Text style={styles.categoryText}>Account Settings</Text>
            <Pressable 
                onPress={() => {
                    const logout = handleAuthentication();
                    if (!logout) {
                        navigation.navigate('Login');
                    }
                }}
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
    }
});

export default AccountSettings;