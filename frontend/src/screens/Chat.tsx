import { FlatList, StyleSheet, View } from "react-native";
import { dummyMessages } from "../mockData/Messages";
import ChatBubble from "../components/ChatBubble";
import { Message } from "../types/Message";

const ChatScreen = ({route}: any) => {
    const chatId = route.params.chatId;
    const filteredMessages = dummyMessages.filter(
        (message) => message.chatID === chatId
    )

    const renderMessage = ({ item }: { item: Message }) => ( <ChatBubble message={item} /> );

    return (
        <FlatList
            style={styles.list}
            data={filteredMessages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.messageID}
        />
    );
}

const styles = StyleSheet.create({
    list: {

    }
});

export default ChatScreen;