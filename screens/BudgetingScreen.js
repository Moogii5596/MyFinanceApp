import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import { DB, AUTH } from '../firebaseConfig';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { formatMoney } from '../utils/formatMoney';
import { successNotificationStyles } from '../styles/sharedStyles';
import { usePremium } from '../contexts/PremiumContext';

const DUMMY_EXPENSE_CATEGORIES = ['Хүнс', 'Түрээс', 'Тээвэр', 'Зугаа', 'Төлбөр', 'Хувцас', 'Бусад Зарлага'];

const BudgetingScreen = ({ navigation }) => {

    const { isPremium, isLoadingPremium } = usePremium();
    const [budgets, setBudgets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    
    const [newCategory, setNewCategory] = useState(DUMMY_EXPENSE_CATEGORIES[0]);
    const [newAmount, setNewAmount] = useState('');
    
    const currentGroupId = AUTH.currentUser?.uid || 'default';

    useEffect(() => {
        if (!AUTH.currentUser) return;
        
        // Төсвүүд татах
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        const budgetsQuery = query(
            collection(DB, "budgets"),
            where("groupId", "==", currentGroupId)
        );

        const unsubscribeBudgets = onSnapshot(budgetsQuery, (snapshot) => {
            const allBudgets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            const currentBudgets = allBudgets.filter(budget => 
                budget.periodEnd && budget.periodEnd.toDate() >= startOfMonth
            );
            setBudgets(currentBudgets);
            setIsLoading(false);
        });

        return () => {
            unsubscribeBudgets();
        };
    }, [currentGroupId]);

    const handleSaveBudget = async () => {
        const amount = parseFloat(newAmount);
        if (isNaN(amount) || amount <= 0 || !newCategory) {
            Alert.alert("Анхааруулга", "Төсвийн хэмжээ болон категорийг зөв оруулна уу.");
            return;
        }
        
        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const existingBudget = budgets.find(b => b.category === newCategory);
        if (existingBudget) {
            Alert.alert("Анхааруулга", `${newCategory} категорид аль хэдийн төсөв үүссэн байна.`);
            return;
        }

        setIsSaving(true);
        try {
            await addDoc(collection(DB, "budgets"), {
                groupId: currentGroupId,
                category: newCategory,
                budgetAmount: amount,
                period: 'Monthly',
                periodStart: periodStart,
                periodEnd: periodEnd,
                createdAt: new Date(),
            });

            setNewAmount('');
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 1500);
        } catch (error) {
            console.error("Error adding budget: ", error);
            Alert.alert("Алдаа", "Төсөв нэмж чадсангүй.");
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteBudget = (id) => {
        Alert.alert(
            "Баталгаажуулалт",
            "Та энэ төсвийг устгахдаа итгэлтэй байна уу?",
            [
                { text: "Буцах", style: "cancel" },
                { 
                    text: "Устгах", 
                    style: "destructive", 
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(DB, "budgets", id));
                            setSuccessMessage("Төсөв устгагдлаа.");
                            setShowSuccess(true);
                            setTimeout(() => {
                                setShowSuccess(false);
                            }, 1500);
                        } catch (error) {
                            console.error("Error deleting budget: ", error);
                            Alert.alert("Алдаа", "Устгаж чадсангүй.");
                        }
                    }
                }
            ]
        );
    };

    const calculateSpent = (budget) => {
        return Math.floor(Math.random() * budget.budgetAmount);
    };
    
    const renderBudgetItem = ({ item }) => {
        const spent = calculateSpent(item);
        const remaining = item.budgetAmount - spent;
        const percentage = (spent / item.budgetAmount) * 100;
        
        let progressBarColor = '#28a745';
        if (percentage > 100) {
            progressBarColor = '#dc3545';
        } else if (percentage > 80) {
            progressBarColor = '#ffc107';
        } else if (percentage > 50) {
            progressBarColor = '#007bff';
        }
        
        return (
            <View style={styles.budgetItem}>
                <View style={styles.budgetHeader}>
                    <Text style={styles.budgetCategory}>{item.category}</Text>
                    <TouchableOpacity onPress={() => handleDeleteBudget(item.id)} style={styles.deleteButton}>
                        <Ionicons name="trash-outline" size={20} color="#dc3545" />
                    </TouchableOpacity>
                </View>
                
                <View style={styles.financeRow}>
                    <Text style={styles.labelAmount}>Төсөв:</Text>
                    <Text style={styles.valueAmount}>{formatMoney(item.budgetAmount)}</Text>
                </View>
                <View style={styles.financeRow}>
                    <Text style={styles.labelAmount}>Зарцуулсан:</Text>
                    <Text style={[styles.valueAmount, {color: progressBarColor, fontWeight: 'bold'}]}>{formatMoney(spent)}</Text>
                </View>

                <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBar, { width: `${Math.min(100, percentage)}%`, backgroundColor: progressBarColor }]} />
                </View>

                <View style={styles.statusRow}>
                    <Text style={styles.remainingText}>
                        {remaining >= 0 ? 'Үлдсэн:' : 'Хэтэрсэн:'}
                    </Text>
                    <Text style={[styles.remainingValue, { color: remaining >= 0 ? '#28a745' : '#dc3545' }]}>
                        {formatMoney(Math.abs(remaining))}
                    </Text>
                </View>
            </View>
        );
    };

    const renderHeader = () => (
        <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Төсөвлөлт</Text>
            
            <View style={styles.addSection}>
                <Text style={styles.addSectionHeader}>🗓️ Энэ Сарын Төсөв Нэмэх</Text>
                <View style={styles.inputRow}>
                    <View style={[styles.pickerContainer, { flex: 1.5 }]}>
                        <Picker
                            selectedValue={newCategory}
                            onValueChange={(itemValue) => setNewCategory(itemValue)}
                            style={styles.picker}
                            enabled={!isSaving}
                        >
                            {DUMMY_EXPENSE_CATEGORIES.map(cat => (
                                <Picker.Item key={cat} label={cat} value={cat} />
                            ))}
                        </Picker>
                    </View>
                    
                    <TextInput
                        style={[styles.input, { 
                            flex: 2, 
                            marginLeft: 10,
                            flexShrink: 1,
                            minWidth: 80,
                            backgroundColor: '#FFFFFF',
                            color: '#000000',
                            borderColor: '#E0E0E0'
                        }]}
                        placeholder="Төсвийн Хэмжээ (₮)"
                        keyboardType="numeric"
                        value={newAmount}
                        onChangeText={setNewAmount}
                        editable={!isSaving}
                        placeholderTextColor="#666666"
                    />
                </View>
                
                <TouchableOpacity style={styles.addButton} onPress={handleSaveBudget} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Төсөв Нэмэх</Text>}
                </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionHeader}>Одоогийн Идэвхтэй Төсвүүд ({new Date().toLocaleDateString('mn-MN', { month: 'long', year: 'numeric' })})</Text>
        </View>
    );

    if (isLoading || isLoadingPremium) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color="#007bff" />
            </View>
        );
    }
    
    if (!isPremium) {
        return (
            <View style={styles.premiumGate}>
                <Ionicons name="lock-closed-outline" size={50} color="#dc3545" />
                <Text style={styles.premiumHeader}>Premium Шаардлагатай</Text>
                <Text style={styles.premiumText}>Төсөвлөлт зөвхөн Premium хэрэглэгчдэд нээлттэй.</Text>
                <TouchableOpacity style={styles.premiumButton} onPress={() => Alert.alert('Premium', 'Premium худалдан авах хуудас руу шилжих.')}>
                    <Text style={styles.premiumButtonText}>Premium Авах</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <View style={[styles.container, { backgroundColor: '#f9f9f9' }]}>
                <FlatList
                    data={budgets}
                    keyExtractor={item => item.id}
                    renderItem={renderBudgetItem}
                    ListHeaderComponent={renderHeader}
                    contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
                    ListEmptyComponent={!isLoading && <Text style={[styles.emptyText, { color: '#666666' }]}>Та энэ сард төсөвлөлт хийгээгүй байна.</Text>}
                />
                
                {/* Сарын төсөв үүсгэх товч */}
                <View style={[styles.floatingButtonContainer, { backgroundColor: '#FFFFFF', borderTopColor: '#E0E0E0' }]}>
                    <TouchableOpacity 
                        style={[styles.createButton, { backgroundColor: '#007AFF' }]}
                        onPress={() => navigation.navigate('AddBudgetScreen')}
                    >
                        <Text style={styles.createButtonText}>Сарын Төсөв Үүсгэх</Text>
                    </TouchableOpacity>
                </View>
                
                {showSuccess && (
                    <View style={successNotificationStyles.successOverlay}>
                        <View style={successNotificationStyles.successContainer}>
                            <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                            <Text style={successNotificationStyles.successTitle}>Амжилттай!</Text>
                            <Text style={successNotificationStyles.successMessage}>Төсөв амжилттай нэмэгдлээ</Text>
                        </View>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    listContent: { padding: 20, paddingBottom: 80 },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#343a40', marginBottom: 20 },
    
    addSection: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 25, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    addSectionHeader: { fontSize: 16, fontWeight: 'bold', color: '#007bff', marginBottom: 15 },
    inputRow: { flexDirection: 'row', justifyContent: 'space-between' },
    input: { backgroundColor: '#f9f9f9', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', height: 45 },
    pickerContainer: { flex: 1, backgroundColor: '#f9f9f9', borderRadius: 8, borderWidth: 1, borderColor: '#eee', justifyContent: 'center', height: 45, overflow: 'hidden' },
    picker: { height: 45, width: '100%' },
    addButton: { backgroundColor: '#007bff', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    sectionHeader: { fontSize: 18, fontWeight: 'bold', color: '#343a40', marginTop: 15, marginBottom: 15 },

    budgetItem: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 12, elevation: 1, borderWidth: 1, borderColor: '#e9ecef' },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    budgetCategory: { fontSize: 17, fontWeight: 'bold', color: '#343a40' },
    deleteButton: { padding: 5 },

    financeRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 },
    labelAmount: { fontSize: 14, color: '#6c757d' },
    valueAmount: { fontSize: 15, fontWeight: '600', color: '#343a40' },
    
    progressBarContainer: { height: 10, backgroundColor: '#e9ecef', borderRadius: 5, marginVertical: 10, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 5 },
    
    statusRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#f8f9fa', paddingTop: 10, marginTop: 5 },
    remainingText: { fontSize: 15, color: '#6c757d', fontWeight: '500' },
    remainingValue: { fontSize: 16, fontWeight: 'bold' },

    emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16 },
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 15,
        paddingBottom: 35,
        borderTopWidth: 1,
    },
    createButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    createButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    
    premiumGate: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, backgroundColor: '#f4f7f6' },
    premiumHeader: { fontSize: 24, fontWeight: 'bold', color: '#343a40', marginTop: 15, marginBottom: 10 },
    premiumText: { fontSize: 16, color: '#6c757d', textAlign: 'center', marginBottom: 20 },
    premiumButton: { backgroundColor: '#007bff', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25 },
    premiumButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default BudgetingScreen;