import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ChatItem } from "../types/ChatListItem";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { dummyContacts } from "../mockData/Contatcs";
import { useTheme } from "../ThemeContext";

type ChatListItemProps = {
    chat: ChatItem;
}

const ChatListItem: React.FC<ChatListItemProps> = ({chat}) => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    const avatarSource = chat.avatarUrl
        ? { uri: chat.avatarUrl}
        : isDarkTheme ? require('../assets/avatar-dark.png') : require('../assets/avatar.png');

    const lastMessage = chat.message[chat.message.length - 1].contents;
    const chatId = chat.chatId;
    const userId = dummyContacts.find(contact => contact.chatId === chatId)?.userId || 'Unknown';

    return (
        <View style={styles.chatListItem}>
            <Pressable
                onPress={() => {
                    navigation.navigate('FriendProfile', { userId })
                }}>
                <Image source={avatarSource} style={styles.avatar}/>
            </Pressable>
            <Pressable
                onPress={() => {
                    navigation.navigate('Chat', {
                        chatId: chat.chatId
                    })
                }}>
                <View style={styles.chatInfo}>
                    <Text style={[styles.recipient, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{chat.recipient}</Text>
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