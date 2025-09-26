import { FlatList, StyleSheet } from "react-native"
import { dummyContacts } from "../mockData/Contatcs"
import ContactListItem from "./ContactListItem"
import { Contact } from "../types/Contact"

type ContactListProps = {
    contacts: Contact[];
}

const ContactList = ({contacts}: ContactListProps) => {
    const renderContact = ({ item } : { item: Contact }) => <ContactListItem contact={item} />
    console.log('testi: ', contacts);

    return (
        <FlatList 
            style={styles.contactList}
            data={contacts}
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