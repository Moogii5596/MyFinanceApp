import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Modal, Button } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment, getDoc, getDocs, runTransaction } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { scheduleBudgetNotification } from '../utils/notificationManager';
import { useUser } from '../contexts/UserContext';

import { validateTransactionData, sanitizeTransactionData } from '../utils/dataValidator';

const RECURRENCE_OPTIONS = [
    { label: 'Нэг удаа', value: 'once' },
    { label: 'Өдөр бүр', value: 'daily' },
    { label: 'Долоо хоног бүр', value: 'weekly' },
    { label: 'Сар бүр', value: 'monthly' },
    { label: 'Жил бүр', value: 'yearly' },
];

const AddTransactionScreen = () => {

    const navigation = useNavigation();
    const route = useRoute();
    const transactionId = route.params?.transactionId;
    const initialType = route.params?.type || 'expense';
    const userId = AUTH.currentUser?.uid;
    const { userProfile } = useUser();
    const groupId = userProfile?.currentGroupId || null;

    // Гүйлгээний төлөвүүд
    const [type, setType] = useState(initialType);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(new Date());
    const [wallet, setWallet] = useState(null);
    const [category, setCategory] = useState(null);
    const [recurrence, setRecurrence] = useState('once');

    // Firebase-ээс татах жагсаалтууд
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);

    // UI-д шаардлагатай төлөв
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Засах горимын төлөв
    const [originalTransaction, setOriginalTransaction] = useState(null);

    // ====================================================================
    // А. Firebase Мэдээлэл Татах ба Засах Горимыг Тохируулах
    // ====================================================================
    useEffect(() => {
        if (!userId) return;

        // Данс татах
        const qWallets = query(collection(DB, "wallets"), where("userId", "==", userId));
        const unsubscribeWallets = onSnapshot(qWallets, (snapshot) => {
            const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWallets(walletsData);
            
            // Үндсэн дансыг автоматаар сонгох
            const defaultWallet = walletsData.find(w => w.isDefault);
            if (defaultWallet) {
                setWallet(defaultWallet);
            } else if (walletsData.length > 0 && !wallet) {
                setWallet(walletsData[0]);
            }
        });

        // Категори татах
        const qCategories = query(collection(DB, "categories"), where("userId", "==", userId));
        const unsubscribeCategories = onSnapshot(qCategories, (snapshot) => {
            const categoriesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(categoriesData);
        });

        // Хэрэв ID дамжуулсан бол засах горим
        if (transactionId) {
            navigation.setOptions({ title: 'Гүйлгээ Засах' });
            const fetchTransaction = async () => {
                const docRef = doc(DB, "transactions", transactionId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    // Огноог аюулгүйгээр хөрвүүлэх
                    const dateValue = data.date 
                        ? (data.date.toDate ? data.date.toDate() : new Date(data.date))
                        : new Date();
                    
                    setOriginalTransaction({ ...data, id: docSnap.id });
                    setType(data.type);
                    setAmount(Math.abs(data.amount).toString());
                    setDescription(data.description);
                    setDate(dateValue);
                    setWallet({ id: data.walletId, name: 'Loading...' });
                    setCategory({ name: data.category });
                    setRecurrence(data.recurrence);
                }
            };
            fetchTransaction();
        } else {
            navigation.setOptions({ 
                title: initialType === 'income' ? 'Орлого Нэмэх' : 'Зарлага Нэмэх'
            });
        }

        return () => {
            unsubscribeWallets();
            unsubscribeCategories();
        };
    }, [userId, transactionId]);

    // Категориудыг гүйлгээний төрлөөс хамаарч шүүх
    useEffect(() => {
        const filtered = categories.filter(cat => cat.type === type);
        setFilteredCategories(filtered);
        setCategory(null);
    }, [type, categories]);

    // ====================================================================
    // Б. Гүйлгээний Логик (Хадгалах/Шинэчлэх)
    // ====================================================================

    const handleSaveTransaction = async () => {
        const transactionAmount = parseFloat(amount);
        if (isNaN(transactionAmount) || transactionAmount <= 0) {
            Alert.alert('Алдаа', 'Зөв дүнг оруулна уу.');
            return;
        }
        if (!wallet || !category) {
            Alert.alert('Алдаа', 'Данс болон Категорийг сонгоно уу.');
            return;
        }

        try {
            const newAmountValue = type === 'expense' ? -transactionAmount : transactionAmount;
            let balanceChange = newAmountValue;
            let currentWalletId = wallet.id;
            
            if (originalTransaction) {
                // *** Засах Горим (EDIT MODE) ***
                const originalAmount = originalTransaction.amount;
                const originalWalletId = originalTransaction.walletId;
                const reverseAmount = originalAmount * -1;
                
                if (originalWalletId !== currentWalletId) {
                    // Данс солигдсон бол хуучин данснаас буцааж, шинэ дансанд нэмнэ
                    await updateDoc(doc(DB, "wallets", originalWalletId), {
                        balance: increment(reverseAmount)
                    });
                } else {
                    // Данс солигдоогүй бол: (Шинэ дүн - Хуучин дүн)
                    balanceChange = newAmountValue - originalAmount;
                }

                // Шинэ утгаар дансыг шинэчлэх
                const walletRef = doc(DB, "wallets", currentWalletId);
                await updateDoc(walletRef, {
                    balance: increment(balanceChange)
                });

                // Гүйлгээг Firestore-д шинэчлэх
                const transactionRef = doc(DB, "transactions", transactionId);
                await updateDoc(transactionRef, {
                    type: type,
                    amount: newAmountValue,
                    description: description || 'Тайлбаргүй',
                    date: date.getTime(),
                    walletId: currentWalletId,
                    category: category.name,
                    recurrence: recurrence,
                    updatedAt: serverTimestamp(),
                });
                
                setSuccessMessage('Гүйлгээ амжилттай засагдлаа!');
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }, 1500);

            } else {
                // *** Нэмэх Горим (ADD MODE) ***
                await runTransaction(DB, async (transaction) => {
                    const transactionData = {
                        userId: userId,
                        type: type.toUpperCase(),
                        amount: newAmountValue,
                        description: description || 'Тайлбаргүй',
                        date: date,
                        walletId: currentWalletId,
                        category: category.name,
                        recurrence: recurrence,
                        groupId: groupId,
                        createdAt: serverTimestamp(),
                    };
                    
                    // Validate transaction data
                    validateTransactionData(transactionData);
                    const sanitizedData = sanitizeTransactionData(transactionData);
                    
                    // Гүйлгээ нэмэх
                    const transactionRef = doc(collection(DB, "transactions"));
                    transaction.set(transactionRef, sanitizedData);

                    // Дансны үлдэгдлийг шинэчлэх
                    const walletRef = doc(DB, "wallets", currentWalletId);
                    const walletDoc = await transaction.get(walletRef);
                    const currentBalance = walletDoc.data()?.balance || 0;
                    transaction.update(walletRef, {
                        balance: currentBalance + balanceChange
                    });
                });

                // Төсөвтэй холбох - зөвхөн зардлын үед
                if (type === 'expense' && category.name) {
                    const transactionDate = date;
                    const monthYear = new Date(transactionDate).toISOString().substring(0, 7);

                    const qBudget = query(
                        collection(DB, 'budgets'),
                        where('userId', '==', userId),
                        where('type', '==', 'main'),
                        where('monthYear', '==', monthYear)
                    );
                    
                    const budgetSnapshot = await getDocs(qBudget);

                    if (!budgetSnapshot.empty) {
                        const budgetDoc = budgetSnapshot.docs[0];
                        const budgetRef = budgetDoc.ref;
                        const budgetData = budgetDoc.data();
                        
                        const allocatedCategoryIndex = budgetData.allocatedCategories?.findIndex(
                            c => c.name === category.name
                        );

                        if (allocatedCategoryIndex !== -1) {
                            const currentCategory = budgetData.allocatedCategories[allocatedCategoryIndex];
                            const newSpent = (currentCategory.spent || 0) + transactionAmount;
                            const percentage = (newSpent / currentCategory.allocated) * 100;
                            
                            const newAllocatedCategories = budgetData.allocatedCategories.map((cat, index) => {
                                if (index === allocatedCategoryIndex) {
                                    return {
                                        ...cat,
                                        spent: newSpent
                                    };
                                }
                                return cat;
                            });

                            await updateDoc(budgetRef, {
                                allocatedCategories: newAllocatedCategories
                            });
                            
                            // Төсвийн сануулга илгээх (80% ба 100%)
                            if (percentage >= 100) {
                                await scheduleBudgetNotification(
                                    category.name, 
                                    Math.round(newSpent), 
                                    Math.round(currentCategory.allocated), 
                                    Math.round(percentage)
                                );
                            } else if (percentage >= 80 && ((currentCategory.spent || 0) / currentCategory.allocated) * 100 < 80) {
                                await scheduleBudgetNotification(
                                    category.name, 
                                    Math.round(newSpent), 
                                    Math.round(currentCategory.allocated), 
                                    Math.round(percentage)
                                );
                            }
                        }
                    }
                }

                setSuccessMessage('Гүйлгээ амжилттай нэмэгдлээ!');
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    navigation.goBack();
                }, 1500);
            }
            
        } catch (error) {
            console.error('Гүйлгээний үйлдэл амжилтгүй боллоо:', error);
            Alert.alert(
                'Алдаа гарлаа', 
                'Гүйлгээг хадгалах явцад асуудал үүслээ. Сүлжээний холболтоо шалгаад дахин оролдоно уу.'
            );
        }
    };

    // ====================================================================
    // В. UI Components
    // ====================================================================

    // Select input функц - Manage товчлуур Modal-д байна
    const renderSelectWithManage = (label, value, modalKey) => (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity 
                style={styles.selectInput} 
                onPress={() => { setModalType(modalKey); setModalVisible(true); }}
            >
                <Text style={styles.selectText}>{value}</Text>
                <Ionicons name="chevron-down" size={20} color="#6c757d" />
            </TouchableOpacity>
        </View>
    );

    const onDateChange = (event, selectedDate) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDate(selectedDate);
        }
    };
    
    // Dropdown Modal
    const renderModal = () => {
        const isWalletModal = modalType === 'wallet';
        const isCategoryModal = modalType === 'category';
        const isRecurrenceModal = modalType === 'recurrence';
        
        let data = [];
        let title = '';
        let onSelect = () => {};
        let manageRoute = '';
        let manageLabel = '';

        if (isWalletModal) {
            data = wallets;
            title = 'Данс Сонгох';
            onSelect = (item) => { setWallet(item); setModalVisible(false); };
            manageRoute = 'ManageWalletsFromAdd';
            manageLabel = 'Данс Удирдах';
        } else if (isCategoryModal) {
            data = filteredCategories;
            title = 'Категори Сонгох';
            onSelect = (item) => { setCategory(item); setModalVisible(false); };
            manageRoute = 'ManageCategoriesFromAdd';
            manageLabel = 'Категори Удирдах';
        } else if (isRecurrenceModal) {
            data = RECURRENCE_OPTIONS;
            title = 'Давтамж Сонгох';
            onSelect = (item) => { setRecurrence(item.value); setModalVisible(false); };
        }

        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        
                        {/* 💡 УДИРДАХ ТОВЧЛУУРЫН ХЭСЭГ */}
                        {(isWalletModal || isCategoryModal) && (
                            <TouchableOpacity 
                                style={styles.manageInModalButton}
                                onPress={() => { 
                                    setModalVisible(false);
                                    navigation.navigate(manageRoute);
                                }}
                            >
                                <Ionicons name="settings-outline" size={18} color="#fff" style={{marginRight: 8}} />
                                <Text style={styles.manageInModalText}>{manageLabel}</Text>
                            </TouchableOpacity>
                        )}
                        {/* ---------------------------------- */}

                        {/* Хайлт хийх input - зөвхөн Категорид */}
                        {isCategoryModal && (
                            <TextInput
                                style={styles.modalSearchInput}
                                placeholder="Хайлт хийх..."
                                onChangeText={setSearchTerm}
                                value={searchTerm}
                            />
                        )}

                        <ScrollView style={styles.modalScroll}>
                            {data.map((item, index) => (
                                <TouchableOpacity 
                                    key={index} 
                                    style={styles.modalItem} 
                                    onPress={() => onSelect(item)}
                                >
                                    <View>
                                        <Text style={{fontSize: 16}}>{item.label || item.name || item.value}</Text>
                                        {isCategoryModal && <Text style={{fontSize: 12, color: '#6c757d'}}>{item.type === 'income' ? 'Орлого' : 'Зарлага'}</Text>}
                                        {isWalletModal && <Text style={styles.modalItemBalance}>{item.balance ? item.balance.toLocaleString() : 0} ₮</Text>}
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <Button title="Буцах" onPress={() => setModalVisible(false)} color="#6c757d" />
                    </View>
                </View>
            </Modal>
        );
    };

    // ====================================================================
    // Г. Үндсэн UI
    // ====================================================================

    return (
        <View style={styles.wrapper}>
            <ScrollView style={styles.container}>
                {renderModal()}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => setType('expense')} style={[styles.typeButton, type === 'expense' && styles.typeButtonActiveExpense]}>
                    <Text style={[styles.typeText, type === 'expense' && styles.typeTextActive]}>ЗАРЛАГА</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setType('income')} style={[styles.typeButton, type === 'income' && styles.typeButtonActiveIncome]}>
                    <Text style={[styles.typeText, type === 'income' && styles.typeTextActive]}>ОРЛОГО</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Дүн</Text>
                <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                />
            </View>

            {/* Данс Сонгох */}
            {renderSelectWithManage(
                'Данс', 
                wallet ? wallet.name : 'Данс сонгох',
                'wallet'
            )}

            {/* Категори Сонгох */}
            {renderSelectWithManage(
                'Категори', 
                category ? category.name : 'Категори сонгох',
                'category'
            )}
            {filteredCategories.length === 0 && (
                <Text style={styles.alertText}>⚠️ Категори байхгүй. Тохиргоо хэсгээс нэмнэ үү.</Text>
            )}

            {/* Огноо */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Огноо</Text>
                <TouchableOpacity style={styles.selectInput} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.selectText}>{date.toLocaleDateString()}</Text>
                    <Ionicons name="calendar-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                    />
                )}
            </View>
            
            {/* Давтамж */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Давтамж</Text>
                <TouchableOpacity style={styles.selectInput} onPress={() => { setModalType('recurrence'); setModalVisible(true); }}>
                    <Text style={styles.selectText}>{RECURRENCE_OPTIONS.find(o => o.value === recurrence)?.label}</Text>
                    <Ionicons name="repeat-outline" size={20} color="#6c757d" />
                </TouchableOpacity>
            </View>

            {/* Тайлбар */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Тайлбар (Заавал биш)</Text>
                <TextInput
                    style={[styles.input, { height: 80 }]}
                    placeholder="Дэлгэрэнгүй мэдээлэл..."
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveTransaction}>
                <Text style={styles.saveButtonText}>{transactionId ? 'Засварыг Хадгалах' : 'Гүйлгээ Хадгалах'}</Text>
            </TouchableOpacity>

                <View style={{height: 50}}/>
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
    container: { flex: 1, backgroundColor: '#f8f9fa', padding: 15 },
    header: { flexDirection: 'row', marginBottom: 20, borderRadius: 10, overflow: 'hidden' },
    typeButton: { flex: 1, paddingVertical: 15, alignItems: 'center', backgroundColor: '#e9ecef' },
    typeButtonActiveExpense: { backgroundColor: '#dc3545' },
    typeButtonActiveIncome: { backgroundColor: '#28a745' },
    typeText: { fontSize: 16, fontWeight: 'bold', color: '#495057' },
    typeTextActive: { color: '#fff' },
    inputGroup: { marginBottom: 15 },
    label: { fontSize: 14, color: '#495057', marginBottom: 5, fontWeight: 'bold' },
    input: { height: 50, borderColor: '#ced4da', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#fff' },
    selectInput: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 50, borderColor: '#ced4da', borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, backgroundColor: '#fff' },
    selectText: { fontSize: 16, color: '#343a40' },
    alertText: { fontSize: 12, color: '#dc3545', marginTop: 5 },
    saveButton: { backgroundColor: '#007bff', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    centeredView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalView: { margin: 20, backgroundColor: 'white', borderRadius: 10, padding: 35, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5, width: '80%', maxHeight: '70%' },
    modalTitle: { marginBottom: 15, textAlign: 'center', fontWeight: 'bold', fontSize: 18 },
    modalScroll: { width: '100%' },
    modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#f1f1f1', width: '100%' },
    manageInModalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#007bff',
        padding: 10,
        borderRadius: 8,
        width: '100%',
        marginBottom: 15,
    },
    manageInModalText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalItemBalance: {
        fontSize: 14,
        color: '#28a745',
        fontWeight: 'bold',
    },
    modalSearchInput: {
        height: 40,
        borderColor: '#ced4da',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 10,
        width: '100%',
    },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    successContainer: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginTop: 15, marginBottom: 10 },
    successMessage: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
});

export default AddTransactionScreen;
