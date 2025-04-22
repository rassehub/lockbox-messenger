import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import SearchBar from "../components/SearchBar";
import ContactList from "../components/ContactsList";
import { useState } from "react";

const avatar = require('../assets/new.png');

const NewChatScreen = () => {
    const [modalVisible, setModalVisible] = useState(false)

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
                    <View style={styles.modalView}>
                        <Text style={styles.modalText}>Add new contact</Text>
                        <SearchBar />
                        <Pressable
                            style={styles.button}
                            onPress={() => setModalVisible(!modalVisible)}>
                            <Text style={styles.buttonStyle}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
            <SearchBar />
            <Pressable 
                onPress={() => {
                    setModalVisible(true);
                }}
                style={styles.newContact}>
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
        shadowColor: '#000',
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