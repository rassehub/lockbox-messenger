import { View, Text, StyleSheet } from "react-native";
import React, { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";
import PlusButton from "../components/PlusButton";
import { useTheme } from "../ThemeContext";
import { useChat } from "../ChatContext";
import { ChatItem } from "../types/ChatListItem";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

const HomeScreen = () => {
    const { isDarkTheme } = useTheme();
    const { storage, messages, refreshKey } = useChat();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [allChats, setAllChats] = useState<ChatItem[]>([]);
    const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
    const [chatIds, setChatIds] = useState<string[]>();

    useEffect(() => {
        let cancelled = false;

        const loadChats = async () => {
            if (!storage) return;

            const chats = await storage.getChatList();
            console.log(chats)
            const allChatIds = chats.map(c => c.chatId);
            setChatIds(allChatIds);
            const contacts = await storage.getAllContacts();

            const contactById = new Map(
                contacts.map((c) => [String(c.userId).trim(), c])
            );

            const chatsWithNames = chats.map((chat) => {
                const contact = contactById.get(String(chat.recipient).trim());

                return {
                    ...chat,
                    name: contact?.name ?? chat.recipient,
                    avatarUrl: contact?.avatarUrl,
                };
            });

            if (!cancelled) {
                setAllChats(chatsWithNames);
                setFilteredChats(chatsWithNames);
            }
        };

        loadChats();
        return () => {
            cancelled = true;
        };
    }, [storage, messages, refreshKey]);

    const handleSearch = (searchText: string) => {
        const q = searchText.trim().toLowerCase();
        const updatedChats = !q
            ? allChats
            : allChats.filter((chat) => chat.name?.toLowerCase().includes(q));
        setFilteredChats(updatedChats);
    };

    const handleNavigation = () => {
        navigation.navigate('NewChat', {chatIds: chatIds ?? []});
    }

    return (
        <View style={styles.mainContainer}>
            <Text style={[styles.title, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>Messages</Text>
            <SearchBar onSearch={handleSearch} />
            <View style={styles.listContainer}>
                <ChatList chats={filteredChats} />
            </View>
            <View style={styles.buttonContainer}>
                <PlusButton onPress={() => handleNavigation()} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingTop: '20%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        alignSelf: 'center',
    },
    listContainer: {
        paddingTop: '5%',
        height: '68%',
    },
    buttonContainer: {
        justifyContent: 'flex-end',
        position: 'absolute',
        bottom: 100,
        right: 10,
    },
})

export default HomeScreen;