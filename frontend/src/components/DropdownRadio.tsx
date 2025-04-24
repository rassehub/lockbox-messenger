import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ErrorMessage, Formik } from 'formik';
import { useState } from "react";

const arrowDown = require('../assets/arrow-down.png');
const arrowUp = require('../assets/arrow-up.png');

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
    const [isVisible, setIsVisible] = useState(false);
    const toggleDropdown = () => setIsVisible(!isVisible);

    return (
        <View>
            <TouchableOpacity
                onPress={toggleDropdown}
                style={styles.dropdownButton}
            >
                <Text style={styles.buttonText}>{dropdownTitle}</Text>
                <Image source={isVisible ? arrowUp : arrowDown} />
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
                                            <Text style={styles.radioLabel}>{option.label}</Text>
                                            <View
                                                style={[
                                                    styles.radioCircle,
                                                ]}
                                            >
                                                <View style={[
                                                    values[field.name] === option.value ? styles.radioCircleSelected : styles.unselected
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
        color: '#594EFF',
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
        borderColor: '#594EFF',
        alignItems: 'center',
        justifyContent: 'center',
    },
    radioCircleSelected: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#594EFF',
    },
    unselected: {
        opacity: 0,
    },
    radioLabel: {
        fontSize: 14,
        color: '#594EFF',
    },
    errorText: {
        fontSize: 12,
        color: 'red',
    },
    submitButton: {
        backgroundColor: '#594EFF',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
});

export default DropdownRadio;