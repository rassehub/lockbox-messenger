import { Image, StyleSheet, View, Text, Alert } from "react-native";
import { dummyContacts } from "../mockData/Contatcs";
import SwitchSetting from "../components/SwitchSetting";
import { useState } from "react";
import DropdownRadio from "../components/DropdownRadio";

const profilePicture = require('../assets/avatar-big.png');

const FriendProfileScreen = ({route}: any) => {
    const senderId = route.params.userId;
    const contact = dummyContacts.filter(
        (contact) => contact.userId === senderId
    );
    console.log(contact)

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
            <Image style={styles.profilePicture} source={profilePicture}/>
            <Text style={styles.name}>{contact[0].name}</Text>
            <View>
                <DropdownRadio 
                    dropdownTitle="Disappearing messages"
                    formConfiguration={formConfiguration}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                />
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
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    profilePicture: {
        
    },
    name: {
        fontSize: 18,
        color: '#594EFF',
        fontWeight: 'bold',
    },
})

export default FriendProfileScreen;