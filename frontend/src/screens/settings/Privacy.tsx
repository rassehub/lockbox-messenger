import { StyleSheet, Text, View } from "react-native";
import DropdownRadio from "../../components/DropdownRadio";

const PrivacySettings = () => {
    const formConfiguration = {
        fields: [
            {
                name: "whoCanSee",
                options: [
                    { label: "Everyone", value: "everyone" },
                    { label: "My Contacts", value: "myContacts" },
                    { label: "Nobody", value: "nobody" },
                ]
            }
        ]
    }

    const initialValues = {
        whoCanSee: "everyone",
    }

    const handleLastSeenSubmit = () => {
        console.log("Last seen submit");
    }

    const handleprofilePictureSubmit = () => {
        console.log("Profile picture submit");
    }

    const handledisappearingMessages = () => {
        console.log("Disappearing messages");
    }
 
    return(
        <View style={styles.mainContainer}>
            <Text style={styles.categoryText}>Who can see my personal info</Text>
            <DropdownRadio 
                dropdownTitle="Last seen"
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleLastSeenSubmit}
            />
            <DropdownRadio 
                dropdownTitle="Profile picture"
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleprofilePictureSubmit}
            />
            <Text style={styles.categoryText}>Privacy settings</Text>
            <DropdownRadio 
                dropdownTitle="Disappearing messages"
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handledisappearingMessages}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        paddingTop: '5%',
        paddingHorizontal: '5%',
    },
    categoryText: {
        color: '#A8A5FF',
        fontSize: 14,
        paddingTop: '10%',
    },
});

export default PrivacySettings;