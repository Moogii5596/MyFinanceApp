import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, TouchableWithoutFeedback, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { DB, AUTH } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp, query, where, onSnapshot } from 'firebase/firestore';
import WalletSelectorModal from './WalletSelectorModal';



const QuickEntryModal = ({ isVisible, onClose, initialType }) => {
    const navigation = useNavigation();

    
    // 💡 Төлөвүүд
    const [entryType, setEntryType] = useState(initialType || 'expense');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedWallet, setSelectedWallet] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [allCategories, setAllCategories] = useState([]);
    const [allWallets, setAllWallets] = useState([]);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isWalletModalVisible, setIsWalletModalVisible] = useState(false);
    
    const categories = allCategories.filter(c => c.type === entryType);

    React.useEffect(() => {
        if (!AUTH.currentUser) return;

        // Categories татах
        const categoriesQuery = query(
            collection(DB, "categories"),
            where("userId", "==", AUTH.currentUser.uid)
        );

        const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllCategories(list);
            
            if (list.length === 0) {
                createDefaultCategories();
            }
        });

        // Wallets татах
        const walletsQuery = query(
            collection(DB, "wallets"),
            where("userId", "==", AUTH.currentUser.uid)
        );

        const unsubscribeWallets = onSnapshot(walletsQuery, (snapshot) => {
            const walletList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAllWallets(walletList);
            
            // Анхны данс сонгох
            if (walletList.length > 0 && !selectedWallet) {
                const defaultWallet = walletList.find(w => w.isDefault) || walletList[0];
                setSelectedWallet(defaultWallet);
            }
        });

        return () => {
            unsubscribeCategories();
            unsubscribeWallets();
        };
    }, []);

    const createDefaultCategories = async () => {
        const defaultCategories = [
            { name: 'Хоол', type: 'expense', icon: 'restaurant' },
            { name: 'Тээвэр', type: 'expense', icon: 'car' },
            { name: 'Цалин', type: 'income', icon: 'card' },
            { name: 'Бусад', type: 'expense', icon: 'ellipsis-horizontal' },
        ];

        try {
            for (const category of defaultCategories) {
                await addDoc(collection(DB, "categories"), {
                    userId: AUTH.currentUser.uid,
                    ...category,
                    createdAt: serverTimestamp(),
                });
            }
        } catch (error) {
            console.error('Error creating default categories:', error);
        }
    };

    // 💡 Категори нэмэх рүү шилжих функц
    const navigateToAddCategory = () => {
        onClose();
        navigation.navigate('Тохиргоо', { 
            screen: 'AddCategory'
        });
    };

    // 💡 Данс сонгох функц
    const handleSelectWallet = (wallet) => {
        setSelectedWallet(wallet);
    };

    // 💡 Modal нээгдэх үед анхны утгыг тохируулах
    React.useEffect(() => {
        setEntryType(initialType || 'expense');
        setAmount('');
        setDescription('');
        setSelectedCategory(null);
        setShowSuccess(false);
        setIsWalletModalVisible(false);
    }, [isVisible, initialType]);
    
    const handleSaveEntry = async () => {
        const user = AUTH.currentUser;
        if (!user) {
            Alert.alert("Алдаа", "Та нэвтэрсэн байх шаардлагатай.");
            return;
        }

        const parsedAmount = parseFloat(amount);
        const categoryObject = allCategories.find(c => c.name === selectedCategory);
        
        if (isNaN(parsedAmount) || parsedAmount <= 0 || !selectedCategory || !selectedWallet) {
            Alert.alert("Анхааруулга", "Хэмжээ, категори, дансыг зөв бөглөнө үү.");
            return;
        }

        setIsLoading(true);
        try {
            const transactionData = {
                userId: user.uid,
                type: entryType,
                amount: parsedAmount,
                category: categoryObject?.name || selectedCategory,
                categoryIcon: categoryObject?.icon || 'ellipsis-horizontal',
                description: description || 'Түргэн бүртгэл',
                date: serverTimestamp(),
                walletId: selectedWallet.id,
            };

            await addDoc(collection(DB, "transactions"), transactionData);
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 1500);
        } catch (error) {
            console.error("Error saving quick entry: ", error);
            Alert.alert("Алдаа", "Гүйлгээг хадгалж чадсангүй.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <TouchableOpacity 
                style={modalStyles.centeredView}
                activeOpacity={1}
                onPress={onClose}
            >
                <TouchableWithoutFeedback>
                    <View style={[modalStyles.modalView, { backgroundColor: '#FFFFFF' }]}>
                    
                    {showSuccess ? (
                        <View style={modalStyles.successContainer}>
                            <Ionicons name="checkmark-circle" size={60} color="#28a745" />
                            <Text style={modalStyles.successTitle}>Амжилттай!</Text>
                            <Text style={modalStyles.successMessage}>
                                {entryType === 'income' ? 'Орлого' : 'Зарлага'} амжилттай бүртгэгдлээ
                            </Text>
                        </View>
                    ) : (
                        <>
                    <Text style={modalStyles.title}>
                        {entryType === 'income' ? 'Орлого Түргэн Бүртгэх' : 'Зарлага Түргэн Бүртгэх'}
                    </Text>

                    {/* 💡 Төрөл Солих (Toggle) */}
                    <View style={modalStyles.toggleContainer}>
                        <TouchableOpacity
                            style={[modalStyles.toggleButton, entryType === 'income' && modalStyles.activeToggle]}
                            onPress={() => setEntryType('income')}
                        >
                            <Text style={[modalStyles.toggleText, entryType === 'income' && modalStyles.activeText]}>Орлого</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.toggleButton, entryType === 'expense' && modalStyles.activeToggle]}
                            onPress={() => setEntryType('expense')}
                        >
                            <Text style={[modalStyles.toggleText, entryType === 'expense' && modalStyles.activeText]}>Зарлага</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 💡 Мөнгөн Хэмжээ */}
                    <TextInput
                        style={modalStyles.input}
                        placeholder="Хэмжээ (₮)"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />

                    {/* 💡 Данс Сонгох Хэсэг */}
                    <View style={modalStyles.pickerRow}>
                        <Text style={[modalStyles.label, { color: '#000000' }]}>Данс Сонгох</Text>
                    </View>
                    <TouchableOpacity 
                        style={modalStyles.walletSelector} 
                        onPress={() => setIsWalletModalVisible(true)}
                    >
                        <Text style={modalStyles.walletText}>
                            {selectedWallet ? selectedWallet.name : 'Сонгоно уу'}
                        </Text>
                        <Ionicons name="chevron-down" size={20} color="#666666" />
                    </TouchableOpacity>

                    {/* 💡 Категори Сонгох */}
                    <View style={modalStyles.pickerRow}>
                        <Text style={[modalStyles.categoryLabel, { color: '#000000' }]}>Категори Сонгох</Text>
                        <TouchableOpacity onPress={navigateToAddCategory} style={modalStyles.addButton}>
                            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
                        </TouchableOpacity>
                    </View>
                    <View style={modalStyles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.name}
                                style={[
                                    modalStyles.categoryItem,
                                    selectedCategory === cat.name && modalStyles.selectedCategory
                                ]}
                                onPress={() => setSelectedCategory(cat.name)}
                            >
                                <Ionicons name={cat.icon} size={16} color={selectedCategory === cat.name ? 'white' : '#6c757d'} />
                                <Text style={[modalStyles.categoryText, selectedCategory === cat.name && {color: 'white'}]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* 💡 Тэмдэглэл */}
                     <TextInput
                        style={[modalStyles.input, {height: 50}]}
                        placeholder="Нэмэлт тэмдэглэл (заавал биш)"
                        value={description}
                        onChangeText={setDescription}
                    />


                    {/* 💡 Хадгалах ба Хаах Товч */}
                    <View style={modalStyles.buttonContainer}>
                        <TouchableOpacity
                            style={[modalStyles.actionButton, modalStyles.saveButton]}
                            onPress={handleSaveEntry}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text style={modalStyles.buttonText}>Бүртгэх</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[modalStyles.actionButton, modalStyles.cancelButton]}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={modalStyles.buttonText}>Хаах</Text>
                        </TouchableOpacity>
                    </View>
                        </>
                    )}
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
            
            {/* 💡 Wallet Selector Modal */}
            <WalletSelectorModal
                isVisible={isWalletModalVisible}
                onClose={() => setIsWalletModalVisible(false)}
                wallets={allWallets}
                onSelectWallet={handleSelectWallet}
            />
        </Modal>
    );
};

