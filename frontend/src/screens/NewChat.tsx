import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import SearchBar from "../components/SearchBar";
import ContactList from "../components/ContactsList";

const avatar = require('../assets/new.png');

const NewChatScreen = () => {

    return(
        <View style={styles.mainContainer}>
            <SearchBar />
            <Pressable style={styles.newContact}>
                <Image style={styles.icon} source={avatar}/>
                <Text style={styles.newContactText}>New Contact</Text>
            </Pressable>
            <Text style={styles.title}>My contacts</Text>
            <ContactList />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        paddingHorizontal: '5%',
        paddingTop: '10%',
        paddingBottom: '5%',
    },
    newContact: {
        flexDirection: 'row',
        paddingVertical: '8%',
        paddingHorizontal: '2%',
    },
    icon: {
        width: 45,
        height: 45,
    },
    newContactText: {
        fontSize: 16,
        fontWeight: 'bold',
        alignSelf: 'center',
        color: '#594EFF',
        paddingLeft: '2%',
    },
    title: {
        fontSize: 14,
        color: '#A8A5FF',
        paddingLeft: '2%',
    }
});

export default NewChatScreen;