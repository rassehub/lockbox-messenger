import { StyleSheet, Text, View } from "react-native";
import Switch from "./Switch";
import { useTheme } from "../ThemeContext";

type SwitchSettingProps = {
    initialState: boolean;
    settingText: string;
    onHandlePressed: () => boolean;
}

const SwitchSetting = ({ initialState, settingText, onHandlePressed }: SwitchSettingProps) => {
    const { isDarkTheme } = useTheme();

    return(
        <View style={styles.mainContainer}>
            <Text style={[styles.settingText, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{settingText}</Text>
            <Switch initialState={initialState} onHandlePressed={onHandlePressed}/>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flexDirection: 'row',
        width: '100%',
        alignItems: 'center',
        paddingTop: '5%',
    },
    settingText: {
        width: '80%',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SwitchSetting;