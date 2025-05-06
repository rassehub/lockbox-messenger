import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../ThemeContext";
import AuthenticationForm from "../components/AuthenticationForm";
import AuthButton from "../components/AuthButton";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StackParams } from "../../App";
import { useAuthentication } from "../AuthContext";

const logoPlaceholder = require('../assets/logo-placeholder.png');

const LoginScreen = () => {
    const { isAuthenticated, handleAuthentication } = useAuthentication();
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
                name: "password",
                label: "Password",
                type: "input",
                inputType: "password",
                component: "input",
                icon: require('../assets/lock.png'),
            },
        ]
    }

    const initialValues = {
        email: "",
        password: "",
    }

    const handleLogin = () => {
        const authenticated = handleAuthentication();
        if (authenticated) {
            navigation.navigate('Home');
        } else {
            console.log('Authentication failed');
        }
    }

    return(
        <View style={styles.mainContainer}>
            <Image style={styles.logo} source={logoPlaceholder}/>
            <Text style={styles.title}>Login</Text>
            <AuthenticationForm 
                formConfiguration={formConfiguration}
                initialValues={initialValues}
                onSubmit={handleLogin}
            />
            <TouchableOpacity>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
            </TouchableOpacity>
            <AuthButton buttonText="Login" onPressed={handleLogin} />
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