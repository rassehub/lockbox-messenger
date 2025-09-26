import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import SearchBar from "../components/SearchBar";
import ContactList from "../components/ContactsList";
import { useState } from "react";
import { useTheme } from "../ThemeContext";
import { dummyContacts } from "../mockData/Contatcs";

const avatar = require('../assets/new.png');
const avatarDark = require('../assets/new-dark.png');

const NewChatScreen = () => {
    const { isDarkTheme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const initialContacts = dummyContacts;
    const [contacts, setContacts] = useState(initialContacts);
    console.log('new chat: ', contacts);

    const handleModalSearch = (searchText: string) => {
        console.log('modal search');
    }

    const handleSearch = (searchText: string) => {
        const updatedContacts = !searchText
            ? initialContacts
            : initialContacts.filter((contact) => contact.name.toLowerCase().includes(searchText.toLowerCase()));
        setContacts(updatedContacts);
        console.log(updatedContacts);
        console.log('Search text: ', searchText);
    }

    return(
        <View style={styles.mainContainer}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}>
                <View style={styles.centeredView}>
                    <View style={[styles.modalView, {
                        backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF',
                        shadowColor: isDarkTheme ? '#A8A5FF' :'#000',
                    }]}>
                        <Text style={[styles.modalText, {color: isDarkTheme ? '#A8A5FF' : '#594EFF'}]}>Add new contact</Text>
                        <SearchBar onSearch={handleModalSearch}/>
                        <Pressable
                            style={styles.button}
                            onPress={() => setModalVisible(!modalVisible)}>
                            <Text style={styles.buttonStyle}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <SearchBar onSearch={handleSearch}/>
            <Pressable 
                onPress={() => {
                    setModalVisible(true);
                }}
                style={styles.newContact}>
                <Image style={styles.icon} source={isDarkTheme ? avatarDark : avatar}/>
                <Text style={[styles.newContactText, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>New Contact</Text>
            </Pressable>
            <Text style={styles.title}>My contacts</Text>
            <ContactList contacts={contacts}/>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        paddingTop: '5%',
        flex: 1,
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
        paddingLeft: '2%',
    },
    title: {
        fontSize: 14,
        color: '#A8A5FF',
        paddingLeft: '2%',
    },

    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      },
      modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
      button: {
        alignSelf: 'flex-end',
        width: 120,
        backgroundColor: '#A8A5FF',
        borderRadius: 20,
        marginTop: 15,
        paddingVertical: 10,
        elevation: 2
      },
      buttonStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
      },
      modalText: {
        marginBottom: 15,
        paddingLeft: '2%',
        textAlign: 'left',
      },
});

export default NewChatScreen;