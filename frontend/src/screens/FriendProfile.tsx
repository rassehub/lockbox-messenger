import { Image, StyleSheet, View, Text } from "react-native";
import { dummyContacts } from "../mockData/Contatcs";

const profilePicture = require('../assets/avatar-big.png');

const FriendProfileScreen = ({route}: any) => {
    const senderId = route.params.userId;
    const contact = dummyContacts.filter(
        (contact) => contact.userId === senderId
    )
    console.log('contact');
    console.log(contact);

    return (
        <View style={styles.mainContainer}>
            <Image style={styles.profilePicture} source={profilePicture}/>
            <Text style={styles.name}>{contact[0].name}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        padding: '5%',
        alignItems: 'center',
    },
    profilePicture: {
        
    },
    name: {
        fontSize: 18,
        color: '#594EFF',
    },
})

export default FriendProfileScreen;