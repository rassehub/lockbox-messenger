import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChatItem } from "../types/ChatListItem";
import { StackParams } from "../../App";
import { useTheme } from "../ThemeContext";
import { useEffect, useState } from "react";
import { useChat } from "../ChatContext";

type ChatListItemProps = {
    chat: ChatItem;
}

const ChatListItem: React.FC<ChatListItemProps> = ({chat}) => {
    const { storage } = useChat();
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [recipientName, setRecipientName] = useState<string>();
    const avatarSource = chat.avatarUrl
        ? { uri: chat.avatarUrl}
        : isDarkTheme ? require('../assets/avatar-dark.png') : require('../assets/avatar.png');

    const userId = chat.recipient;
    const chatId = chat.chatId;

    const lastMessage = chat.message[chat.message.length - 1]?.contents ?? '';
    

    useEffect(() => {
        const getContact = async () => {
            if(!storage) return;
            const contact = await storage.getContact(chat.recipient);
            setRecipientName(contact?.name);
        }

        getContact();
    }, []); 

    return (
        <View style={styles.chatListItem}>
            <Pressable
                onPress={() => {
                    navigation.navigate('FriendProfile', { userId, chatId })
                }}>
                <Image source={avatarSource} style={styles.avatar}/>
            </Pressable>
            <Pressable
                onPress={() => {
                    navigation.navigate('Chat', {
                        userId: userId,
                        chatId: chat.chatId
                    })
                }}>
                <View style={styles.chatInfo}>
                    <Text style={[styles.recipient, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{recipientName}</Text>
                    <Text style={styles.time}>
                        {new Date(chat.timeStamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        })}
                    </Text>
                </View>
                <Text style={styles.lastMessage}>{lastMessage}</Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    chatListItem: {
        flexDirection: 'row',
        padding: 12,
        alignItems: 'center',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    chatInfo: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    recipient: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    time: {
        fontSize: 12,
        color: '#A8A5FF',
    },
    lastMessage: {
        fontSize: 14,
        color: '#A8A5FF',
    }
});

export default ChatListItem;