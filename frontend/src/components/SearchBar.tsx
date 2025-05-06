import React from "react";
import { StyleSheet, View, TextInput, Image } from "react-native";

const searchIcon = require('../assets/search.png');

const SearchBar = () => {
    const [text, onChangeText] = React.useState('Search');

    return (
        <View style={styles.searchBar}>
            <TextInput 
                style={styles.input}
                onChangeText={onChangeText}
                value={text}
            />
            <Image source={searchIcon} style={styles.searchIcon}/>
        </View>
    )
}

const styles = StyleSheet.create({
    searchBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        backgroundColor: '#EBEAFF',
        marginTop: '5%',
        borderRadius: 40,
        paddingVertical: '1%',
        paddingHorizontal: '5%',
    },
    input: {
        color: '#A8A5FF',
        paddingLeft: '5%',
    },
    searchIcon: {
        alignSelf: 'center',
    }
});

export default SearchBar;