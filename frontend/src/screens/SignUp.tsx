import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { useTheme } from "../ThemeContext";
import AuthenticationForm from "../components/AuthenticationForm";
import AuthButton from "../components/AuthButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";

const logoPlaceholder = require('../assets/logo-placeholder.png')

const SignUpScreen = () => {
    const { isDarkTheme } = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<StackParams>>();

    const formConfiguration = {
        fields: [
            {
                name: "email",
                label: "Email",
                type: "input",
                inputType: "email",
                component: "input",
                icon: require('../assets/email.png'),
            },
            {
                name: "username",
                label: "Username",
                type: "input",
                inputType: "text",
                component: "input",
                icon: require('../assets/user.png'),
            },
            {
                name: "password",
                label: "Password",
                type: "input",
                inputType: "password",
                component: "input",
                icon: require('../assets/lock.png'),
            },
            {
                name: "confirmPassword",
                label: "Repeat Password",
                type: "input",
                inputType: "password",
                component: "input",
                icon: require('../assets/lock.png'),
            },
        ]
    }

    const initialValues = {
        email: "",
        userName: "",
        password: "",
        confirmPassword: "",
    }

    const handleSignUp = () => {
        console.log("handle signup");
    }

    return(
        <View style={styles.mainContainer}>
            <Image style={styles.logo} source={logoPlaceholder}/>
            <Text style={styles.title}>Login</Text>
            <AuthenticationForm
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleSignUp}
            />
            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            <AuthButton buttonText="Login" onPressed={handleSignUp} />
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