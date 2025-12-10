import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DB, AUTH } from '../firebaseConfig';
import { useUser } from '../contexts/UserContext';
import { usePremium } from '../contexts/PremiumContext';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    query,
    where,
    onSnapshot,
    serverTimestamp,
    getDocs,
} from 'firebase/firestore';

export default function ManageCategoriesScreen({ navigation }) {
    const userId = AUTH.currentUser?.uid;
    const { isPremium } = usePremium();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [selectedType, setSelectedType] = useState('expense');
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        if (!userId) return;

        const q = query(
            collection(DB, 'categories'),
            where('userId', '==', userId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const categoryList = [];
            snapshot.forEach((doc) => {
                categoryList.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            
            // Сортировка: зардлын категори эхлээд ирнэ
            categoryList.sort((a, b) => {
                if (a.type === 'expense' && b.type !== 'expense') return -1;
                if (a.type !== 'expense' && b.type === 'expense') return 1;
                return a.name.localeCompare(b.name);
            });
            
            setCategories(categoryList);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert('Алдаа', 'Категорийн нэрийг оруулна уу.');
            return;
        }

        try {
            await addDoc(collection(DB, 'categories'), {
                userId: userId,
                name: newCategoryName.trim(),
                type: selectedType,
                createdAt: serverTimestamp(),
            });

            setNewCategoryName('');
            setSelectedType('expense');
            setModalVisible(false);
            setSuccessMessage('Категори амжилттай нэмэгдлээ!');
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 1500);
        } catch (e) {
            Alert.alert('Алдаа', 'Категорийг нэмэх үед алдаа гарлаа: ' + e.message);
        }
    };

    const handleDeleteCategory = (categoryId, categoryName) => {
        Alert.alert(
            'Категорийг Устгах',
            `"${categoryName}" категорийг устгахыг сайн байна уу?`,
            [
                {
                    text: 'Цуцлах',
                    onPress: () => {},
                    style: 'cancel',
                },
                {
                    text: 'Устгах',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(DB, 'categories', categoryId));
                            setSuccessMessage('Категори амжилттай устгагдлээ!');
                            setShowSuccess(true);
                            setTimeout(() => {
                                setShowSuccess(false);
                            }, 1500);
                        } catch (e) {
                            Alert.alert('Алдаа', 'Категорийг устгах үед алдаа гарлаа: ' + e.message);
                        }
                    },
                    style: 'destructive',
                },
            ]
        );
    };

    const renderCategoryItem = ({ item }) => {
        const isLockedForNonPremium = (item.isDefault || item.isLocked) && !isPremium;
        
        return (
            <View style={styles.categoryItem}>
                <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{item.name}</Text>
                    {isLockedForNonPremium && (
                        <Ionicons name="lock-closed" size={16} color="#FFA500" style={{ marginLeft: 8 }} />
                    )}
                    <View style={[
                        styles.typeBadge,
                        item.type === 'expense' ? styles.expenseBadge : styles.incomeBadge
                    ]}>
                        <Text style={styles.typeBadgeText}>
                            {item.type === 'expense' ? 'Зардал' : 'Орлого'}
                        </Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            if (isLockedForNonPremium) {
                                Alert.alert(
                                    'Хязгаарлалт',
                                    'Энэ категори бол үндсэн категори тул Premium эрхээр л засварлах боломжтой.',
                                    [
                                        { text: 'Үгүй', style: 'cancel' },
                                        { text: 'Premium Авах', onPress: () => navigation.navigate('PremiumScreen') }
                                    ]
                                );
                            } else {
                                setModalVisible(true);
                                setNewCategoryName(item.name);
                                setSelectedType(item.type);
                            }
                        }}
                    >
                        <Ionicons name="create-outline" size={20} color={isLockedForNonPremium ? '#CCCCCC' : '#007AFF'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                            if (isLockedForNonPremium) {
                                Alert.alert(
                                    'Хязгаарлалт',
                                    'Үндсэн категорийг устгахын тулд Premium эрх шаардлагатай.',
                                    [
                                        { text: 'Үгүй', style: 'cancel' },
                                        { text: 'Premium Авах', onPress: () => navigation.navigate('PremiumScreen') }
                                    ]
                                );
                            } else {
                                handleDeleteCategory(item.id);
                            }
                        }}
                    >
                        <Ionicons name="trash-outline" size={20} color={isLockedForNonPremium ? '#CCCCCC' : '#FF6B6B'} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={categories}
                renderItem={renderCategoryItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="folder-open-outline" size={48} color="#CCCCCC" />
                        <Text style={styles.emptyText}>Категори байхгүй байна</Text>
                    </View>
                }
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                    if (!isPremium) {
                        Alert.alert(
                            'Төлбөртэй Боломж',
                            'Зөвхөн Premium хэрэглэгчид шинэ категори нэмэх боломжтой.',
                            [
                                { text: 'Ойлголоо', style: 'cancel' },
                                { text: 'Premium Авах', onPress: () => navigation.navigate('PremiumScreen') },
                            ]
                        );
                    } else {
                        setModalVisible(true);
                    }
                }}
            >
                <Ionicons name="add" size={28} color="white" />
            </TouchableOpacity>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Шинэ Категори Нэмэх</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color="#007AFF" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            style={styles.input}
                            placeholder="Категорийн нэр"
                            value={newCategoryName}
                            onChangeText={setNewCategoryName}
                        />

                        <Text style={styles.label}>Категорийн төрөл:</Text>
                        <View style={styles.typeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    selectedType === 'expense' && styles.typeButtonActive
                                ]}
                                onPress={() => setSelectedType('expense')}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    selectedType === 'expense' && styles.typeButtonTextActive
                                ]}>
                                    Зардал
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.typeButton,
                                    selectedType === 'income' && styles.typeButtonActive
                                ]}
                                onPress={() => setSelectedType('income')}
                            >
                                <Text style={[
                                    styles.typeButtonText,
                                    selectedType === 'income' && styles.typeButtonTextActive
                                ]}>
                                    Орлого
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleAddCategory}
                        >
                            <Text style={styles.saveButtonText}>Нэмэх</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
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
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    listContent: {
        padding: 16,
    },
    categoryItem: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    categoryInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    categoryName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    typeBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    expenseBadge: {
        backgroundColor: '#FFE5E5',
    },
    incomeBadge: {
        backgroundColor: '#E5F5E5',
    },
    typeBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
    },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#007AFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#CCCCCC',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#333',
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        alignItems: 'center',
    },
    typeButtonActive: {
        backgroundColor: '#007AFF',
        borderColor: '#007AFF',
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    typeButtonTextActive: {
        color: 'white',
    },
    saveButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    successContainer: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginTop: 15, marginBottom: 10 },
    successMessage: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
});
