import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ErrorMessage, Formik } from 'formik';
import { useState } from "react";
import { useTheme } from "../ThemeContext";

const arrowDown = require('../assets/arrow-down.png');
const arrowUp = require('../assets/arrow-up.png');

const arrowDownDark = require('../assets/arrow-down-dark.png');
const arrowUpDark = require('../assets/arrow-up-dark.png');

type DropdownRadioProps = {
    dropdownTitle: string;
    formConfiguration: {
        fields: {
            name: string;
            options: { label: string; value: string }[];
        }[];
    };
    initialValues: { [key: string]: string };
    onSubmit: (values: any) => void;
}

const DropdownRadio = ({ dropdownTitle, formConfiguration, initialValues, onSubmit}: DropdownRadioProps) => {
    const { isDarkTheme } = useTheme();
    const [isVisible, setIsVisible] = useState(false);
    const toggleDropdown = () => setIsVisible(!isVisible);

    return (
        <View>
            <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}
            >
                <Text style={[styles.buttonText, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{dropdownTitle}</Text>
                <Image source={isDarkTheme ? (isVisible ? arrowUpDark : arrowDownDark) : (isVisible ? arrowUp : arrowDown)} />
            </TouchableOpacity>
            {isVisible && (
                <View>
                    <Formik
                        initialValues={initialValues}
                        onSubmit={onSubmit}
                        >
                        {({ values, setFieldValue, isSubmitting }) => (
                            <View>
                            {formConfiguration.fields.map((field) => (
                                <View key={field.name}>
                                    {field.options.map((option) => (
                                        <TouchableOpacity
                                            key={option.value}
                                            style={styles.radioOption}
                                            onPress={() => {
                                                setFieldValue(field.name, option.value);
                                                onSubmit(values);
                                            }}
                                        >
                                            <Text style={[styles.radioLabel, { color: isDarkTheme ? '#A8A5FF' : '#594EFF' }]}>{option.label}</Text>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                    { borderColor: isDarkTheme ? '#A8A5FF' : '#594EFF' }
                                                ]}
                                            >
                                                <View style={[
                                                    values[field.name] === option.value ? styles.radioCircleSelected : styles.unselected,
                                                    { backgroundColor: isDarkTheme ? '#A8A5FF' : '#594EFF' }
                                                ]}/>
                                            </View>
                                        </TouchableOpacity>
                                    ))}
                                    <ErrorMessage name={field.name} component={Text} />
                                </View>
                            ))}
                            </View>
                        )}
                    </Formik>
                </View>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        paddingVertical: '5%',
    },
    radioOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingRight: '3%',
        marginBottom: 8,
    },
    radioCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        width: 9,
        height: 9,
        borderRadius: 5,
    },
    unselected: {
        opacity: 0,
    },
    radioLabel: {
        fontSize: 14,
    },
    errorText: {
        fontSize: 12,
        color: 'red',
    },
});

export default DropdownRadio;