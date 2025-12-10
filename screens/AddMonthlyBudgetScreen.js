import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDocs, deleteDoc, getDoc } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';

const AddMonthlyBudgetScreen = ({ route }) => {
    const navigation = useNavigation();
    const userId = AUTH.currentUser?.uid;

    const { budgetId, editingCategory, monthYear: routeMonthYear } = route?.params || {};
    const currentMonthYear = new Date().toISOString().substring(0, 7);
    
    const [allCategories, setAllCategories] = useState([]);
    const [totalIncome, setTotalIncome] = useState('');
    const [allocatedCategories, setAllocatedCategories] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [monthYear, setMonthYear] = useState(routeMonthYear || currentMonthYear);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [existingBudget, setExistingBudget] = useState(null);
    const [categoryAmount, setCategoryAmount] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!userId) return;
        
        const qCategories = query(
            collection(DB, "categories"), 
            where("userId", "==", userId), 
            where("type", "==", "expense")
        );
        
        const unsubscribe = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ 
                name: doc.data().name, 
                id: doc.id 
            }));
            setAllCategories(categoriesData);
        });

        return () => unsubscribe();
    }, [userId]);

    useEffect(() => {
        if (editingCategory && budgetId) {
            navigation.setOptions({ 
                title: `${editingCategory} төсвийг засах (${routeMonthYear})` 
            });

            const fetchBudgetDetails = async () => {
                const docRef = doc(DB, "budgets", budgetId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setExistingBudget({ id: docSnap.id, ...data });
                    
                    const catToEdit = data.allocatedCategories?.find(c => c.name === editingCategory);
                    if (catToEdit) {
                        setCategoryAmount(catToEdit.amount.toString());
                    }
                } else {
                    Alert.alert('Алдаа', 'Үндсэн төсөв олдсонгүй.');
                    navigation.goBack();
                }
            };
            fetchBudgetDetails();
            return;
        }

        if (!userId || !monthYear) return;
        
        const qBudget = query(
            collection(DB, "budgets"), 
            where("userId", "==", userId), 
            where("type", "==", "main"),
            where("monthYear", "==", monthYear)
        );
        
        const unsubscribe = onSnapshot(qBudget, (snapshot) => {
            const budgetDoc = snapshot.docs[0];
            
            if (budgetDoc) {
                const data = { id: budgetDoc.id, ...budgetDoc.data() };
                setExistingBudget(data);
                setTotalIncome(data.totalIncome.toString());
                setAllocatedCategories(data.allocatedCategories || []);
                navigation.setOptions({ title: `${monthYear} Сарын Төсөв Засах` });
            } else {
                setExistingBudget(null);
                setTotalIncome('');
                setAllocatedCategories([]);
                navigation.setOptions({ title: `${monthYear} Сарын Шинэ Төсөв` });
            }
        });

        return () => unsubscribe();
    }, [userId, monthYear]);

    const handleAllocationChange = (categoryName, value) => {
        setAllocatedCategories(prev => 
            prev.map(cat => 
                cat.name === categoryName 
                ? { ...cat, amount: parseFloat(value) || 0 } 
                : cat
            )
        );
    };

    const handleAddCategory = (categoryName) => {
        if (!allocatedCategories.some(c => c.name === categoryName)) {
            setAllocatedCategories(prev => [...prev, { name: categoryName, amount: 0 }]);
        }
    };
    
    const handleRemoveCategory = (categoryName) => {
        setAllocatedCategories(prev => prev.filter(cat => cat.name !== categoryName));
    };

    const totalAllocated = allocatedCategories.reduce((sum, cat) => sum + cat.amount, 0);
    const totalIncomeNum = parseFloat(totalIncome) || 0;
    const remainingToAllocate = totalIncomeNum - totalAllocated;

    const handleDateChange = (event, selectedDate) => {
        const currentDate = selectedDate || new Date();
        setIsPickerVisible(Platform.OS === 'ios');

        if (event.type === 'set') {
            setSelectedDate(currentDate);
            const newMonthYear = currentDate.toISOString().substring(0, 7);
            setMonthYear(newMonthYear);
        }
    };

    const showPicker = () => {
        setIsPickerVisible(true);
    };

    const calculatePastSpending = async (categoriesToAllocate, monthYear) => {
        const [year, month] = monthYear.split('-').map(Number);
        const startDate = new Date(year, month - 1, 1).getTime();
        const endDate = new Date(year, month, 0, 23, 59, 59).getTime();
        
        const qTransactions = query(
            collection(DB, "transactions"),
            where("userId", "==", userId),
            where("type", "==", "expense")
        );
        
        const transactionSnapshot = await getDocs(qTransactions);
        const categorySpending = {};
        
        transactionSnapshot.forEach(docSnap => {
            const data = docSnap.data();
            const transactionDate = data.date;
            
            if (transactionDate >= startDate && transactionDate <= endDate) {
                const catName = data.category;
                const amount = Math.abs(parseFloat(data.amount)) || 0;
                
                if (categorySpending[catName]) {
                    categorySpending[catName] += amount;
                } else {
                    categorySpending[catName] = amount;
                }
            }
        });

        const updatedCategories = categoriesToAllocate.map(cat => {
            return {
                ...cat,
                spent: categorySpending[cat.name] || 0
            };
        });

        return updatedCategories;
    };

    const handleDeleteBudget = async () => {
        if (!existingBudget) return;

        Alert.alert(
            'Баталгаажуулах',
            `${monthYear} сарын төсвийг устгахдаа итгэлтэй байна уу?`,
            [
                { text: 'Үгүй' },
                { 
                    text: 'Тийм, Устгая', 
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            await deleteDoc(doc(DB, "budgets", existingBudget.id));
                            setSuccessMessage('Төсөв амжилттай устгагдлаа.');
                            setShowSuccess(true);
                            setTimeout(() => {
                                setShowSuccess(false);
                                navigation.goBack();
                            }, 1500);
                        } catch (e) {
                            Alert.alert('Алдаа', 'Устгах үед алдаа гарлаа: ' + e.message);
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const handleSaveMonthlyBudget = async () => {
        if (editingCategory && budgetId && existingBudget) {
            const budgetAmountNum = parseFloat(categoryAmount);
            if (!budgetAmountNum || budgetAmountNum < 0) {
                Alert.alert('Анхааруулга', 'Төсөвлөх дүн 0-ээс бага байж болохгүй.');
                return;
            }

            setIsLoading(true);
            try {
                const budgetRef = doc(DB, "budgets", budgetId);
                const currentCategories = existingBudget.allocatedCategories || [];
                
                const updatedCategories = currentCategories.map(cat => {
                    if (cat.name === editingCategory) {
                        return {
                            ...cat,
                            amount: budgetAmountNum,
                        };
                    }
                    return cat;
                });
                
                await updateDoc(budgetRef, {
                    allocatedCategories: updatedCategories,
                    updatedAt: serverTimestamp(),
                });

                setSuccessMessage(`${editingCategory} категорийн төсвийг ${budgetAmountNum.toLocaleString()}₮ болгон шинэчиллээ.`);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }, 1500);
                return;
                
            } catch (e) {
                Alert.alert('Алдаа', 'Категорийн төсвийг шинэчлэх үед алдаа гарлаа: ' + e.message);
            } finally {
                setIsLoading(false);
            }
        }

        if (remainingToAllocate !== 0) {
            Alert.alert('Анхааруулга', `Нийт орлого болон хуваарилалт тэнцэхгүй байна. ${remainingToAllocate.toLocaleString()}₮ илүү/дутуу байна.`);
            return;
        }

        if (!totalIncomeNum || totalIncomeNum <= 0) {
            Alert.alert('Анхааруулга', 'Тухайн сарын нийт орлогыг оруулна уу.');
            return;
        }
        
        if (allocatedCategories.length === 0) {
            Alert.alert('Анхааруулга', 'Төсөвтөө ангиллууд хуваарилна уу.');
            return;
        }
        
        setIsLoading(true);

        try {
            const categoriesToSave = allocatedCategories.filter(c => c.amount > 0);
            const finalCategoriesToSave = await calculatePastSpending(categoriesToSave, monthYear);

            if (existingBudget) {
                await updateDoc(doc(DB, "budgets", existingBudget.id), {
                    totalIncome: totalIncomeNum,
                    allocatedCategories: finalCategoriesToSave,
                    updatedAt: serverTimestamp(),
                });
                setSuccessMessage(`${monthYear} сарын төсөв шинэчлэгдлээ.`);
            } else {
                await addDoc(collection(DB, "budgets"), {
                    userId: userId,
                    type: 'main',
                    totalIncome: totalIncomeNum,
                    monthYear: monthYear,
                    allocatedCategories: finalCategoriesToSave,
                    createdAt: serverTimestamp(),
                });
                setSuccessMessage(`${monthYear} сарын төсөв амжилттай хадгалагдлаа.`);
            }
            
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                navigation.goBack();
            }, 1500);

        } catch (e) {
            Alert.alert('Алдаа', 'Төсөв хадгалах үед алдаа гарлаа: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderAllocatedItem = (cat) => (
        <View key={cat.name} style={styles.allocatedItem}>
            <Text style={styles.allocatedText}>{cat.name}</Text>
            <View style={styles.inputGroup}>
                <TextInput
                    style={styles.allocationInput}
                    keyboardType="numeric"
                    value={cat.amount > 0 ? cat.amount.toString() : ''}
                    onChangeText={(text) => handleAllocationChange(cat.name, text)}
                />
                <TouchableOpacity onPress={() => handleRemoveCategory(cat.name)} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={24} color="#dc3545" />
                </TouchableOpacity>
            </View>
        </View>
    );
    
    const availableCategories = allCategories.filter(
        cat => !allocatedCategories.some(a => a.name === cat.name)
    );

    if (editingCategory && budgetId) {
        return (
            <ScrollView style={styles.container}>
                <Text style={styles.sectionTitle}>"{editingCategory}" категорийн дүн</Text>
                
                <Text style={styles.label}>Төсөвлөх Дүн (₮)</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Төсөвлөх дүн"
                    keyboardType="numeric"
                    value={categoryAmount}
                    onChangeText={setCategoryAmount}
                    editable={!isLoading}
                />
                
                <TouchableOpacity 
                    style={styles.saveButton} 
                    onPress={handleSaveMonthlyBudget} 
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Шинэчилж байна...' : `${editingCategory}-ийн Төсвийг Шинэчлэх`}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        );
    }

    return (
        <View style={styles.wrapper}>
            <ScrollView style={styles.container}>
            {isPickerVisible && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
            
            <Text style={styles.label}>Төсөвлөх Сар</Text>
            <TouchableOpacity style={styles.selectInput} onPress={showPicker}>
                <Text style={styles.selectText}>{monthYear}</Text>
                <Ionicons name="calendar-outline" size={20} color="#007bff" />
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Сарын Үндсэн Төсөв ({monthYear})</Text>

            <Text style={styles.label}>1. Сарын Нийт Төсөвлөх Дүн (₮)</Text>
            <TextInput
                style={styles.input}
                placeholder="Жишээ нь: 2,500,000"
                keyboardType="numeric"
                value={totalIncome}
                onChangeText={setTotalIncome}
                editable={!isLoading}
            />
            
            <View style={styles.separator} />

            <Text style={styles.label}>2. Төсвөө Категориудад Хуваарилах</Text>
            
            {allocatedCategories.map(renderAllocatedItem)}
            
            {availableCategories.length > 0 && (
                <View style={styles.addCategoryContainer}>
                    <Text style={styles.labelSmall}>Категори Нэмэх:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {availableCategories.map(cat => (
                            <TouchableOpacity 
                                key={cat.id} 
                                style={styles.addCategoryButton}
                                onPress={() => handleAddCategory(cat.name)}
                            >
                                <Text style={styles.addCategoryText}>+ {cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <View style={styles.summaryBox}>
                <Text style={styles.summaryText}>Нийт Төсөвлөсөн Дүн: {totalIncomeNum.toLocaleString() || 0} ₮</Text>
                <Text style={styles.summaryText}>Хуваарилсан: {totalAllocated.toLocaleString()} ₮</Text>
                <Text style={[styles.summaryRemaining, { color: remainingToAllocate === 0 ? '#28a745' : '#dc3545' }]}>
                    Үлдсэн: {remainingToAllocate.toLocaleString()} ₮
                </Text>
            </View>

            <View style={styles.buttonGroup}>
                {existingBudget && (
                    <TouchableOpacity 
                        style={styles.deleteButton} 
                        onPress={handleDeleteBudget}
                        disabled={isLoading}
                    >
                        <Text style={styles.saveButtonText}>Устгах</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity 
                    style={[styles.saveButton, existingBudget && { flex: 1 }]} 
                    onPress={handleSaveMonthlyBudget} 
                    disabled={isLoading}
                >
                    <Text style={styles.saveButtonText}>
                        {isLoading ? 'Хадгалж байна...' : existingBudget ? 'Төсөв Шинэчлэх' : 'Сарын Төсөв Үүсгэх'}
                    </Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
            
            {showSuccess && (
                <View style={styles.successOverlay}>
                    <View style={styles.successContainer}>
                        <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                        <Text style={styles.successTitle}>Амжилттай!</Text>
                        <Text style={styles.successMessage}>{successMessage}</Text>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: { flex: 1 },
    container: { flex: 1, padding: 20, backgroundColor: '#f8f9fa' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#343a40', marginBottom: 10 },
    label: { fontSize: 16, fontWeight: '600', color: '#495057', marginBottom: 5, marginTop: 10 },
    selectInput: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 45,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 15,
        backgroundColor: '#fff',
        marginBottom: 10,
    },
    selectText: { fontSize: 16, color: '#343a40' },
    labelSmall: { fontSize: 14, fontWeight: '500', color: '#6c757d', marginBottom: 5, marginTop: 10 },
    input: { height: 45, borderColor: '#ced4da', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#fff', fontSize: 16 },
    separator: { borderBottomWidth: 1, borderBottomColor: '#e9ecef', marginVertical: 20 },
    allocatedItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 10,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
    },
    allocatedText: { fontSize: 16, fontWeight: '500', width: '40%' },
    inputGroup: { flexDirection: 'row', alignItems: 'center', width: '55%', justifyContent: 'flex-end' },
    allocationInput: { 
        height: 35, 
        width: '70%', 
        borderColor: '#ced4da', 
        borderWidth: 1, 
        borderRadius: 5, 
        paddingHorizontal: 10, 
        backgroundColor: '#f8f9fa',
        textAlign: 'right',
        marginRight: 10,
    },
    removeButton: { padding: 5 },
    addCategoryContainer: { marginTop: 10, marginBottom: 10 },
    addCategoryButton: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        marginTop: 5,
        marginBottom: 5,
    },
    addCategoryText: { color: '#495057', fontWeight: 'bold' },
    summaryBox: { 
        padding: 15, 
        backgroundColor: '#e6f7ff', 
        borderRadius: 8, 
        marginTop: 20,
        borderLeftWidth: 5,
        borderLeftColor: '#007bff',
    },
    summaryText: { fontSize: 15, color: '#343a40' },
    summaryRemaining: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
    buttonGroup: {
        flexDirection: 'row',
        marginTop: 30,
        gap: 10,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    saveButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        flex: 1,
    },
    saveButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    successContainer: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginTop: 15, marginBottom: 10 },
    successMessage: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
});

export default AddMonthlyBudgetScreen;
