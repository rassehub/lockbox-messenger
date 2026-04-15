import { StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import SwitchSetting from "../../components/SwitchSetting";

const NotificationSettings = () => {
    const [getNotifications, setGetNotifications] = useState(true)
    const handleNotificationSetting = () => {
        setGetNotifications(!getNotifications);
        console.log(getNotifications);
        return getNotifications;
    }

    return(
        <View>
            <Text style={styles.categoryText}>Notification Settings</Text>
            <SwitchSetting 
                initialState={true} 
                settingText="Get notifications" 
                onHandlePressed={handleNotificationSetting} 
            />
        </View>
    )
}

const styles = StyleSheet.create({
    categoryText: {
        color: '#A8A5FF',
        fontSize: 14,
        paddingTop: '10%',
    },
});

export default NotificationSettings;