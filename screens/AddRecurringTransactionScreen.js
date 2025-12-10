import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DB, AUTH } from '../firebaseConfig';
import { collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useUser } from '../contexts/UserContext';
import { sharedStyles } from '../styles/sharedStyles';

const FREQUENCY_OPTIONS = [
    { label: 'Сар бүр', value: 'monthly' },
    { label: 'Долоо хоног бүр', value: 'weekly' },
    { label: 'Жил бүр', value: 'yearly' },
];

const TRANSACTION_TYPES = [
    { label: 'Зарлага', value: 'expense', color: '#dc3545' },
    { label: 'Орлого', value: 'income', color: '#28a745' },
];

const AddRecurringTransactionScreen = ({ navigation }) => {
    const [transactionType, setTransactionType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [startDate, setStartDate] = useState(new Date());
    const [frequency, setFrequency] = useState('monthly');
    const [isSaving, setIsSaving] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    
    const { userProfile } = useUser();
    const groupId = userProfile?.currentGroupId || null;
    const userId = AUTH.currentUser?.uid;

    useEffect(() => {
        if (!userId) return;

        const qCategories = query(collection(DB, "categories"), where("userId", "==", userId));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData);
        });

        return () => unsubscribeCategories();
    }, [userId]);

    useEffect(() => {
        const filtered = categories.filter(cat => cat.type === transactionType);
        setFilteredCategories(filtered);
        setSelectedCategory(null);
    }, [transactionType, categories]);

    const handleSaveSchedule = async () => {
        if (!amount || !description.trim() || !selectedCategory) {
            Alert.alert("Анхааруулга", "Бүх талбарыг бөглөнө үү.");
            return;
        }

        setIsSaving(true);
        try {
            const scheduleData = {
                type: transactionType,
                amount: parseFloat(amount),
                description: description.trim(),
                category: selectedCategory.name,
                userId: userId,
                groupId: groupId,
                frequency: frequency,
                startDate: startDate,
                nextExecutionDate: startDate,
                isActive: true,
                createdAt: new Date(),
            };

            await addDoc(collection(DB, "recurringSchedules"), scheduleData);

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigation.goBack();
            }, 1500);

        } catch (error) {
            console.error("Error saving recurring schedule:", error);
            Alert.alert("Алдаа", "Төлөвлөгөө хадгалж чадсангүй.");
        } finally {
            setIsSaving(false);
        }
    };

    const renderCategoryModal = () => (
        <Modal visible={showCategoryModal} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Категори Сонгох</Text>
                    <ScrollView style={styles.categoryList}>
                        {filteredCategories.map((category) => (
                            <TouchableOpacity
                                key={category.id}
                                style={styles.categoryItem}
                                onPress={() => {
                                    setSelectedCategory(category);
                                    setShowCategoryModal(false);
                                }}
                            >
                                <Text style={styles.categoryItemText}>{category.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                    <TouchableOpacity
                        style={styles.modalCloseButton}
                        onPress={() => setShowCategoryModal(false)}
                    >
                        <Text style={styles.modalCloseText}>Буцах</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (showSuccess) {
        return (
            <View style={sharedStyles.successOverlay}>
                <View style={sharedStyles.successContent}>
                    <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                    <Text style={sharedStyles.successText}>Тогтмол гүйлгээний төлөвлөгөө хадгалагдлаа</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.headerTitle}>Тогтмол Гүйлгээ Нэмэх</Text>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Төрөл</Text>
                <View style={styles.typeSelectorContainer}>
                    {TRANSACTION_TYPES.map(type => (
                        <TouchableOpacity 
                            key={type.value} 
                            style={[
                                styles.typeButton, 
                                transactionType === type.value && { backgroundColor: type.color }
                            ]}
                            onPress={() => setTransactionType(type.value)}
                        >
                            <Text style={[
                                styles.typeButtonText, 
                                transactionType === type.value && { color: 'white' }
                            ]}>
                                {type.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Үндсэн Мэдээлэл</Text>
                <TextInput 
                    style={styles.input} 
                    keyboardType="numeric" 
                    placeholder="Дүн (₮)" 
                    value={amount} 
                    onChangeText={setAmount} 
                />
                <TextInput 
                    style={styles.input} 
                    placeholder="Тайлбар" 
                    value={description} 
                    onChangeText={setDescription} 
                />
                <TouchableOpacity 
                    style={styles.categoryButton} 
                    onPress={() => setShowCategoryModal(true)}
                >
                    <Text style={styles.categoryText}>
                        Категори: {selectedCategory ? selectedCategory.name : 'Сонгох...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6c757d" />
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionHeader}>Давтамж ба Эхлэх Огноо</Text>
                
                <View style={styles.frequencyRow}>
                    {FREQUENCY_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt.value}
                            style={[
                                styles.freqButton, 
                                frequency === opt.value && styles.freqButtonActive
                            ]}
                            onPress={() => setFrequency(opt.value)}
                        >
                            <Text style={[
                                styles.freqText, 
                                frequency === opt.value && styles.freqTextActive
                            ]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <Text style={styles.inputLabel}>Эхлэх Огноо:</Text>
                <TouchableOpacity 
                    style={styles.datePickerButton} 
                    onPress={() => setShowDatePicker(true)}
                >
                    <Text style={styles.datePickerText}>{startDate.toLocaleDateString()}</Text>
                    <Ionicons name="calendar-outline" size={24} color="#6c757d" />
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker 
                        value={startDate} 
                        mode="date" 
                        display="default" 
                        onChange={(e, d) => { 
                            setShowDatePicker(false); 
                            d && setStartDate(d); 
                        }} 
                    />
                )}
            </View>

            <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveSchedule} 
                disabled={isSaving}
            >
                {isSaving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Төлөвлөгөө Хадгалах</Text>
                )}
            </TouchableOpacity>

            {renderCategoryModal()}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        padding: 20,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 20,
    },
    section: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
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
    typeSelectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 15,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
    },
    typeButtonText: {
        fontWeight: 'bold',
        color: '#6c757d',
    },
    categoryButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        marginBottom: 15,
        backgroundColor: '#f9f9f9',
    },
    categoryText: {
        fontSize: 16,
        color: '#343a40',
    },
    frequencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    freqButton: {
        flex: 1,
        paddingVertical: 10,
        marginHorizontal: 5,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        alignItems: 'center',
    },
    freqButtonActive: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    freqText: {
        fontSize: 14,
        color: '#6c757d',
    },
    freqTextActive: {
        color: 'white',
        fontWeight: 'bold',
    },
    inputLabel: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 5,
    },
    datePickerButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eee',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#f9f9f9',
    },
    datePickerText: {
        fontSize: 16,
        color: '#343a40',
    },
    saveButton: {
        backgroundColor: '#28a745',
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 20,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        width: '90%',
        maxHeight: '70%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
        color: '#343a40',
    },
    categoryList: {
        maxHeight: 300,
    },
    categoryItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    categoryItemText: {
        fontSize: 16,
        color: '#343a40',
    },
    modalCloseButton: {
        backgroundColor: '#6c757d',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    modalCloseText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default AddRecurringTransactionScreen;