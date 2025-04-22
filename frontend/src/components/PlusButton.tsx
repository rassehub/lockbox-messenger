import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Alert, Image, Pressable, StyleSheet, Text, View } from "react-native"
import { StackParams } from "../../App";

const plus = require('../assets/plus.png');

const PlusButton = () => {
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    return (
        <Pressable 
            style={styles.button}
            onPress={() => {
                navigation.navigate('NewChat')
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