import { FlatList, StyleSheet } from "react-native"
import { dummyContacts } from "../mockData/Contatcs"
import ContactListItem from "./ContactListItem"
import { Contact } from "../types/Contact"

const ContactList = () => {
    const renderContact = ({ item } : { item: Contact }) => <ContactListItem contact={item} />

    return (
        <FlatList 
            style={styles.contactList}
            data={dummyContacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.userId}
        />
    )
}

const styles = StyleSheet.create({
    contactList: {

    },
});

export default ContactList;