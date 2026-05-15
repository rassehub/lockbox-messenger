import { FlatList, StyleSheet } from "react-native"
import ContactListItem from "./ContactListItem"
import { Contact } from "../types/Contact"
import { useEffect, useState } from "react";
import { useChat } from "../ChatContext";

type ContactListProps = {
    usage: string;
    contacts: Contact[];
    chatIds: string[];
}

const ContactList: React.FC<ContactListProps> = ({usage, contacts, chatIds}) => {
    const renderContact = ({ item } : { item: Contact }) => <ContactListItem usage={usage} contact={item} chatIds={chatIds}/>

    return (
        <FlatList 
            style={styles.contactList}
            data={contacts}
            renderItem={renderContact}
            keyExtractor={(item) => item.userId}
            keyboardShouldPersistTaps='always'
        />
    )
}

const styles = StyleSheet.create({
    contactList: {
        paddingTop: 10,
    },
});

export default ContactList;