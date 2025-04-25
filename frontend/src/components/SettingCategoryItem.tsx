import { StyleSheet, Text, View } from "react-native"
import { useTheme } from "../ThemeContext";

type SettingItemProps = {
    category: string;
    description: string;
}

const SettingCategoryItem = ({category, description}: SettingItemProps) => {
    const { isDarkTheme } = useTheme();

    return(
        <View 
            style={styles.settingItem}>
            <Text style={[styles.title, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{category}</Text>
            <Text style={styles.description}>{description}</Text>
        </View>
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
        fontWeight: 'bold',
    },
    description: {
        fontSize: 12,
        color: '#A8A5FF',
    },
});

export default SettingCategoryItem;