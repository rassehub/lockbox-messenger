import { GestureResponderEvent, Image, ImageStyle, Pressable, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "../ThemeContext";

const plus = require('../assets/plus.png');
const plusDark = require('../assets/plus-dark.png');

interface PlusButtonProps {
    onPress: (e: GestureResponderEvent) => void;
    styleProp?: ViewStyle;
    iconStyleProp?: ImageStyle;
}

const PlusButton: React.FC<PlusButtonProps> = ({ onPress, styleProp, iconStyleProp }) => {
    const { isDarkTheme } = useTheme();

    return (
        <Pressable
            style={[styles.button, styleProp]}
            onPress={(e) => onPress(e)}
        >
            <Image source={isDarkTheme ? plusDark : plus} style={[styles.buttonIcon, iconStyleProp]} />
        </Pressable>
    );
};

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