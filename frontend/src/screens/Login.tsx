import { Image, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useRef, useState } from "react";
import { FormikProps } from "formik";
import AuthenticationForm from "../components/AuthenticationForm";
import AuthButton from "../components/AuthButton";
import { StackParams } from "../../App";
import { useAuthentication } from "../AuthContext";
import { useTheme } from "../ThemeContext";

const logoPlaceholder = require('../assets/logo-placeholder.png');

const LoginScreen = () => {
    const { isDarkTheme } = useTheme();
    const { isAuthenticated, loading, login } = useAuthentication();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    
    const formRef = useRef<FormikProps<{ phonenumber: string; password: string; }> | null>(null);

    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        if(!loading && isAuthenticated) {
            navigation.navigate("Home");
        }
    }, [loading, isAuthenticated, navigation]);

    const handleLogin = async (values: LoginValues) => {
        console.log("handle login");
        const authenticated = await login(values.phonenumber, values.password);
        if(authenticated) {
            navigation.navigate("Home");
        } else {
            console.log("Authentication failed");
        }
    };

    const handleForgottenPassword = async () => {
        console.log('Forgotten password');
        setModalVisible(!modalVisible);
    }

    const formConfiguration = {
        fields: [
            {
                name: "phonenumber",
                label: "Phone number",
                icon: require('../assets/phone.png'),
                inputType: "phonenumber",
            },
            {
                name: "password",
                label: "Password",
                icon: require('../assets/lock.png'),
                inputType: "password",
            },
        ],
    } satisfies {
        fields: {
            name: keyof LoginValues;
            label: string;
            icon: any;
            inputType?: "phonenumber" | "password" | "text";
        }[];
    };

    const initialValues = {
        phonenumber: "",
        password: "",
    }

    type LoginValues = {
        phonenumber: string;
        password: string;
    }

    return(
        <View style={styles.mainContainer}>
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => {
                    setModalVisible(!modalVisible);
                }}
            >
                <View style={styles.centeredView} onTouchEnd={() => setModalVisible(false)}>
                    <View style={[styles.modalView, {
                        backgroundColor: isDarkTheme ? '#1E1E1E' : '#FFFFFF',
                        shadowColor: isDarkTheme ? '#A8A5FF' : '#000',
                    }]}>
                        <Text style={[styles.modalText, {color: isDarkTheme ? '#A8A5FF' : '#594EFF'}]}>Forgot Your Password?</Text>
                        <View style={styles.textFieldContainer}>
                            <TextInput
                                style={styles.textField}
                                placeholder="Phone Number"
                                placeholderTextColor="#A8A5FF"
                                keyboardType="phone-pad"
                            />
                        </View>
                        <Pressable
                            style={styles.button}
                            onPress={() => setModalVisible(!modalVisible)}>
                            <Text style={styles.buttonTextStyle}> Reset Password</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            <Image style={styles.logo} source={logoPlaceholder}/>
            <Text style={styles.title}>Login</Text>
            <AuthenticationForm<LoginValues>
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleLogin}
                formRef={formRef}
            />
            <TouchableOpacity
                onPress={handleForgottenPassword}
            >
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            <AuthButton buttonText="Login" onPressed={() => formRef.current?.handleSubmit()} />
            <Text style={styles.bottomText}>Don't have an account? 
                <TouchableOpacity 
                    onPress={() => {
                        navigation.navigate('SignUp')
                    }}>
                    <Text style={styles.signUpText}> Sign Up</Text>
                </TouchableOpacity>
            </Text>
        </View>
    )
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
        justifyContent: 'center'
    },
    logo: {
        alignSelf: 'center',
    },
    title: {
        color: '#594EFF',
        fontSize: 28,
        textAlign: 'center',
        fontWeight: 'bold',
        paddingVertical: '5%',
    },
    forgotPassword: {
        color: '#594EFF',
        fontSize: 14,
        textAlign: 'center',
    },
    bottomText: {
        color: '#594EFF',
        fontSize: 12,
        textAlign: 'center',
    },
    signUpText: {
        color: '#A8A5FF',
        fontWeight: 'bold',
        fontSize: 12,
        top: 4,
        textAlign: 'center',
    },
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalView: {
        width: '80%',
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    buttonTextStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    button: {
        alignSelf: 'flex-end',
        backgroundColor: '#594EFF',
        borderRadius: 20,
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 30,
        elevation: 2
    },
    modalText: {
        marginBottom: 15,
        paddingLeft: '2%',
        textAlign: 'left',
    },
    textFieldContainer: {
        flexDirection: 'row',
        backgroundColor: '#EBEAFF',
        borderRadius: 40,
        justifyContent: 'flex-start',
        marginBottom: 16,
    },
    textField: {
        paddingLeft: '8%',
        fontSize: 14,
        color: '#A8A5FF',
        flex: 1,
    },
});

export default LoginScreen;