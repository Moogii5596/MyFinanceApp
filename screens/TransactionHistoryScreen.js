import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SectionList, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { DB, AUTH } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import TransactionEditModal from '../components/TransactionEditModal';
import TransactionFilterModal from '../components/TransactionFilterModal';
import { formatMoney } from '../utils/formatMoney';
import { useUser } from '../contexts/UserContext';

// Гүйлгээний төрлүүд
const TRANSACTION_TYPES = {
    expense: { label: 'Зарлага', icon: 'remove-circle', color: '#dc3545' },
    income: { label: 'Орлого', icon: 'add-circle', color: '#28a745' },
    saving: { label: 'Хадгаламж', icon: 'wallet', color: '#ffc107' },
    transfer: { label: 'Шилжүүлэг', icon: 'swap-horizontal', color: '#007bff' },
};



const groupTransactionsByDate = (transactions) => {
    const grouped = transactions.reduce((acc, item) => {
        const date = item.date?.toDate ? item.date.toDate().toLocaleDateString('mn-MN', { year: 'numeric', month: 'short', day: 'numeric' }) : item.date;
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(item);
        return acc;
    }, {});

    return Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
        title: date,
        data: grouped[date],
        incomeTotal: grouped[date].filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0),
        expenseTotal: grouped[date].filter(t => ['expense', 'saving'].includes(t.type)).reduce((sum, t) => sum + Math.abs(t.amount), 0),
        transferTotal: grouped[date].filter(t => t.type === 'transfer').reduce((sum, t) => sum + Math.abs(t.amount), 0),
    }));
};

// --------------------------------------------------------
// 1. КОМПОНЕНТ: Гүйлгээний Мөр
// --------------------------------------------------------
const TransactionItem = ({ item, onPress }) => {
    const typeInfo = TRANSACTION_TYPES[item.type] || TRANSACTION_TYPES.expense;
    const isPositive = item.type === 'income';
    
    return (
        <TouchableOpacity onPress={() => onPress(item)} style={styles.transactionRow}>
            <View style={styles.transactionIconContainer}>
                <Ionicons 
                    name={typeInfo.icon} 
                    size={24} 
                    color={typeInfo.color} 
                />
            </View>
            <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>{item.category}</Text>
                <Text style={styles.transactionNote}>{item.note || typeInfo.label}</Text>
            </View>
            <Text style={[
                styles.transactionAmount, 
                { color: typeInfo.color }
            ]}>
                {isPositive ? '+' : '-'} {formatMoney(Math.abs(item.amount)).replace('₮', '')}₮
            </Text>
        </TouchableOpacity>
    );
};

