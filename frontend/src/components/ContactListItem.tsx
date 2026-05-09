import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Contact } from "../types/Contact";
import { StackParams } from "../../App";
import { useTheme } from "../ThemeContext";
import PlusButton from "./PlusButton";
import { useChat } from "../ChatContext";
import { opacity } from "react-native-reanimated/lib/typescript/Colors";
import { useState } from "react";

type ContactListItemProps = {
    usage: string;
    contact: Contact;
}

const ContactListItem: React.FC<ContactListItemProps> = ({usage, contact}) => {
    const { isDarkTheme } = useTheme();
    const { storage } = useChat();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [newOrOwn, setNewOrOwn] = useState(usage);

    const avatarSource = contact.avatarUrl
        ? { uri: contact.avatarUrl }
        : isDarkTheme ? require('../assets/avatar-dark.png') : require('../assets/avatar.png');
    const lastSeen = contact.lastSeen
        ? contact.lastSeen
        : '';
        
    const createChatId = () => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < 5) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    };

    const chatId = contact.chatId ? contact.chatId : createChatId();

    const handleAddContact = async (contact: Contact) => {
        if(!storage) return;
        await storage.saveContact(contact);
        const response = await storage.getContact(contact.userId);
        console.log(response);
        if(response) setNewOrOwn("own");
    }

    return (
        <Pressable 
            onPress={() => {
                navigation.navigate('Chat', {
                    chatId: chatId
                })
            }}
            >
            <View style={styles.contactListItem}>
                <Image source={avatarSource} style={styles.avatar} />
                <View style={styles.contactInfo}>
                    <Text style={[styles.name, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{contact.name}</Text>
                    <Text style={styles.lastSeen}>
                        {new Date(lastSeen).toLocaleDateString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                        })}</Text>
                </View>
                <View style={{ opacity: newOrOwn === "new" ? 0 : 1, height: newOrOwn === "new" ? 0 : 'auto'}}>
                    <PlusButton onPress={() => handleAddContact(contact)} styleProp={styles.plusButton} iconStyleProp={styles.plusIcon} />
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    contactListItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 12,
    },
    contactInfo: {
        flex: 1,
        justifyContent: 'space-around'
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    lastSeen: {
        fontSize: 12,
        color: '#A8A5FF',
    },
    plusButton: {
        width: 24,
        height: 24,
        marginTop: 8,
    },
    plusIcon: {
        width: 20,
        height: 20,
    },
})

export default ContactListItem;