import { FlatList, StyleSheet } from "react-native"
import { dummyChats } from "../mockData/ChatItems";
import ChatListItem from "./ChatListItem";
import { ChatItem } from "../types/ChatListItem";

const ChatList = () => {
    const renderItem = ({ item } : { item: ChatItem }) => <ChatListItem chat={item} />
    const filteredChats = dummyChats.filter((chat) => chat.chatId !== null);
    console.log(filteredChats);

    return(
        <FlatList
            style={styles.chatList}
            data={filteredChats}
            renderItem={renderItem}
            keyExtractor={(item) => item.chatId}
        />
    )
}

const styles = StyleSheet.create({
    chatList: {
        paddingTop: '5%',
    },
});

export default ChatList;