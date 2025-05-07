import React from "react";
import { StyleSheet, View, TextInput, Image } from "react-native";

const searchIcon = require('../assets/search.png');

type SearchBarProps = {
    onSearch: (searchText: string) => void;
}

const SearchBar = ({onSearch}: SearchBarProps) => {
    const [searchText, setSearchText] = React.useState('Search');

    return (
        <View style={styles.searchBar}>
            <TextInput 
                style={styles.input}
                onChangeText={(text) => {
                    setSearchText(text);
                    onSearch(text);
                }}
                value={searchText}
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