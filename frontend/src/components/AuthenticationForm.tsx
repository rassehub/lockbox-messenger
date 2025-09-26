import { Formik, ErrorMessage } from "formik";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";

type AuthenticationFormProps = {
    formConfiguration: {
        fields: {
            name: string;
            label: string;
            icon: any;
        }[];
    };
    initialValues: { [key: string]: string };
    onSubmit: (values: any) => void;
}

const AuthenticationForm = ({formConfiguration, initialValues, onSubmit}: AuthenticationFormProps) => {
    return(
        <View>
            <Formik
                initialValues={initialValues}
                onSubmit={onSubmit}
            >
                {() => (
                    <View>
                        {formConfiguration.fields.map((field) => (
                            <View key={field.name} style={styles.textFieldContainer}>
                                <Image source={field.icon} style={styles.fieldIcons}/>
                                <TextInput value={field.label} style={styles.textField}/>
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
    },
    fieldIcons: {
      width: 26,
      height: 26,  
      alignSelf: 'center',
      marginLeft: '5%',
    },
});

export default AuthenticationForm;