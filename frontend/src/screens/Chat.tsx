import { FlatList, StyleSheet, TextInput, View } from "react-native";
import { dummyMessages } from "../mockData/Messages";
import ChatBubble from "../components/ChatBubble";
import { Message } from "../types/Message";
import React, { useState } from "react";

const ChatScreen = ({route}: any) => {
    const [text, onChangeText] = useState('Message');

    const chatId = route.params.chatId;
    const filteredMessages = dummyMessages.filter(
        (message) => message.chatID === chatId
    )

    const renderMessage = ({ item }: { item: Message }) => ( <ChatBubble message={item} /> );

    return (
        <View style={styles.mainContainer}>
            <FlatList
                style={styles.list}
                data={filteredMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.messageID}
            />
            <TextInput 
                style={styles.textInput}
                onChangeText={onChangeText}
                value={text}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        padding: '5%',
    },
    list: {

    },
    textInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#EBEAFF',
        marginTop: '5%',
        borderRadius: 40,
        paddingVertical: '2%',
        paddingHorizontal: '5%',
        color: '#A8A5FF',
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center'
    },
});

export default ChatScreen;