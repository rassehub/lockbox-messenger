import { Pressable, StyleSheet, Text } from "react-native"

type SettingItemProps = {
    category: string;
    description: string;
}

const SettingItem = ({category, description}: SettingItemProps) => {

    return(
        <Pressable 
            style={styles.settingItem}>
            <Text style={styles.title}>{category}</Text>
            <Text style={styles.description}>{description}</Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    settingItem: {
        textAlign: 'left',
        width: '100%',
        paddingBottom: '4%',
    },
    title: {
        fontSize: 16,
        color: '#594EFF',
        fontWeight: 'bold',
    },
    description: {
        fontSize: 12,
        color: '#A8A5FF',
    },
});

export default SettingItem;