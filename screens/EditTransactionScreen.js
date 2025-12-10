import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { runTransaction, doc, deleteDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import CustomAlertModal from '../components/CustomAlertModal';

const EditTransactionScreen = ({ navigation, route }) => {

    const { transactionData } = route.params;
    const [amount, setAmount] = useState(transactionData.amount.toString());
    const [description, setDescription] = useState(transactionData.description || '');
    const [selectedCategory, setSelectedCategory] = useState(transactionData.category);
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!AUTH.currentUser) return;

        const q = query(
            collection(DB, "categories"),
            where("userId", "==", AUTH.currentUser.uid),
            where("type", "==", transactionData.type)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setCategories(list);
        });

        return () => unsubscribe();
    }, []);

    const handleDeleteTransaction = async () => {
        setIsLoading(true);
        try {
            await runTransaction(DB, async (transaction) => {
                const transactionRef = doc(DB, 'transactions', transactionData.id);
                const walletRef = doc(DB, 'wallets', transactionData.walletId);

                transaction.delete(transactionRef);

                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists()) {
                    throw "Дансны мэдээлэл олдсонгүй!";
                }
                
                let newBalance = walletDoc.data().balance;
                
                if (transactionData.type === 'expense') {
                    newBalance += transactionData.amount;
                } else if (transactionData.type === 'income') {
                    newBalance -= transactionData.amount;
                }

                transaction.update(walletRef, { balance: newBalance });
            });
            
            setSuccessMessage("Гүйлгээг устгалаа.");
            setIsSuccessModalVisible(true);

        } catch (error) {
            console.error("Гүйлгээг устгахад алдаа гарлаа: ", error);
            setSuccessMessage("Устгах үйлдэл амжилтгүй боллоо.");
            setIsSuccessModalVisible(true);
        } finally {
            setIsLoading(false);
            setIsDeleteModalVisible(false);
        }
    };

    const handleUpdateTransaction = async () => {
        const newAmount = parseFloat(amount);
        if (isNaN(newAmount) || newAmount <= 0) {
            setSuccessMessage("Хэмжээг зөв оруулна уу.");
            setIsSuccessModalVisible(true);
            return;
        }

        setIsLoading(true);
        try {
            await runTransaction(DB, async (transaction) => {
                const transactionRef = doc(DB, 'transactions', transactionData.id);
                const walletRef = doc(DB, 'wallets', transactionData.walletId);

                const walletDoc = await transaction.get(walletRef);
                if (!walletDoc.exists()) {
                    throw "Дансны мэдээлэл олдсонгүй!";
                }

                let currentBalance = walletDoc.data().balance;
                const oldAmount = transactionData.amount;
                const amountDiff = newAmount - oldAmount;

                if (transactionData.type === 'expense') {
                    currentBalance -= amountDiff;
                } else if (transactionData.type === 'income') {
                    currentBalance += amountDiff;
                }

                transaction.update(transactionRef, {
                    amount: newAmount,
                    description: description,
                    category: selectedCategory
                });

                transaction.update(walletRef, { balance: currentBalance });
            });

            setSuccessMessage("Гүйлгээг шинэчиллээ.");
            setIsSuccessModalVisible(true);

        } catch (error) {
            console.error("Гүйлгээг шинэчлэхэд алдаа гарлаа: ", error);
            setSuccessMessage("Шинэчлэх үйлдэл амжилтгүй боллоо.");
            setIsSuccessModalVisible(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuccessConfirm = () => {
        setIsSuccessModalVisible(false);
        if (successMessage.includes('устгалаа') || successMessage.includes('шинэчиллээ')) {
            navigation.goBack();
        }
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
                <View style={styles.header}>
                    <Ionicons name="pencil-outline" size={24} color={theme.colors.primary} />
                    <Text style={[styles.title, { color: theme.colors.text }]}>Гүйлгээ Засах</Text>
                </View>

                <View style={styles.form}>
                    <Text style={[styles.label, { color: theme.colors.text }]}>Хэмжээ</Text>
                    <TextInput
                        style={[styles.input, { 
                            borderColor: theme.colors.border, 
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text 
                        }]}
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />

                    <Text style={[styles.label, { color: theme.colors.text }]}>Тайлбар</Text>
                    <TextInput
                        style={[styles.input, { 
                            borderColor: theme.colors.border, 
                            backgroundColor: theme.colors.background,
                            color: theme.colors.text 
                        }]}
                        value={description}
                        onChangeText={setDescription}
                        placeholder="Тайлбар"
                        placeholderTextColor={theme.colors.subText}
                    />

                    <Text style={[styles.label, { color: theme.colors.text }]}>Категори</Text>
                    <View style={styles.categoryGrid}>
                        {categories.map((cat) => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryItem,
                                    { borderColor: theme.colors.border },
                                    selectedCategory === cat.name && { backgroundColor: theme.colors.primary }
                                ]}
                                onPress={() => setSelectedCategory(cat.name)}
                            >
                                <Ionicons 
                                    name={cat.icon} 
                                    size={16} 
                                    color={selectedCategory === cat.name ? 'white' : theme.colors.text} 
                                />
                                <Text style={[
                                    styles.categoryText, 
                                    { color: selectedCategory === cat.name ? 'white' : theme.colors.text }
                                ]}>
                                    {cat.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[styles.updateButton, { backgroundColor: theme.colors.primary }]}
                            onPress={handleUpdateTransaction}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>
                                {isLoading ? 'Хадгалж байна...' : 'Шинэчлэх'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: theme.colors.danger }]}
                            onPress={() => setIsDeleteModalVisible(true)}
                            disabled={isLoading}
                        >
                            <Text style={styles.buttonText}>Устгах</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            <CustomAlertModal
                isVisible={isDeleteModalVisible}
                title="Гүйлгээ Устгах"
                message="Та энэ гүйлгээг устгахдаа итгэлтэй байна уу? Устгасан мэдээллийг буцаах боломжгүй."
                onConfirm={handleDeleteTransaction}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmText="Устгах"
                cancelText="Буцах"
            />

            <CustomAlertModal
                isVisible={isSuccessModalVisible}
                title="Мэдэгдэл"
                message={successMessage}
                onConfirm={handleSuccessConfirm}
                onCancel={handleSuccessConfirm}
                confirmText="Ойлголоо"
                cancelText=""
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
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryText: {
        fontSize: 14,
        marginLeft: 5,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    updateButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    deleteButton: {
        flex: 1,
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default EditTransactionScreen;