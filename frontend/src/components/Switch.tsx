import { useState } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

type SwitchProps = {
    initialState: boolean;
    onHandlePressed: () => boolean
}

const Switch = ({initialState, onHandlePressed}: SwitchProps) => {
    const [isEnabled, setIsEnabled] = useState(initialState);

    return (
        <Pressable onPress={() => {
            const newState = onHandlePressed();
            setIsEnabled(newState);
        }}>
            <Animated.View style={[
                styles.switchBase,
                {backgroundColor: isEnabled ? '#594EFF' : '#A8A5FF'},
                ]}>
                <Animated.View style={[
                    styles.toggle,
                    {alignSelf: isEnabled ?  'flex-end' : 'flex-start'},
                    ]}/>
            </Animated.View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    switchBase: {
        width: 50,
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRadius: 36.5,
    },
    toggle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#EBEAFF',
    },
});

export default Switch;