import { Image, ImageStyle, Pressable, StyleSheet, TextStyle } from "react-native";
import { useTheme } from "../ThemeContext";

const plus = require('../assets/plus.png');
const plusDark = require('../assets/plus-dark.png');
const check = require('../assets/check.png');

interface PlusButtonProps {
    onPress: () => void;
    styleProp?: TextStyle;
    iconStyleProp?: ImageStyle;
}

const PlusButton: React.FC<PlusButtonProps> = ({ onPress, styleProp, iconStyleProp }) => {
    const { isDarkTheme } = useTheme();

    return (
        <Pressable 
            style={[styles.button, styleProp]}
            onPress={onPress}>
            <Image source={isDarkTheme ? plusDark : plus} style={[styles.buttonIcon, iconStyleProp]}/>
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