import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import CustomAlertModal from '../components/CustomAlertModal';
import { handleFirebaseError, showValidationError, showSuccess } from '../utils/errorHandler';

const AddWalletScreen = ({ navigation }) => {
    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginLeft: 10 }}>
                    <Ionicons name="close-circle-outline" size={28} color="#000000" />
                </TouchableOpacity>
            ),
            headerStyle: {
                backgroundColor: '#FFFFFF',
            },
        });
    }, [navigation]);

    const [walletName, setWalletName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleSaveWallet = async () => {
        const name = walletName.trim();
        const balance = parseFloat(initialBalance) || 0;

        if (!name) {
            showValidationError('Дансны нэрийг оруулна уу.');
            return;
        }

        setIsLoading(true);
        try {
            await addDoc(collection(DB, "wallets"), {
                userId: AUTH.currentUser.uid,
                name: name,
                balance: balance,
                isDefault: false,
                createdAt: serverTimestamp(),
            });

            showSuccess(`"${name}" данс амжилттай нэмэгдлээ.`);
            setWalletName('');
            setInitialBalance('');
            navigation.goBack();
        } catch (error) {
            handleFirebaseError(error, 'Данс нэмэхэд алдаа гарлаа. Сүлжээгээ шалгана уу.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessConfirm = () => {
        setIsSuccessModalVisible(false);
        if (successMessage.includes('амжилттай')) {
            navigation.goBack();
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: '#f9f9f9' }]}>
            <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
                <View style={styles.header}>
                    <Ionicons name="wallet-outline" size={24} color="#007AFF" />
                    <Text style={[styles.title, { color: '#000000' }]}>Шинэ Данс Нэмэх</Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: '#000000' }]}>Дансны нэр</Text>
                    <TextInput
                        style={[styles.input, { 
                            borderColor: '#E0E0E0', 
                            backgroundColor: '#FFFFFF',
                            color: '#000000' 
                        }]}
                        placeholder="Жишээ: Карт, Бэлэн мөнгө"
                        placeholderTextColor="#666666"
                        value={walletName}
                        onChangeText={setWalletName}
                    />

                    <Text style={[styles.label, { color: '#000000' }]}>Анхны үлдэгдэл</Text>
                    <TextInput
                        style={[styles.input, { 
                            borderColor: '#E0E0E0', 
                            backgroundColor: '#FFFFFF',
                            color: '#000000' 
                        }]}
                        placeholder="0"
                        placeholderTextColor="#666666"
                        keyboardType="numeric"
                        value={initialBalance}
                        onChangeText={setInitialBalance}
                    />

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: '#007AFF' }]}
                        onPress={handleSaveWallet}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>
                            {isLoading ? 'Хадгалж байна...' : 'Данс Нэмэх'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <CustomAlertModal
                isVisible={isSuccessModalVisible}
                title="Мэдэгдэл"
                message={successMessage}
                onConfirm={handleSuccessConfirm}
                onCancel={handleSuccessConfirm}
                confirmText="Ойлголоо"
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    card: {
        borderRadius: 12,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    form: {
        gap: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    saveButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default AddWalletScreen;