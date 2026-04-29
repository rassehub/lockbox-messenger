import { Image, StyleSheet, View, Text } from "react-native";
import { useState } from "react";
import SwitchSetting from "../components/SwitchSetting";
import DropdownRadio from "../components/DropdownRadio";
import { dummyContacts } from "../mockData/Contatcs";
import { useTheme } from "../ThemeContext";

const profilePicture = require('../assets/avatar-big.png');
const profilePictureDark = require('../assets/avatar-big-dark.png')

const FriendProfileScreen = ({route}: any) => {
    const { isDarkTheme } = useTheme();
    const senderId = route.params.userId;
    const contact = dummyContacts.filter(
        (contact) => contact.userId === senderId
    );

    const formConfiguration = {
        fields: [
            {
                name: "disapearingMessages",
                type: "radio",
                options: [
                    { label: "Never", value: "never" },
                    { label: "After reading", value: "afterReading" },
                    { label: "In 24 hours", value: "in24hours" },
                ]
            }
        ]
    }
    
    const initialValues = {
        disapearingMessages: "never",
    }
    
    const handleSubmit = () => {
        console.log("handle submit");
    }

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
            <Image source={isDarkTheme ? profilePictureDark : profilePicture}/>
            <Text style={[styles.name, {color: isDarkTheme ? '#A8A5FF' : '#594EFF'}]}>{contact[0].name}</Text>
            <View>
                <DropdownRadio 
                    dropdownTitle="Disappearing messages"
                    formConfiguration={formConfiguration}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                />
                <SwitchSetting
                    initialState={false}
                    settingText={"Setting switch on"}
                    onHandlePressed={handleSwitch}
                />
                <SwitchSetting
                    initialState={false}
                    settingText={"Setting switch off"}
                    onHandlePressed={handleSecondSwitch}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        alignItems: 'center',
        flex: 1,
    },
    name: {
        fontSize: 18,
        color: '#594EFF',
        fontWeight: 'bold',
    },
})

export default FriendProfileScreen;