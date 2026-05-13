import { FlatList, StyleSheet, TextInput, View, Keyboard } from "react-native";
import React, { useEffect, useRef, useState } from "react";
import ChatBubble from "../components/ChatBubble";
import { Message } from "../types/Message";
import { useChat } from "../ChatContext";

const ChatScreen = ({route}: any) => {
    const { storage, messages, sendMessage } = useChat();
    const [text, setText] = useState('');
    const listRef = useRef<FlatList<Message>>(null);

    const contactId = route.params.userId;
    const chatId = route.params.chatId;
    const [recipient, setRecipient] = useState<string>();

    const [keyboardVisible, setKeyboardVisible] = useState(false);
    const [placeholder, setPlaceholder] = useState('Message');

    useEffect(() => {
        const openKeyboardListener = Keyboard.addListener(
            'keyboardDidShow',
            () => {
                setKeyboardVisible(true);
                scrollToBottom(true);
                setPlaceholder('');
            }
        );
        const closeKeyboardListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        const init = async () => {
            const chat = await storage?.getMessages(chatId);
            if (chat) {
                console.log('test')
                setRecipient(contactId);
                return;
            }
            const fromContext = messages.find(m => m.chatID === chatId);
            if (fromContext) setRecipient(fromContext.senderID);
        };
        init();
        scrollToBottom();

        return () => {
            openKeyboardListener.remove();
            closeKeyboardListener.remove();
        }
    }, [chatId]);

    const scrollToBottom = (animated = true) => {
        requestAnimationFrame(() => {
            listRef.current?.scrollToEnd({ animated });
        });
    };

    useEffect(() => {
        listRef.current?.scrollToEnd({ animated: true });
    }, [messages.length]);

    const renderMessage = ({ item }: { item: Message }) => (
        <ChatBubble message={item} senderID={recipient ?? ''} />
    );

    const handleSendMessage = async () => {
        if (text.trim() === '') return;
        if (!recipient) return;
        try {
          await sendMessage(chatId, recipient, text);
        } catch (err) {
          console.warn('sendMessage failed', err);
        }
        setText('');
        setPlaceholder('Message');
    }

    return (
        <View style={styles.mainContainer}>
            <FlatList
                ref={listRef}
                style={styles.list}
                data={messages}
                extraData={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.messageID}
                keyboardShouldPersistTaps="handled"
                onLayout={() => scrollToBottom(true)}
            />
            <TextInput 
                style={[styles.textInput, { bottom: keyboardVisible ? 0 : 80, marginTop: keyboardVisible ? -40 : 40 }]}
                onChangeText={setText}
                value={text}
                placeholder={placeholder}
                placeholderTextColor='#A8A5FF'
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
        width: '100%',
        backgroundColor: '#EBEAFF',
        borderRadius: 40,
        paddingVertical: 14,
        paddingHorizontal: 14,
        color: '#A8A5FF',
    },
});

export default ChatScreen;