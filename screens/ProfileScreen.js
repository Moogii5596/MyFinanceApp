import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { DB, AUTH, STORAGE } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sharedStyles } from '../styles/sharedStyles';

const ProfileScreen = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [displayName, setDisplayName] = useState('');
    const [financialGoal, setFinancialGoal] = useState('');
    const [mainCurrency, setMainCurrency] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    
    const user = AUTH.currentUser;

    const fetchUserProfile = async () => {
        if (!user) return;
        
        const userRef = doc(DB, "users", user.uid);
        
        try {
            const docSnap = await getDoc(userRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                setDisplayName(data.displayName || user.email.split('@')[0]);
                setFinancialGoal(data.financialGoal || '');
                setMainCurrency(data.mainCurrency || 'MNT');
                setAvatarUrl(data.avatarUrl || null);
            }
        } catch (error) {
            console.error("Error fetching profile data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const pickImage = async () => {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (permissionResult.granted === false) {
            Alert.alert("Анхааруулга", "Галерейд хандах зөвшөөрөл шаардлагатай.");
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.3,
        });

        if (!pickerResult.canceled) {
            const uri = pickerResult.assets[0].uri;
            await uploadImage(uri);
        }
    };

    const uploadImage = async (uri) => {
        setIsSaving(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            
            const storageRef = ref(STORAGE, `avatars/${user.uid}`);
            
            await uploadBytes(storageRef, blob);
            const url = await getDownloadURL(storageRef);

            await updateDoc(doc(DB, "users", user.uid), {
                avatarUrl: url,
            });

            setAvatarUrl(url);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

        } catch (error) {
            console.error("Error uploading image:", error);
            Alert.alert("Алдаа", "Зураг байршуулж чадсангүй.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSaving(true);
        
        try {
            await updateDoc(doc(DB, "users", user.uid), {
                displayName: displayName.trim() || user.email.split('@')[0],
                financialGoal: financialGoal.trim(),
                mainCurrency: mainCurrency,
            });
            
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
            
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (showSuccess) {
        return (
            <View style={sharedStyles.successOverlay}>
                <View style={sharedStyles.successContent}>
                    <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                    <Text style={sharedStyles.successText}>Профайл мэдээлэл хадгалагдлаа</Text>
                </View>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Хэрэглэгчийн Профайл</Text>

            <View style={styles.avatarSection}>
                <TouchableOpacity onPress={pickImage} disabled={isSaving}>
                    {avatarUrl ? (
                        <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={50} color="#fff" />
                        </View>
                    )}
                    <View style={styles.cameraIcon}>
                        <Ionicons name="camera-outline" size={24} color="#fff" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.userEmail}>{user.email}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardHeader}>Үндсэн Мэдээлэл</Text>
                
                <Text style={styles.inputLabel}>Таны Нэр:</Text>
                <TextInput
                    style={styles.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Хэрэглэгчийн нэр"
                    editable={!isSaving}
                />

                <Text style={styles.inputLabel}>Санхүүгийн Зорилго:</Text>
                <TextInput
                    style={[styles.input, { minHeight: 80 }]}
                    value={financialGoal}
                    onChangeText={setFinancialGoal}
                    placeholder="Жишээ: 1 сая₮ хадгалах"
                    multiline={true}
                    editable={!isSaving}
                />
            </View>

            <View style={styles.card}>
                <Text style={styles.cardHeader}>Үндсэн Валют</Text>
                <View style={styles.currencyRow}>
                    {['MNT', 'USD', 'EUR'].map(currency => (
                        <TouchableOpacity
                            key={currency}
                            style={[
                                styles.currencyButton,
                                mainCurrency === currency && styles.currencyButtonActive
                            ]}
                            onPress={() => setMainCurrency(currency)}
                            disabled={isSaving}
                        >
                            <Text style={[
                                styles.currencyText,
                                mainCurrency === currency && styles.currencyTextActive
                            ]}>{currency}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Хадгалах</Text>}
            </TouchableOpacity>
            
            <View style={{height: 50}} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 25,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#fff',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIcon: {
        position: 'absolute',
        bottom: 0,
        right: -5,
        backgroundColor: '#28a745',
        borderRadius: 20,
        padding: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    userEmail: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 10,
    },
    card: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    cardHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 10,
        marginBottom: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#f9f9f9',
        marginBottom: 15,
    },
    currencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    currencyButton: {
        flex: 1,
        marginHorizontal: 5,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        alignItems: 'center',
    },
    currencyButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    currencyText: {
        fontSize: 16,
        color: '#343a40',
        fontWeight: 'bold',
    },
    currencyTextActive: {
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default ProfileScreen;