import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../ThemeContext";
import SwitchSetting from "../../components/SwitchSetting";

const ChatSettings = () => {
    const { isDarkTheme, toggleTheme } = useTheme();

    return(
        <View style={styles.mainContainer}>
            <Text style={styles.categoryText}>Chat Settings</Text>
            <SwitchSetting 
                initialState={isDarkTheme}
                settingText='Dark theme'
                onHandlePressed={toggleTheme}
            />
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
});

export default ChatSettings;