// 💡 MODAL-д зориулсан Стилүүд
const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        borderRadius: 20,
        padding: 25,
        alignItems: 'stretch',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
    },
    addButton: {
        padding: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#343a40',
    },
    // Toggle
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#e9ecef',
        borderRadius: 10,
        marginBottom: 20,
    },
    toggleButton: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        alignItems: 'center',
    },
    activeToggle: {
        backgroundColor: '#007bff',
    },
    toggleText: {
        fontSize: 16,
        color: '#6c757d',
        fontWeight: '600',
    },
    activeText: {
        color: 'white',
    },
    // Inputs
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    // Categories
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 8,
    },
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 15,
        justifyContent: 'flex-start',
    },
    categoryItem: {
        backgroundColor: '#f8f9fa',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectedCategory: {
        backgroundColor: '#007bff',
        borderColor: '#007bff',
    },
    categoryText: {
        color: '#343a40',
        fontSize: 14,
        marginLeft: 5,
    },
    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    actionButton: {
        flex: 1,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    saveButton: {
        backgroundColor: '#28a745', // Ногоон
    },
    cancelButton: {
        backgroundColor: '#6c757d', // Саарал
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    successContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#28a745',
        marginTop: 15,
        marginBottom: 10,
    },
    successMessage: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
    },
    walletSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#f8f9fa',
    },
    walletText: {
        fontSize: 16,
        color: '#000000',
    },
});

export default QuickEntryModal;