import { Alert, Button, Image, Pressable, StyleSheet, Text, View } from "react-native"

const plus = require('../assets/plus.png');

const PlusButton = () => {

    return (
        <Pressable 
            style={styles.button}
            onPress={() => {
                Alert.alert('Button pressed')
            }}>
            <Image source={plus} style={styles.buttonIcon}/>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#A8A5FF',
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
    },
    buttonIcon: {
        alignSelf: 'center',
        width: 35
    }
});

export default PlusButton;