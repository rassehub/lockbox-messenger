import { Formik, ErrorMessage, FormikProps } from "formik";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import { RefObject } from "react";

type AuthenticationFormProps<TValues extends Record<string, string>> = {
    formConfiguration: {
        fields: {
            name: keyof TValues & string;
            label: string;
            icon: any;
            inputType?: "phonenumber" | "password" | "text";
        }[];
    };
    initialValues: TValues;
    onSubmit: (values: TValues) => void;
    formRef?: RefObject<FormikProps<TValues> | null>;
}

const AuthenticationForm = <TValues extends Record<string, string>>({
    formConfiguration, 
    initialValues, 
    onSubmit, 
    formRef
}: AuthenticationFormProps<TValues>) => {
    return(
        <View>
            <Formik<TValues>
                innerRef={formRef}
                initialValues={initialValues}
                onSubmit={onSubmit}
            >
                {({values, handleChange, handleBlur}) => (
                    <View>
                        {formConfiguration.fields.map((field) => (
                            <View key={field.name} style={styles.textFieldContainer}>
                                <Image source={field.icon} style={styles.fieldIcons}/>
                                <TextInput
                                    style={styles.textField}
                                    placeholder={field.label}
                                    placeholderTextColor="#A8A5FF"
                                    value={values[field.name] ?? ""}
                                    onChangeText={handleChange(field.name)}
                                    onBlur={handleBlur(field.name)}
                                    autoCapitalize="none"
                                    keyboardType={field.inputType === "phonenumber" ? "phone-pad" : "default"}
                                    secureTextEntry={field.inputType === "password"} 
                                />
                                <ErrorMessage name={field.name} component={Text} />
                            </View>
                        ))}
                    </View>
                )}
            </Formik>
        </View>
    )
}

const styles = StyleSheet.create({
    textFieldContainer: {
        flexDirection: 'row',
        backgroundColor: '#EBEAFF',
        borderRadius: 40,
        justifyContent: 'flex-start',
        marginBottom: 16,
    },
    textField: {
        paddingLeft: '2%',
        fontSize: 14,
        color: '#A8A5FF',
        flex: 1,
    },
    fieldIcons: {
      width: 26,
      height: 26,  
      alignSelf: 'center',
      marginLeft: '5%',
    },
});

export default AuthenticationForm;