// --------------------------------------------------------
// 2. ҮНДСЭН ДЭЛГЭЦ
// --------------------------------------------------------
const TransactionHistoryScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    const [searchTerm, setSearchTerm] = useState('');
    const [allTransactions, setAllTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState({ type: null, category: null, month: null });
    const [viewMode, setViewMode] = useState('personal');
    const { userProfile } = useUser();
    const groupId = userProfile?.currentGroupId || null;

    useEffect(() => {
        if (!AUTH.currentUser || !isFocused) return;
        
        setIsLoading(true);

        let q;
        if (groupId && viewMode === 'group') {
            q = query(
                collection(DB, "transactions"),
                where("groupId", "==", groupId)
            );
        } else {
            q = query(
                collection(DB, "transactions"),
                where("userId", "==", AUTH.currentUser.uid)
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let list = snapshot.docs.map(doc => ({
                id: doc.id, 
                ...doc.data()
            }));
            
            // Client-side эрэмбэлэх
            list.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                return b.date.toDate() - a.date.toDate();
            });
            
            // Client-side шүүлт хийх
            if (filters.type) {
                list = list.filter(t => t.type === filters.type);
            }
            
            if (filters.category) {
                list = list.filter(t => t.category === filters.category);
            }
            
            if (filters.month) {
                list = list.filter(t => {
                    if (!t.date || !t.date.toDate) return false;
                    const transactionMonth = t.date.toDate().getMonth() + 1;
                    return transactionMonth === filters.month;
                });
            }
            
            setAllTransactions(list);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [isFocused, filters, viewMode]);

    const filteredTransactions = allTransactions.filter(t => 
        t.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.note?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const sections = groupTransactionsByDate(filteredTransactions);
    
    // Нийт Тойм
    const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalExpense = filteredTransactions.filter(t => ['expense', 'saving'].includes(t.type)).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const totalTransfer = filteredTransactions.filter(t => t.type === 'transfer').reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const handleTransactionPress = (transaction) => {
        navigation.navigate('EditTransaction', { transactionData: transaction });
    };

    const handleCloseEditModal = () => {
        setIsEditModalVisible(false);
        setSelectedTransaction(null);
    };

    const handleApplyFilter = (newFilters) => {
        setFilters(newFilters);
    };
    
    const renderViewModeToggle = () => {
        if (!groupId) return null;
        
        return (
            <View style={styles.viewToggleContainer}>
                <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'personal' && styles.toggleActive]}
                    onPress={() => setViewMode('personal')}
                >
                    <Ionicons name="person-outline" size={20} color={viewMode === 'personal' ? 'white' : '#6c757d'} />
                    <Text style={[styles.toggleText, viewMode === 'personal' && styles.toggleTextActive]}>Хувийн</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.toggleButton, viewMode === 'group' && styles.toggleActive]}
                    onPress={() => setViewMode('group')}
                >
                    <Ionicons name="people-outline" size={20} color={viewMode === 'group' ? 'white' : '#6c757d'} />
                    <Text style={[styles.toggleText, viewMode === 'group' && styles.toggleTextActive]}>Групп</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            
            {/* 💡 0. Хувийн/Групп сонгох */}
            {renderViewModeToggle()}
            
            {/* 💡 1. Хайлт ба Шүүлтүүр */}
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Хайлт (Категори, Тэмдэглэлээр)"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterModalVisible(true)}>
                    <Ionicons name="filter-outline" size={24} color="#007bff" />
                    {(filters.type || filters.category || filters.month) && (
                        <View style={styles.filterBadge}>
                            <Text style={styles.filterBadgeText}>•</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* 💡 2. Сонгосон Хугацааны Тойм (Summary) */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.summaryScroll}>
                <View style={styles.summaryContainer}>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Орлого</Text>
                        <Text style={styles.incomeAmount}>{formatMoney(totalIncome)}</Text>
                    </View>
                    <View style={styles.summaryBox}>
                        <Text style={styles.summaryLabel}>Зарлага</Text>
                        <Text style={styles.expenseAmount}>{formatMoney(totalExpense)}</Text>
                    </View>
                    {totalTransfer > 0 && (
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryLabel}>Шилжүүлэг</Text>
                            <Text style={styles.transferAmount}>{formatMoney(totalTransfer)}</Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* 💡 3. Бүлэглэсэн Гүйлгээний Жагсаалт */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                    <Text style={styles.loadingText}>Гүйлгээнүүдийг татаж байна...</Text>
                </View>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => <TransactionItem item={item} onPress={handleTransactionPress} />}
                    renderSectionHeader={({ section: { title, incomeTotal, expenseTotal, transferTotal } }) => (
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>{title}</Text>
                            <View style={styles.sectionTotals}>
                                {incomeTotal > 0 && <Text style={styles.sectionIncome}>+{formatMoney(incomeTotal)}</Text>}
                                {expenseTotal > 0 && <Text style={styles.sectionExpense}>-{formatMoney(expenseTotal)}</Text>}
                                {transferTotal > 0 && <Text style={styles.sectionTransfer}>↔{formatMoney(transferTotal)}</Text>}
                            </View>
                        </View>
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Та гүйлгээ бүртгээгүй байна.</Text>}
                />
            )}
            
            <TransactionEditModal 
                isVisible={isEditModalVisible}
                onClose={handleCloseEditModal}
                transaction={selectedTransaction}
                onTransactionUpdated={handleCloseEditModal}
                onTransactionDeleted={handleCloseEditModal}
            />
            
            <TransactionFilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setIsFilterModalVisible(false)}
                onApplyFilter={handleApplyFilter}
                initialFilters={filters}
            />
        </View>
    );
};

// --------------------------------------------------------
// 3. СТИЛ
// --------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        paddingHorizontal: 20,
    },
    // Хайлт ба Шүүлтүүр
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#f4f7f6',
    },
    searchInput: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e9ecef',
        marginRight: 10,
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#e9ecef',
        position: 'relative',
    },
    filterBadge: {
        position: 'absolute',
        top: 2,
        right: 2,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#dc3545',
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterBadgeText: {
        color: '#dc3545',
        fontSize: 8,
        fontWeight: 'bold',
    },
    // Тойм Хэсэг
    summaryScroll: {
        marginBottom: 15,
    },
    summaryContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    summaryBox: {
        alignItems: 'center',
        minWidth: 100,
        marginHorizontal: 10,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#6c757d',
        marginBottom: 5,
    },
    incomeAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#28a745',
    },
    expenseAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#dc3545',
    },
    transferAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#007bff',
    },
    // Гүйлгээний Жагсаалт
    listContent: {
        paddingBottom: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#f4f7f6', // Дэлгэцийн дэвсгэр өнгө
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#dee2e6',
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#495057',
    },
    sectionTotals: {
        flexDirection: 'row',
    },
    sectionIncome: {
        fontSize: 14,
        fontWeight: '600',
        color: '#28a745',
        marginLeft: 10,
    },
    sectionExpense: {
        fontSize: 14,
        fontWeight: '600',
        color: '#dc3545',
        marginLeft: 10,
    },
    sectionTransfer: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007bff',
        marginLeft: 10,
    },
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    transactionIconContainer: {
        padding: 8,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        marginRight: 15,
    },
    transactionDetails: {
        flex: 1,
    },
    transactionCategory: {
        fontSize: 16,
        fontWeight: '600',
        color: '#343a40',
    },
    transactionNote: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        minWidth: 90,
        textAlign: 'right',
    },
    emptyText: {
        textAlign: 'center',
        marginTop: 50,
        color: '#6c757d',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 50,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#6c757d',
    },
    viewToggleContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 15,
        padding: 5,
        elevation: 1,
    },
    toggleButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        borderRadius: 8,
    },
    toggleActive: {
        backgroundColor: '#007bff',
    },
    toggleText: {
        marginLeft: 5,
        fontWeight: 'bold',
        color: '#6c757d',
    },
    toggleTextActive: {
        color: 'white',
    },
});

export default TransactionHistoryScreen;