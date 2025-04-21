import { View, Text, StyleSheet } from "react-native";
import React from "react";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";

const HomeScreen = () => {
    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>Messages</Text>
            <SearchBar />
            <ChatList />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        paddingHorizontal: '5%',
        paddingTop: '25%',
        paddingBottom: '5%',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#594EFF',
    },
})

export default HomeScreen;