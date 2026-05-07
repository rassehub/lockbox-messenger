import { FlatList, StyleSheet, TextInput, View } from "react-native";
import React, { useState } from "react";
import ChatBubble from "../components/ChatBubble";
import { Message } from "../types/Message";
import { dummyChats } from "../mockData/ChatItems";
import { useChat } from "../ChatContext";
import { ChatStorage } from "../chat/chatStorage";
import { useAuthentication } from "../AuthContext";

const ChatScreen = ({route}: any) => {
    const { messages, isConnected, sendMessage } = useChat();
    const [text, onChangeText] = useState('Message');

    const createMessageId = () => {
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

    const chatId = route.params.chatId;
    const chat = dummyChats.find((chat) => chat.chatId === chatId);
    const [chatMessages, setChatMessages] = useState(chat ? chat.message : []);
    const recipient = chat?.recipient ?? null;
    if(!chat || !recipient) {
        navigation.navigate('Home');
    }

    const renderMessage = ({ item }: { item: Message }) => ( <ChatBubble message={item} senderID={chatMessages[0].senderID} /> );

    const handleSendMessage = () => {
        if(text.trim() === '') return;
        if(!recipient) return;

        sendMessage(recipient, text);

        setChatMessages(chatMessages => [...chatMessages, {
            messageID: createMessageId(),
            chatID: chatId,
            senderID: '2',
            contents: text,
            timeStamp: new Date().toString(),
        }]);

        onChangeText('Message');
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                style={styles.list}
                data={chatMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.messageID}
            />
            <TextInput 
                style={[styles.textInput, { bottom: text !== 'Message' ? 0 : 100 }]}
                onPress={() => onChangeText('')}
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