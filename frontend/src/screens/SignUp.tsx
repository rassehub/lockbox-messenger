import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRef } from "react";
import { FormikProps } from "formik";
import AuthenticationForm from "../components/AuthenticationForm";
import AuthButton from "../components/AuthButton";
import { StackParams } from "../../App";
import { useAuthentication } from "../AuthContext";

const logoPlaceholder = require('../assets/logo-placeholder.png')

const SignUpScreen = () => {
    const { register } = useAuthentication();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();
    const formRef = useRef<FormikProps<{ email: string; phonenumber: string; userName: string; password: string; confirmPassword: string; }> | null>(null);

    const formConfiguration = {
        fields: [
            {
                name: "email",
                label: "Email",
                icon: require('../assets/email.png'),
                inputType: "text",
            },
            {
                name: "phonenumber",
                label: "Phone number",
                icon: require('../assets/email.png'),
                inputType: "phonenumber",
            },
            {
                name: "userName",
                label: "Username",
                icon: require('../assets/user.png'),
                inputType: "text",
            },
            {
                name: "password",
                label: "Password",
                icon: require('../assets/lock.png'),
                inputType: "password",
            },
            {
                name: "confirmPassword",
                label: "Repeat Password",
                icon: require('../assets/lock.png'),
                inputType: "password",
            },
        ],
    } satisfies {
        fields: {
            name: "email" | "phonenumber" | "userName" | "password" | "confirmPassword";
            label: string;
            icon: any;
            inputType?: "text" | "phonenumber" | "password";
        }[];
    };

    const initialValues = {
        email: "",
        phonenumber: "",
        userName: "",
        password: "",
        confirmPassword: "",
    }

    type SignUpValues = {
        email: string;
        phonenumber: string;
        userName: string;
        password: string;
        confirmPassword: string;
    }

    const handleSignUp = async (values: SignUpValues) => {
        console.log("handle signup");
        try {
            if(values.password !== values.confirmPassword) {
                Alert.alert("Error", "Passwords do not match");
                return;
            }

            const registered = await register(values.userName, values.phonenumber, values.password);
            if(registered) {
                navigation.navigate("Home");
            } else {
                console.log("Registering failde");
            }
        } catch (err: any) {
            Alert.alert("Signup failed", err?.message ?? "Unknown error");
        }
    }

    return(
        <View style={styles.mainContainer}>
            <Image style={styles.logo} source={logoPlaceholder}/>
            <Text style={styles.title}>Login</Text>
            <AuthenticationForm<SignUpValues>
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleSignUp}
                formRef={formRef}
            />
            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            <AuthButton buttonText="Sign up" onPressed={() => formRef.current?.handleSubmit()} />
            <Text style={styles.bottomText}>Already have an account? 
                <TouchableOpacity
                    onPress={() => {
                        navigation.navigate('Login')
                    }}
                >
                    <Text style={styles.loginText}> Login</Text>
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
    loginText: {
        color: '#A8A5FF',
        fontWeight: 'bold',
        fontSize: 12,
        top: 4,
        textAlign: 'center',
    },
});

export default SignUpScreen;