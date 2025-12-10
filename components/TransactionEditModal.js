import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DB, AUTH } from '../firebaseConfig';
import { doc, updateDoc, deleteDoc, collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { formatMoney } from '../utils/formatMoney';



const TransactionEditModal = ({ isVisible, onClose, transaction, onTransactionUpdated, onTransactionDeleted }) => {
    
    const [entryType, setEntryType] = useState(transaction?.type || 'expense');
    const [amount, setAmount] = useState(String(transaction?.amount || ''));
    const [description, setDescription] = useState(transaction?.note || '');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    
    const categories = allCategories.filter(c => c.type === entryType);

    useEffect(() => {
        if (!AUTH.currentUser) return;

        const q = query(
            collection(DB, "categories"),
            where("userId", "==", AUTH.currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllCategories(list);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (transaction) {
            setEntryType(transaction.type);
            setAmount(String(transaction.amount));
            setDescription(transaction.note || '');
            
            const initialCategory = allCategories.find(c => c.name === transaction.category);
            setSelectedCategory(initialCategory);
        }
    }, [transaction]);

    const handleUpdateTransaction = async () => {
        if (!AUTH.currentUser || !transaction?.id) return;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || !selectedCategory) {
            Alert.alert("Анхааруулга", "Хэмжээ болон категорийг зөв бөглөнө үү.");
            return;
        }

        setIsLoading(true);
        try {
            const transactionRef = doc(DB, "transactions", transaction.id);
            await updateDoc(transactionRef, {
                type: entryType,
                amount: parsedAmount,
                category: selectedCategory.name,
                categoryIcon: selectedCategory.icon,
                note: description,
            });

            onTransactionUpdated();
            Alert.alert("Амжилттай", "Гүйлгээ амжилттай шинэчлэгдлээ.");
            onClose();

        } catch (error) {
            console.error("Error updating transaction: ", error);
            Alert.alert("Алдаа", "Гүйлгээг шинэчилж чадсангүй.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDeleteTransaction = () => {
        Alert.alert(
            "Баталгаажуулалт",
            "Та энэ гүйлгээг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.",
            [
                { text: "Буцах", style: "cancel" },
                { text: "Устгах", style: "destructive", onPress: confirmDelete }
            ]
        );
    };

    const confirmDelete = async () => {
        if (!AUTH.currentUser || !transaction?.id) return;
        
        setIsLoading(true);
        try {
            const transactionRef = doc(DB, "transactions", transaction.id);
            await deleteDoc(transactionRef);

            onTransactionDeleted();
            Alert.alert("Амжилттай", "Гүйлгээ устгагдлаа.");
            onClose();

        } catch (error) {
            console.error("Error deleting transaction: ", error);
            Alert.alert("Алдаа", "Гүйлгээг устгаж чадсангүй.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!transaction) return null;

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <ScrollView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Гүйлгээ Засах/Устгах</Text>
                    <TouchableOpacity onPress={onClose} disabled={isLoading}>
                        <Ionicons name="close-circle-outline" size={32} color="#6c757d" />
                    </TouchableOpacity>
                </View>
                
                <Text style={styles.dateText}>
                    Огноо: {transaction.date?.toDate()?.toLocaleDateString('mn-MN') || 'N/A'}
                </Text>

                <View style={styles.toggleContainer}>
                    <TouchableOpacity
                        style={[styles.toggleButton, entryType === 'income' && styles.activeIncome]}
                        onPress={() => setEntryType('income')}
                        disabled={isLoading}
                    >
                        <Text style={[styles.toggleText, entryType === 'income' && styles.activeText]}>Орлого</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.toggleButton, entryType === 'expense' && styles.activeExpense]}
                        onPress={() => setEntryType('expense')}
                        disabled={isLoading}
                    >
                        <Text style={[styles.toggleText, entryType === 'expense' && styles.activeText]}>Зарлага</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.label}>Хэмжээ</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                    editable={!isLoading}
                    placeholder="Хэмжээ (₮)"
                />

                <Text style={styles.label}>Категори</Text>
                <View style={styles.categoryGrid}>
                    {categories.map((item) => (
                        <TouchableOpacity
                            key={item.name}
                            style={[
                                styles.categoryItem,
                                selectedCategory?.name === item.name && styles.selectedCategory
                            ]}
                            onPress={() => setSelectedCategory(item)}
                            disabled={isLoading}
                        >
                            <Ionicons name={item.icon} size={24} color={selectedCategory?.name === item.name ? 'white' : '#6c757d'} />
                            <Text style={[styles.categoryText, selectedCategory?.name === item.name && styles.selectedText]}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
                
                <Text style={styles.label}>Тэмдэглэл</Text>
                 <TextInput
                    style={[styles.input, styles.noteInput]}
                    placeholder="Тэмдэглэл"
                    value={description}
                    onChangeText={setDescription}
                    multiline={true}
                    numberOfLines={3}
                    editable={!isLoading}
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.actionButton, styles.updateButton]}
                        onPress={handleUpdateTransaction}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.buttonText}>Шинэчлэх</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={handleDeleteTransaction}
                        disabled={isLoading}
                    >
                        <Ionicons name="trash-outline" size={20} color="white" />
                        <Text style={styles.buttonText}>Устгах</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
    },
    dateText: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 15,
        textAlign: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e9ecef',
        borderRadius: 12,
        marginBottom: 25,
        overflow: 'hidden',
    },
    toggleButton: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
    },
    activeIncome: { backgroundColor: '#28a745' },
    activeExpense: { backgroundColor: '#dc3545' },
    toggleText: { fontSize: 16, color: '#6c757d', fontWeight: '600' },
    activeText: { color: 'white', fontWeight: 'bold' },
    label: { fontSize: 14, fontWeight: 'bold', color: '#343a40', marginBottom: 8, marginTop: 10 },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    noteInput: { fontSize: 16, textAlign: 'left', height: 100, },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20, },
    categoryItem: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: '#e9ecef', },
    selectedCategory: { backgroundColor: '#007bff', borderColor: '#007bff', elevation: 5, },
    categoryText: { color: '#343a40', fontSize: 14, marginTop: 5, textAlign: 'center', fontWeight: '600', },
    selectedText: { color: 'white', },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 30,
        marginBottom: 40,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        flex: 1,
        marginHorizontal: 5,
    },
    updateButton: { backgroundColor: '#007bff', marginRight: 10, },
    deleteButton: { backgroundColor: '#dc3545', marginLeft: 10, },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 5 },
});

export default TransactionEditModal;