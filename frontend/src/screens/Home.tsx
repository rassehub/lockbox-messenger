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
    const { storage, messages } = useChat();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const [allChats, setAllChats] = useState<ChatItem[]>([]);
    const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);

    useEffect(() => {
        let cancelled = false;

        const loadChats = async () => {
            if(!storage) return;
            const chats = await storage.getChatList();

            const unique = Array.from(
                new Map(chats.map((c) => [c.recipient || c.chatId, c])).values()
            ).sort((a, b) => b.timeStamp.localeCompare(a.timeStamp));

            if (!cancelled) {
                setAllChats(unique);
                setFilteredChats(unique);
            }
        };

        loadChats();

        return () => {
            cancelled = true;
        };
    }, [storage, messages]);

    const handleSearch = (searchText: string) => {
        const q = searchText.trim().toLowerCase();
        const updatedChats = !q
            ? allChats
            : allChats.filter((chat) => chat.recipient.toLowerCase().includes(q));
        setFilteredChats(updatedChats);
    };

    const handleNavigation = () => {
        navigation.navigate('NewChat');
    }

    return (
        <View style={styles.mainContainer}>
            <Text style={[styles.title, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>Messages</Text>
            <SearchBar onSearch={handleSearch} />
            <ChatList chats={filteredChats}/>
            <View style={styles.buttonContainer}>
                <PlusButton onPress={() => handleNavigation()}/>
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
    buttonContainer: {
        justifyContent: 'flex-end',
        position: 'absolute',
        bottom: 100,
        right: 10,
    },
})

export default HomeScreen;