import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ChatItem } from "../types/ChatListItem";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

type ChatListItemProps = {
    chat: ChatItem;
}

const ChatListItem: React.FC<ChatListItemProps> = ({chat}) => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>()
    const avatarSource = chat.avatarUrl
        ? { uri: chat.avatarUrl}
        : require('../assets/avatar.png');

    return (
        <Pressable 
            onPress={() => {
                navigation.navigate('Chat', {
                    chatId: chat.chatId
                })
            }}
            style={styles.chatListItem}
        >
            <Image source={avatarSource} style={styles.avatar}/>
            <View>
                <View style={styles.chatInfo}>
                    <Text style={styles.recipient}>{chat.recipient}</Text>
                    <Text style={styles.time}>
                        {new Date(chat.timeStamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        })}
                    </Text>
                </View>
                <Text style={styles.lastMessage}>{chat.lastMessage}</Text>
            </View>
        </Pressable>
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
        color: '#594EFF',
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