import { FlatList, StyleSheet } from "react-native"
import ContactListItem from "./ContactListItem"
import { Contact } from "../types/Contact"

type ContactListProps = {
    usage: string;
    contacts: Contact[];
}

const ContactList: React.FC<ContactListProps> = ({usage, contacts}) => {
    const renderContact = ({ item } : { item: Contact }) => <ContactListItem usage={usage} contact={item} />

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
        paddingTop: 10,
    },
});

export default ContactList;