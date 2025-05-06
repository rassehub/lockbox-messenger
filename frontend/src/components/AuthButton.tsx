import { Pressable, StyleSheet, Text } from "react-native"

type AuthButtonProps = {
    buttonText: string;
    onPressed: (values: any) => void;
}

const AuthButton = ({buttonText, onPressed}: AuthButtonProps) => {
    return(
        <Pressable 
            onPress={onPressed}
            style={styles.button}
        >
            <Text style={styles.buttonText}>{buttonText}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#594EFF',
        paddingVertical: '3%',
        marginVertical: 16,
        borderRadius: 40,
    },
    buttonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
    },
});

export default AuthButton;