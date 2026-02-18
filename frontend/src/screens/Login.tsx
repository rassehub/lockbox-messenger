import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../ThemeContext";
import AuthenticationForm from "../components/AuthenticationForm";
import AuthButton from "../components/AuthButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useAuthentication } from "../AuthContext";
import { useEffect, useRef, useState } from "react";
import { FormikProps } from "formik";

const logoPlaceholder = require('../assets/logo-placeholder.png');

const LoginScreen = () => {
    const { isAuthenticated, loading, loadStoredAuth, handleAuthentication } = useAuthentication();
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const formRef = useRef<FormikProps<{ phonenumber: string; password: string; }> | null>(null);

    useEffect(() => {
        if(!loading && isAuthenticated) {
            navigation.navigate("Home");
        }
    }, [loading, isAuthenticated, navigation]);

    const handleLogin = async (values: LoginValues) => {
        const authenticated = await handleAuthentication(values.phonenumber, values.password);
        if(authenticated) {
            navigation.navigate("Home");
        } else {
            console.log("Authentication failed");
        }
    };

    const formConfiguration = {
        fields: [
            {
                name: "phonenumber",
                label: "Phone number",
                icon: require('../assets/email.png'),
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
            <Image style={styles.logo} source={logoPlaceholder}/>
            <Text style={styles.title}>Login</Text>
            <AuthenticationForm<LoginValues>
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleLogin}
                formRef={formRef}
            />
            <TouchableOpacity>
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
});

export default LoginScreen;