import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const AuthScreen = () => {
    const {login, register} = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [error, setError] = useState('');

    const handleAuth = async() => {
        if(!email.trim() || !password.trim()) {
            setError('Email and password are required');
            return;
        }

        if (isRegistering && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        let response;

        if (isRegistering) {
            response = await register(email, password);
        } else {
            response = await login(email, password);
        }

        if (response?.error) {
            setError(response.error);
            Alert.alert('Error', response.error);
            return;
        }

        router.replace('/');
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>{ isRegistering ? 'Sign Up' : 'Login'}</Text>

            {error? <Text style={styles.error}>{error}</Text> : null}

            <TextInput
                style={styles.input}
                placeholder='Email'
                placeholderTextColor='#aaaaaa'
                value={email}
                onChangeText={(text) => {setEmail(text); setError('');}}
                autoCapitalize='none'
                keyboardType='email-address'
            />

            <TextInput
                style={styles.input}
                placeholder='Password'
                placeholderTextColor='#aaaaaa'
                value={password}
                onChangeText={(text) => {setPassword(text); setError('');}}
                secureTextEntry
                textContentType='password'
            />

            { isRegistering && (
                <TextInput
                style={styles.input}
                placeholder='Confirm Password'
                placeholderTextColor='#aaaaaa'  
                value={confirmPassword}
                onChangeText={(text) => {setConfirmPassword(text); setError('');}}
                secureTextEntry
                textContentType='password'
                />  
            )}

            <TouchableOpacity style={styles.button} onPress={handleAuth}>
                <Text style={styles.buttonText}>
                    {isRegistering ? 'Sign Up' : 'Login'}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={ () => setIsRegistering(!isRegistering)}>
                <Text style={styles.switchText}>
                    {isRegistering ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333333',
    },
    input: {
        width: '100%',
        padding: 12,
        borderWidth: 1,
        borderColor: '#dddddd',
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#ffffff',
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        borderRadius: 8,
        width: '100%',
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    switchText: {
        marginTop: 10,
        color: '#007bff',
        fontSize: 16,
    },
    error: {
        color: 'red',
        marginBottom: 10,
        fontSize: 10,
    },
})

export default AuthScreen;