import { FlatList, StyleSheet } from "react-native"
import { dummyChats } from "../mockData/ChatItems";
import ChatListItem from "./ChatListItem";
import { ChatItem } from "../types/ChatListItem";

type ChatListProps = {
    chats: ChatItem[];
}

const ChatList = ({chats}: ChatListProps) => {
    const renderItem = ({ item } : { item: ChatItem }) => <ChatListItem chat={item} />

    return(
        <FlatList
            style={styles.chatList}
            data={chats}
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