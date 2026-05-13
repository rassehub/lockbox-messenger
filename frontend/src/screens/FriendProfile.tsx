import { Image, StyleSheet, View, Text, Pressable } from "react-native";
import { useEffect, useState } from "react";
import DropdownRadio from "../components/DropdownRadio";
import { useTheme } from "../ThemeContext";
import { useChat } from "../ChatContext";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

const profilePicture = require('../assets/avatar-big.png');
const profilePictureDark = require('../assets/avatar-big-dark.png');
const trash = require('../assets/delete.png');
const trashDark = require('../assets/delete-dark.png');

const FriendProfileScreen = ({route}: any) => {
    const { storage, refreshChats } = useChat();
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    
    const contactId = route.params.userId;
    const [name, setName] = useState<string>();

    useEffect(() => {
        const loadContact = async () => {
            if(!storage) return;
            const contact = await storage.getContact(contactId);
            console.log(contact)
            setName(contact?.name);
        }
        loadContact();
    }, []);

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

    const handleRemoveContact = async () => {
        if(!storage) return;
        if(!contactId) console.log('vittu')

        await storage.clearChat(route.params.chatId)
        await storage.removeContact(contactId);
        
        refreshChats();
        navigation.navigate('Home');
    }

    return (
        <View style={styles.mainContainer}>
            <Image source={isDarkTheme ? profilePictureDark : profilePicture}/>
            <Text style={[styles.name, {color: isDarkTheme ? '#A8A5FF' : '#594EFF'}]}>{name}</Text>
            <View style={styles.settingsView}>
                <DropdownRadio 
                    dropdownTitle="Disappearing messages"
                    formConfiguration={formConfiguration}
                    initialValues={initialValues}
                    onSubmit={handleSubmit}
                />
                <Text style={styles.categoryText}>Danger zone</Text>
                <Pressable style={styles.base} onPress={() => handleRemoveContact()}>
                    <Text style={styles.settingText}>Remove Contact</Text>
                    <Image style={styles.settingIcon} source={isDarkTheme ? trashDark : trash} />
                </Pressable>
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
    settingsView: {
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
        width: '97%',
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
})

export default FriendProfileScreen;