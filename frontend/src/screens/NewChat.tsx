import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import ContactList from "../components/ContactsList";
import { useTheme } from "../ThemeContext";
import { Contact } from "../types/Contact";
import { useChat } from "../ChatContext";

const avatar = require('../assets/new.png');
const avatarDark = require('../assets/new-dark.png');

const NewChatScreen = ({route}: any) => {
    const { storage, searchUsers, getUserId, refreshContacts, contactRefreshKey } = useChat();
    const { isDarkTheme } = useTheme();
    const [modalVisible, setModalVisible] = useState(false);
    const [initalContacts, setInitialContacts] = useState<Contact[]>();
    const [contacts, setContacts] = useState<Contact[]>();

    const initialNewContacts: Contact[] = [];
    const [newContacts, setNewContacts] = useState(initialNewContacts);
    const ids = route.params.chatIds;

    useEffect(() => {
        const loadContacts = async () => {
            if(!storage) return;
            const contacts = await storage.getAllContacts();
            setContacts(contacts);
            setInitialContacts(contacts);
        };

        loadContacts();
    }, [storage, contactRefreshKey])

    const handleSearchNewContacts = async (searchText: string) => {
        const results = await searchUsers(searchText);
        console.log(results);
        const usernames = Array.isArray(results)
            ? results
            : [];

        const newContacts: Contact[] = await Promise.all(
            usernames.map(async (username) => {
                const userId = await getUserId(username);

                return {
                    userId: userId,
                    name: username,
                } as Contact;
            })
        );
        console.log(newContacts);
        setNewContacts(newContacts);
    }

    const handleSearchOwnContacts = (searchText: string) => {
        if(!initalContacts) return;
        const updatedContacts = !searchText
            ? initalContacts
            : initalContacts.filter((contact) => contact.name.toLowerCase().includes(searchText.toLowerCase()));
        setContacts(updatedContacts);
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
                        shadowColor: isDarkTheme ? '#A8A5FF' : '#000',
                    }]}>
                        <Text style={[styles.modalText, {color: isDarkTheme ? '#A8A5FF' : '#594EFF'}]}>Add new contact</Text>
                        <SearchBar onSearch={handleSearchNewContacts}/>
                        <ContactList usage="new" contacts={newContacts} chatIds={ids} />
                        <Pressable
                            style={styles.button}
                            onPress={() => {
                                refreshContacts();
                                setModalVisible(!modalVisible);
                            }}>
                            <Text style={styles.buttonStyle}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <SearchBar onSearch={handleSearchOwnContacts}/>
            <Pressable 
                onPress={() => {
                    setModalVisible(true);
                }}
                style={styles.newContact}>
                <Image style={styles.icon} source={isDarkTheme ? avatarDark : avatar}/>
                <Text style={[styles.newContactText, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>New Contact</Text>
            </Pressable>
            <Text style={styles.title}>My contacts</Text>
            <ContactList usage="own" contacts={contacts ?? []} chatIds={ids ?? []}/>
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