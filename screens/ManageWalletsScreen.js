import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Button, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import CustomAlertModal from '../components/CustomAlertModal';

const ManageWalletsScreen = () => {
    const userId = AUTH.currentUser?.uid;
    const [wallets, setWallets] = useState([]);
    const [newWalletName, setNewWalletName] = useState('');
    const [newWalletInitialBalance, setNewWalletInitialBalance] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingWallet, setEditingWallet] = useState(null);
    const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
    const [walletToDelete, setWalletToDelete] = useState(null);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [isSetDefaultModalVisible, setIsSetDefaultModalVisible] = useState(false);
    const [walletToSetDefault, setWalletToSetDefault] = useState(null);

    useEffect(() => {
        if (!userId) return;

        // Дансуудыг (Wallets) татах
        const qWallets = query(collection(DB, "wallets"), where("userId", "==", userId));
        const unsubscribeWallets = onSnapshot(qWallets, (snapshot) => {
            const walletsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setWallets(walletsData);
        });

        return () => unsubscribeWallets();
    }, [userId]);

    // =========================================================
    // А. Данс Нэмэх / Шинэчлэх
    // =========================================================
    const handleSaveWallet = async () => {
        const name = newWalletName.trim();
        const initialBalance = parseFloat(newWalletInitialBalance) || 0;

        if (!name) {
            setSuccessMessage('Дансны нэрийг оруулна уу.');
            setIsSuccessModalVisible(true);
            return;
        }

        try {
            if (isEditing && editingWallet) {
                // Засах горим (Update)
                await updateDoc(doc(DB, "wallets", editingWallet.id), {
                    name: name,
                    balance: initialBalance,
                    updatedAt: serverTimestamp(),
                });
                setSuccessMessage(`"${name}" данс шинэчлэгдлээ.`);
            } else {
                // Нэмэх горим (Create)
                await addDoc(collection(DB, "wallets"), {
                    userId: userId,
                    name: name,
                    balance: initialBalance,
                    isDefault: wallets.length === 0,
                    createdAt: serverTimestamp(),
                });
                setSuccessMessage(`"${name}" данс нэмэгдлээ.`);
            }

            // Төлөвүүдийг цэвэрлэх
            setNewWalletName('');
            setNewWalletInitialBalance('');
            setIsEditing(false);
            setEditingWallet(null);
            setIsSuccessModalVisible(true);

        } catch (e) {
            setSuccessMessage('Данс хадгалах үед алдаа гарлаа.');
            setIsSuccessModalVisible(true);
            console.error(e);
        }
    };
    
    // =========================================================
    // Б. Устгах Логик
    // =========================================================
    const confirmDelete = (walletId, name) => {
        if (wallets.length === 1) {
            setSuccessMessage('Та хамгийн багадаа нэг данстай байх ёстой.');
            setIsSuccessModalVisible(true);
            return;
        }
        
        setWalletToDelete({ id: walletId, name });
        setIsDeleteModalVisible(true);
    };

    const handleDeleteWallet = async () => {
        if (!walletToDelete) return;

        try {
            await deleteDoc(doc(DB, "wallets", walletToDelete.id));
            setSuccessMessage('Данс устгагдлаа.');
            setIsSuccessModalVisible(true);
        } catch (e) {
            setSuccessMessage('Устгаж чадсангүй.');
            setIsSuccessModalVisible(true);
        } finally {
            setIsDeleteModalVisible(false);
            setWalletToDelete(null);
        }
    };

    // =========================================================
    // В. Засах Горимыг Эхлүүлэх
    // =========================================================
    const startEdit = (wallet) => {
        setIsEditing(true);
        setEditingWallet(wallet);
        setNewWalletName(wallet.name);
        setNewWalletInitialBalance(wallet.balance ? wallet.balance.toString() : '0');
    };
    
    const cancelEdit = () => {
        setIsEditing(false);
        setEditingWallet(null);
        setNewWalletName('');
        setNewWalletInitialBalance('');
    };

    // =========================================================
    // Д. Үндсэн Данс Тохируулах
    // =========================================================
    const confirmSetDefault = (walletId) => {
        setWalletToSetDefault(walletId);
        setIsSetDefaultModalVisible(true);
    };

    const handleSetDefault = async () => {
        if (!userId || !walletToSetDefault) return;

        try {
            const batch = writeBatch(DB);
            
            const q = query(collection(DB, "wallets"), where("userId", "==", userId));
            const snapshot = await getDocs(q);

            snapshot.docs.forEach(document => {
                if (document.id !== walletToSetDefault && document.data().isDefault) {
                    batch.update(doc(DB, "wallets", document.id), { isDefault: false });
                }
            });

            const newDefaultRef = doc(DB, "wallets", walletToSetDefault);
            batch.update(newDefaultRef, { isDefault: true });

            await batch.commit();
            setSuccessMessage("Үндсэн данс амжилттай тохируулагдлаа.");
            setIsSuccessModalVisible(true);

        } catch (e) {
            setSuccessMessage("Үндсэн данс тохируулахад алдаа гарлаа.");
            setIsSuccessModalVisible(true);
            console.error(e);
        } finally {
            setIsSetDefaultModalVisible(false);
            setWalletToSetDefault(null);
        }
    };

    // =========================================================
    // Г. UI (Item Render)
    // =========================================================
    const renderItem = ({ item }) => (
        <View style={styles.walletItem}>
            <View style={{flex: 1}}>
                <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 4}}>
                    <Text style={styles.walletName}>{item.name}</Text>
                    {item.isDefault && (
                        <View style={styles.defaultBadge}>
                            <Text style={styles.defaultBadgeText}>Үндсэн</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.walletBalance}>Үлдэгдэл: {item.balance ? item.balance.toLocaleString() : 0} ₮</Text>
            </View>
            <View style={styles.actions}>
                <TouchableOpacity 
                    onPress={() => confirmSetDefault(item.id)} 
                    style={[styles.actionButton, {backgroundColor: item.isDefault ? '#28a745' : '#6c757d'}]}
                >
                    <Ionicons name={item.isDefault ? "checkmark-circle" : "star-outline"} size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => startEdit(item)} style={[styles.actionButton, {backgroundColor: '#ffc107', marginLeft: 10}]}>
                    <Ionicons name="pencil" size={18} color="white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => confirmDelete(item.id, item.name)} style={[styles.actionButton, {backgroundColor: '#dc3545', marginLeft: 10}]}>
                    <Ionicons name="trash" size={18} color="white" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.addSection}>
                <Text style={styles.sectionTitle}>{isEditing ? 'Данс Засах' : 'Шинэ Данс Нэмэх'}</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Дансны нэр (Жишээ: Карт, Бэлэн мөнгө)"
                    value={newWalletName}
                    onChangeText={setNewWalletName}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Анхны үлдэгдэл (Жишээ: 100000)"
                    keyboardType="numeric"
                    value={newWalletInitialBalance}
                    onChangeText={setNewWalletInitialBalance}
                />
                <View style={styles.buttonContainer}>
                    <View style={{flex: 1}}>
                        <Button 
                            title={isEditing ? 'Хадгалах' : 'Нэмэх'} 
                            onPress={handleSaveWallet} 
                            color="#007bff"
                        />
                    </View>
                    {isEditing && (
                        <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit}>
                            <Text style={styles.cancelButtonText}>Буцах</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            <View style={styles.listSection}>
                <Text style={styles.sectionTitle}>Бүх Дансууд ({wallets.length})</Text>
                <FlatList
                    data={wallets}
                    renderItem={renderItem}
                    keyExtractor={item => item.id}
                    ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 10, color: '#6c757d'}}>Одоогоор данс байхгүй байна.</Text>}
                />
            </View>

            {/* Custom Alert Modals */}
            <CustomAlertModal
                isVisible={isDeleteModalVisible}
                title="Данс Устгах"
                message={`Та "${walletToDelete?.name}" дансыг устгахдаа итгэлтэй байна уу? Энэ данстай холбоотой гүйлгээнүүд харагдахгүй болохыг анхаарна уу!`}
                onConfirm={handleDeleteWallet}
                onCancel={() => setIsDeleteModalVisible(false)}
                confirmText="Устгах"
                cancelText="Буцах"
            />

            <CustomAlertModal
                isVisible={isSetDefaultModalVisible}
                title="Үндсэн Данс Тохируулах"
                message="Энэ дансыг үндсэн данс болгон тохируулах уу?"
                onConfirm={handleSetDefault}
                onCancel={() => setIsSetDefaultModalVisible(false)}
                confirmText="Тохируулах"
                cancelText="Буцах"
            />

            <CustomAlertModal
                isVisible={isSuccessModalVisible}
                title="Мэдэгдэл"
                message={successMessage}
                onConfirm={() => setIsSuccessModalVisible(false)}
                onCancel={() => setIsSuccessModalVisible(false)}
                confirmText="Ойлголоо"
                cancelText=""
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f8f9fa', 
        padding: 15 
    },
    addSection: { 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 10, 
        marginBottom: 20, 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    listSection: { 
        flex: 1, 
        backgroundColor: '#fff', 
        padding: 15, 
        borderRadius: 10, 
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    sectionTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginBottom: 15, 
        color: '#343a40' 
    },
    input: { 
        height: 45, 
        borderColor: '#ced4da', 
        borderWidth: 1, 
        borderRadius: 8, 
        paddingHorizontal: 15, 
        marginBottom: 10, 
        backgroundColor: '#fff' 
    },
    buttonContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        gap: 10,
    },
    cancelButton: { 
        paddingVertical: 10, 
        paddingHorizontal: 20, 
        borderRadius: 8, 
        backgroundColor: '#6c757d'
    },
    cancelButtonText: { 
        color: '#fff', 
        fontWeight: 'bold',
        fontSize: 14,
    },
    walletItem: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingVertical: 12, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f1f1f1' 
    },
    walletName: { 
        fontSize: 16, 
        fontWeight: '600', 
        color: '#343a40',
        marginRight: 10,
    },
    walletBalance: { 
        fontSize: 14, 
        color: '#6c757d' 
    },
    defaultBadge: {
        backgroundColor: '#28a745',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    defaultBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    actions: { 
        flexDirection: 'row' 
    },
    actionButton: { 
        padding: 8, 
        borderRadius: 5 
    },
});

export default ManageWalletsScreen;
