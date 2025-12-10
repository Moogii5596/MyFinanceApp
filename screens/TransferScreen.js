import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot, runTransaction, doc, serverTimestamp } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';

const TransferScreen = () => {
    const navigation = useNavigation();
    const userId = AUTH.currentUser?.uid;

    const [accounts, setAccounts] = useState([]);
    const [fromAccount, setFromAccount] = useState(null);
    const [toAccount, setToAccount] = useState(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showFromModal, setShowFromModal] = useState(false);
    const [showToModal, setShowToModal] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const q = query(collection(DB, "wallets"), where("userId", "==", userId));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedAccounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAccounts(fetchedAccounts);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleTransfer = async () => {
        const transferAmount = parseFloat(amount);

        if (!fromAccount || !toAccount || !transferAmount || transferAmount <= 0) {
            Alert.alert('Анхааруулга', 'Бүх талбарыг зөв бөглөнө үү.');
            return;
        }
        if (fromAccount === toAccount) {
            Alert.alert('Анхааруулга', 'Эх үүсвэр болон хүлээн авагчийн данс ижил байж болохгүй.');
            return;
        }

        setIsLoading(true);

        try {
            const sourceAccount = accounts.find(a => a.id === fromAccount);
            if (!sourceAccount || sourceAccount.balance < transferAmount) {
                Alert.alert('Алдаа', 'Эх үүсвэрийн дансны үлдэгдэл хүрэлцэхгүй байна.');
                setIsLoading(false);
                return;
            }

            await runTransaction(DB, async (transaction) => {
                const sourceRef = doc(DB, "wallets", fromAccount);
                const destinationRef = doc(DB, "wallets", toAccount);

                const newSourceBalance = sourceAccount.balance - transferAmount;
                const destinationAccount = accounts.find(a => a.id === toAccount);
                const newDestinationBalance = destinationAccount.balance + transferAmount;

                transaction.update(sourceRef, { balance: newSourceBalance });
                transaction.update(destinationRef, { balance: newDestinationBalance });

                const newTransaction = {
                    userId: userId,
                    type: 'transfer',
                    amount: transferAmount,
                    date: new Date().toISOString().substring(0, 10),
                    fromAccountId: fromAccount,
                    toAccountId: toAccount,
                    categoryName: 'Шилжүүлэг',
                    note: note || `Шилжүүлэг: ${sourceAccount.name} -> ${destinationAccount.name}`,
                    createdAt: serverTimestamp(),
                };
                transaction.set(doc(collection(DB, "transactions")), newTransaction);
            });

            Alert.alert('Амжилттай', `${transferAmount.toLocaleString()}₮ шилжүүлэг амжилттай хийгдлээ!`);
            navigation.goBack();
        } catch (e) {
            console.error("Шилжүүлгийн алдаа: ", e);
            Alert.alert('Алдаа', 'Шилжүүлэг хийхэд алдаа гарлаа: ' + e.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderAccountSelector = (title, selectedAccount, onPress) => {
        const selectedAccountData = accounts.find(acc => acc.id === selectedAccount);
        return (
            <View>
                <Text style={styles.label}>{title}</Text>
                <TouchableOpacity style={styles.selectorButton} onPress={onPress}>
                    <Text style={styles.selectorText}>
                        {selectedAccountData ? `${selectedAccountData.name} (${selectedAccountData.balance.toLocaleString()}₮)` : 'Данс сонгоно уу...'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#6c757d" />
                </TouchableOpacity>
            </View>
        );
    };

    const renderAccountModal = (visible, onClose, onSelect, title) => (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <FlatList
                        data={accounts}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.accountItem}
                                onPress={() => {
                                    onSelect(item.id);
                                    onClose();
                                }}
                            >
                                <Text style={styles.accountName}>{item.name}</Text>
                                <Text style={styles.accountBalance}>{item.balance.toLocaleString()}₮</Text>
                            </TouchableOpacity>
                        )}
                    />
                    <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                        <Text style={styles.cancelButtonText}>Буцах</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.sectionTitle}>Данс Хоорондын Шилжүүлэг</Text>
            
            {renderAccountSelector('Эх Үүсвэрийн Данс (Мөнгө Хасагдах)', fromAccount, () => setShowFromModal(true))}
            {renderAccountSelector('Хүлээн Авах Данс (Мөнгө Нэмэгдэх)', toAccount, () => setShowToModal(true))}

            <Text style={styles.label}>Шилжүүлэх Дүн (₮)</Text>
            <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
            />
            
            <Text style={styles.label}>Тэмдэглэл (Сонголттой)</Text>
            <TextInput
                style={styles.input}
                placeholder="Тэмдэглэл"
                value={note}
                onChangeText={setNote}
            />

            <TouchableOpacity 
                style={styles.transferButton} 
                onPress={handleTransfer}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Шилжүүлэг Хийх</Text>
                )}
            </TouchableOpacity>
            
            {renderAccountModal(showFromModal, () => setShowFromModal(false), setFromAccount, 'Эх Үүсвэрийн Данс Сонгох')}
            {renderAccountModal(showToModal, () => setShowToModal(false), setToAccount, 'Хүлээн Авах Данс Сонгох')}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 15, backgroundColor: '#f0f2f5' },
    sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 10 },
    label: { fontSize: 16, fontWeight: '600', color: '#495057', marginTop: 15, marginBottom: 5 },
    input: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    selectorButton: {
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectorText: {
        fontSize: 16,
        color: '#495057',
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
    },
    accountItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    accountName: {
        fontSize: 16,
        fontWeight: '500',
    },
    accountBalance: {
        fontSize: 16,
        color: '#28a745',
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: '#6c757d',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 15,
    },
    cancelButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    transferButton: {
        backgroundColor: '#007bff',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});



export default TransferScreen;
