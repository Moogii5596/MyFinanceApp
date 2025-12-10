import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import CustomAlertModal from '../components/CustomAlertModal';

const AddCategoryScreen = ({ navigation }) => {
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

    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState('expense');
    const [selectedIcon, setSelectedIcon] = useState('ellipsis-horizontal');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const iconOptions = [
        'restaurant', 'car', 'home', 'medical', 'school', 'fitness',
        'gift', 'airplane', 'card', 'cash', 'business', 'ellipsis-horizontal'
    ];

    const handleSaveCategory = async () => {
        const name = categoryName.trim();

        if (!name) {
            setSuccessMessage('Категорийн нэрийг оруулна уу.');
            setIsSuccessModalVisible(true);
            return;
        }

        setIsLoading(true);
        try {
            await addDoc(collection(DB, "categories"), {
                userId: AUTH.currentUser.uid,
                name: name,
                type: categoryType,
                icon: selectedIcon,
                createdAt: serverTimestamp(),
            });

            setSuccessMessage(`"${name}" категори амжилттай нэмэгдлээ.`);
            setIsSuccessModalVisible(true);
            setCategoryName('');
            setSelectedIcon('ellipsis-horizontal');
        } catch (error) {
            console.error('Error adding category:', error);
            setSuccessMessage('Категори нэмэхэд алдаа гарлаа.');
            setIsSuccessModalVisible(true);
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
                    <Ionicons name="pricetag-outline" size={24} color="#007AFF" />
                    <Text style={[styles.title, { color: '#000000' }]}>Шинэ Категори Нэмэх</Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: '#000000' }]}>Категорийн нэр</Text>
                    <TextInput
                        style={[styles.input, { 
                            borderColor: '#E0E0E0', 
                            backgroundColor: '#FFFFFF',
                            color: '#000000' 
                        }]}
                        placeholder="Жишээ: Хоол, Тээвэр"
                        placeholderTextColor="#666666"
                        value={categoryName}
                        onChangeText={setCategoryName}
                    />

                    <Text style={[styles.label, { color: '#000000' }]}>Төрөл</Text>
                    <View style={styles.typeContainer}>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { borderColor: '#E0E0E0' },
                                categoryType === 'expense' && { backgroundColor: '#007AFF' }
                            ]}
                            onPress={() => setCategoryType('expense')}
                        >
                            <Text style={[
                                styles.typeText,
                                { color: categoryType === 'expense' ? 'white' : '#000000' }
                            ]}>
                                Зарлага
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.typeButton,
                                { borderColor: '#E0E0E0' },
                                categoryType === 'income' && { backgroundColor: '#007AFF' }
                            ]}
                            onPress={() => setCategoryType('income')}
                        >
                            <Text style={[
                                styles.typeText,
                                { color: categoryType === 'income' ? 'white' : '#000000' }
                            ]}>
                                Орлого
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, { color: '#000000' }]}>Тэмдэг сонгох</Text>
                    <View style={styles.iconGrid}>
                        {iconOptions.map((icon) => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconButton,
                                    { borderColor: '#E0E0E0' },
                                    selectedIcon === icon && { backgroundColor: '#007AFF' }
                                ]}
                                onPress={() => setSelectedIcon(icon)}
                            >
                                <Ionicons 
                                    name={icon} 
                                    size={24} 
                                    color={selectedIcon === icon ? 'white' : '#000000'} 
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.saveButton, { backgroundColor: '#007AFF' }]}
                        onPress={handleSaveCategory}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>
                            {isLoading ? 'Хадгалж байна...' : 'Категори Нэмэх'}
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
    typeContainer: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    typeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    iconButton: {
        width: 50,
        height: 50,
        borderWidth: 1,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
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

export default AddCategoryScreen;