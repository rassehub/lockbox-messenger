import { View, Text, StyleSheet } from "react-native";
import React from "react";
import SearchBar from "../components/SearchBar";
import ChatList from "../components/ChatList";
import PlusButton from "../components/PlusButton";

const HomeScreen = () => {

    return (
        <View style={styles.mainContainer}>
            <Text style={styles.title}>Messages</Text>
            <SearchBar />
            <ChatList />
            <View style={styles.buttonContainer}>
                <PlusButton />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
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
    buttonContainer: {
        justifyContent: 'flex-end',
        position: 'absolute',
        bottom: 100,
        right: 40,
    }
})

export default HomeScreen;