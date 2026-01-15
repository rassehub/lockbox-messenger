import { View, Text, StyleSheet } from "react-native";
import React, { useState } from "react";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";
import PlusButton from "../components/PlusButton";
import { useTheme } from "../ThemeContext";
import { dummyChats } from "../mockData/ChatItems";

const HomeScreen = () => {
    const { isDarkTheme } = useTheme();
    const initialChats = dummyChats.filter((chat) => chat.chatId !== null);
    const [filteredChats, setFilteredChats] = useState(initialChats);

    const handleSearch = (searchText: string) => {
        const updatedChats = !searchText 
            ? initialChats 
            : initialChats.filter((chat) => chat.recipient.toLowerCase().includes(searchText.toLowerCase()));
        setFilteredChats(updatedChats);
    }

    return (
        <View style={styles.mainContainer}>
            <Text style={[styles.title, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>Messages</Text>
            <SearchBar onSearch={handleSearch} />
            <ChatList chats={filteredChats}/>
            <View style={styles.buttonContainer}>
                <PlusButton />
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
    }
})

export default HomeScreen;