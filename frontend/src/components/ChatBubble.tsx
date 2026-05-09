import { Image, StyleSheet, Text, View } from "react-native";
import { Message } from "../types/Message";

type MessageProps = {
    message: Message;
    senderID: string;
}

const sent = require('../assets/sent.png');
const delivered = require('../assets/delivered.png');
const read = require('../assets/read.png');

const ChatBubble: React.FC<MessageProps> = ({message, senderID}) => {
    return (
        <View style={message.senderID == senderID ? styles.receivedBubble : styles.sentBubble}>
            <Text style={styles.timeStamp}>{message.timeStamp.slice(11).slice(0, 5)}</Text>
            <Text style={styles.message}>{message.contents}</Text>
            <Image style={message.senderID == senderID ? styles.noIcon : styles.icon} source={message.timeRead ? read : (message.timeStamp ? sent : delivered)}/>
        </View>
    )
}

const styles = StyleSheet.create({
    receivedBubble: {
        backgroundColor: '#594EFF',
        borderRadius: 40,
        paddingVertical: '5%',
        paddingHorizontal: '8%',
        margin: '2%',
        minWidth: '40%',
        maxWidth: '80%',
        alignSelf: 'flex-start',
    },
    sentBubble: {
        backgroundColor: '#A8A5FF',
        borderRadius: 40,
        paddingVertical: '5%',
        paddingHorizontal: '8%',
        margin: '2%',
        minWidth: '40%',
        maxWidth: '80%',
        alignSelf: 'flex-end',
    },
    timeStamp: {
        color: '#ffffff',
        fontSize: 12,
        fontWeight: '200',
    },
    textAndIcon: {
        flex: 1,
        flexDirection: 'row',
    },
    message: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    noIcon: {
        height: 0
    },
    icon: {
        alignSelf: 'flex-end',
        marginTop: -10,
        marginBottom: -5,
        marginLeft: 45,
        width: 20,
        height: 20,
    }
});

export default ChatBubble;