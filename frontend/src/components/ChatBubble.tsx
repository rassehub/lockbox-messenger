import { StyleSheet, Text, View } from "react-native";
import { Message } from "../types/Message";

type MessageProps = {
    message: Message;
}

const ChatBubble: React.FC<MessageProps> = ({message}) => {
    return (
        <View style={message.senderID == '1' ? styles.receivedBubble : styles.sentBubble}>
            <Text style={styles.message}>{message.contents}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    receivedBubble: {
        backgroundColor: '#594EFF',
        borderRadius: 40,
        padding: '5%',
        margin: '2%',
        minWidth: '30%',
        maxWidth: '80%',
        alignSelf: 'flex-start',
    },
    sentBubble: {
        backgroundColor: '#A8A5FF',
        borderRadius: 40,
        padding: '5%',
        margin: '2%',
        minWidth: '30%',
        maxWidth: '80%',
        alignSelf: 'flex-end',
    },
    message: {
        fontSize: 14,
        color: '#FFFFFF',
    }
});

export default ChatBubble;