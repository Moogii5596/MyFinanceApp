import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const PasswordResetScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handlePasswordReset = async () => {
        if (email.trim() === '') {
            Alert.alert("Анхааруулга", "Имэйл хаягаа оруулна уу.");
            return;
        }

        setIsLoading(true);
        try {
            await sendPasswordResetEmail(AUTH, email.trim());
            
            Alert.alert(
                "Амжилттай!", 
                `"${email}" хаяг руу нууц үг сэргээх холбоосыг илгээлээ. Имэйлээ шалгана уу.`,
                [{ text: "Ойлголоо", onPress: () => navigation.goBack() }]
            );

        } catch (error) {
            console.error("Password reset error:", error);
            let errorMessage = "Нууц үг сэргээх үед алдаа гарлаа.";
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = "Энэ имэйл хаяг бүртгэлгүй байна.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Имэйл хаяг буруу форматтай байна.";
            }
            
            Alert.alert("Алдаа", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container} 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back-outline" size={24} color="#343a40" />
                </TouchableOpacity>

                <View style={styles.content}>
                    <Ionicons name="key-outline" size={60} color="#007bff" style={{marginBottom: 20}} />
                    <Text style={styles.headerTitle}>Нууц Үг Сэргээх</Text>
                    <Text style={styles.subtitle}>
                        Бүртгэлтэй имэйл хаягаа оруулна уу. Бид танд нууц үг сэргээх холбоос бүхий имэйл илгээнэ.
                    </Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Бүртгэлтэй Имэйл Хаяг"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        placeholderTextColor="#999"
                        editable={!isLoading}
                    />

                    <TouchableOpacity style={styles.resetButton} onPress={handlePasswordReset} disabled={isLoading}>
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Имэйл Илгээх</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 40 : 20,
        left: 20,
        zIndex: 10,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 15,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 30,
    },
    input: {
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 16,
        marginBottom: 20,
        backgroundColor: '#f9f9f9',
    },
    resetButton: {
        width: '100%',
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PasswordResetScreen;