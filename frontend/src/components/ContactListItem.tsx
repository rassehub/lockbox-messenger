import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Contact } from "../types/Contact";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

type ContactListItemProps = {
    contact: Contact;
}

const ContactListItem: React.FC<ContactListItemProps> = ({contact}) => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    const avatarSource = contact.avatarUrl
        ? { uri: contact.avatarUrl }
        : require('../assets/avatar.png');
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

    return (
        <Pressable 
            onPress={() => {
                navigation.navigate('Chat', {
                    chatId: chatId
                })
            }}
            style={styles.contactListItem}>
            <Image source={avatarSource} style={styles.avatar} />
            <View>
                <Text style={styles.name}>{contact.name}</Text>
                <Text style={styles.lastSeen}>
                    {new Date(lastSeen).toLocaleDateString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                })}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    contactListItem: {
        flexDirection: 'row',
        padding: 12,
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
        color: '#594EFF',
    },
    lastSeen: {
        fontSize: 12,
        color: '#A8A5FF',
    },
})

export default ContactListItem;