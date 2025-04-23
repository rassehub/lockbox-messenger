import { Image, StyleSheet, View, Text, Alert } from "react-native";
import { dummyContacts } from "../mockData/Contatcs";
import SwitchSetting from "../components/SwitchSetting";
import { useState } from "react";

const profilePicture = require('../assets/avatar-big.png');

const FriendProfileScreen = ({route}: any) => {
    const senderId = route.params.userId;
    const contact = dummyContacts.filter(
        (contact) => contact.userId === senderId
    );

    const [switchState, setSwitchState] = useState(false);
    const [secondSwitchState, setSecondSwitchState] = useState(false);

    const handleSwitch = () => {
        console.log("Switch turned!");
        const newState = !switchState;
        setSwitchState(newState);
        return newState;
    };

    const handleSecondSwitch = () => {
        console.log("Switch turned!");
        const newState = !secondSwitchState;
        setSecondSwitchState(newState);
        return newState;
    };

    return (
        <View style={styles.mainContainer}>
            <Image style={styles.profilePicture} source={profilePicture}/>
            <Text style={styles.name}>{contact[0].name}</Text>
            <View>
                <SwitchSetting
                    settingText={"Setting switch on"}
                    onHandlePressed={handleSwitch}
                />
                <SwitchSetting
                    settingText={"Setting switch off"}
                    onHandlePressed={handleSecondSwitch}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        padding: '5%',
        alignItems: 'center',
    },
    profilePicture: {
        
    },
    name: {
        fontSize: 18,
        color: '#594EFF',
    },
})

export default FriendProfileScreen;