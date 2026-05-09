import { FlatList, StyleSheet, TextInput, View } from "react-native";
import React, { useEffect, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import { Message } from "../types/Message";
import { useChat } from "../ChatContext";

const ChatScreen = ({route}: any) => {
    const { messages, sendMessage, loadChat } = useChat();
    const [text, onChangeText] = useState('Message');

    const chatId = route.params.chatId;
    const [recipient, setRecipient] = useState<string>();

    useEffect(() => {
        const init = async () => {
            const chat = await loadChat(chatId);
            if (chat && chat.length) {
                setRecipient('a5469e03-d5ae-4b3f-893a-3eb48954a15c');
                return;
            }
            const fromContext = messages.find(m => m.chatID === chatId);
            if (fromContext) setRecipient(fromContext.senderID);
        };
        init();
    }, [chatId]);

    const chatMessages = messages.filter((m) => m.chatID === chatId);

    const renderMessage = ({ item }: { item: Message }) => (
        <ChatBubble message={item} senderID={chatMessages[0]?.senderID ?? ""} />
    );

    const handleSendMessage = async () => {
        if (text.trim() === '') return;
        if (!recipient) return;
        try {
          await sendMessage(chatId, recipient, text);
        } catch (err) {
          console.warn('sendMessage failed', err);
        }
        onChangeText('Message');
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                style={styles.list}
                data={chatMessages}
                extraData={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.messageID}
            />
            <TextInput 
                style={[styles.textInput, { bottom: text !== 'Message' ? 0 : 100 }]}
                onFocus={() => onChangeText('')}
                onChangeText={onChangeText}
                value={text}
                onSubmitEditing={handleSendMessage}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    list: {
        flex: 1,
        marginBottom: 60,
    },
    textInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#EBEAFF',
        borderRadius: 40,
        marginTop: '5%',
        paddingVertical: '4%',
        paddingHorizontal: '5%',
        color: '#A8A5FF',
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center'
    },
});

export default ChatScreen;