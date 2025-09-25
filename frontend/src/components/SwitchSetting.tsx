import { StyleSheet, Text, View } from "react-native";
import Switch from "./Switch";

type SwitchSettingProps = {
    settingText: string;
    onHandlePressed: () => boolean;
}

const SwitchSetting = ({ settingText, onHandlePressed }: SwitchSettingProps) => {
    return(
        <View style={styles.mainContainer}>
            <Text style={styles.settingText}>{settingText}</Text>
            <Switch onHandlePressed={onHandlePressed}/>
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
        color: '#594EFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SwitchSetting;