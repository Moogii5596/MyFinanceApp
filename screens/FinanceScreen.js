import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import QuickEntryModal from '../components/QuickEntryModal';
import { DB, AUTH } from '../firebaseConfig';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { formatMoney } from '../utils/formatMoney';

const screenWidth = Dimensions.get('window').width;

const CATEGORY_COLORS = {
    'Хүнс': '#dc3545',
    'Түрээс': '#ffc107',
    'Тээвэр': '#007bff',
    'Цалин': '#28a745',
    'Бонус': '#17a2b8',
    'Хувь': '#6610f2',
    'Бусад': '#6c757d',
};

const ExpenseChart = ({ data, totalExpense }) => {
    const chartData = data.map(item => ({
        name: item.category,
        population: item.amount,
        color: item.color,
        legendFontColor: '#7F7F7F',
        legendFontSize: 12,
    }));
    
    if (totalExpense === 0 || data.length === 0) {
        return (
            <View style={chartStyles.noDataContainer}>
                <Text style={chartStyles.noDataText}>Сүүлийн 30 хоногт зарлагын гүйлгээ бүртгэгдээгүй байна.</Text>
            </View>
        );
    }

    return (
        <View style={chartStyles.chartContainer}>
            <PieChart
                data={chartData}
                width={screenWidth - 40}
                height={200}
                chartConfig={{
                    backgroundColor: '#ffffff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor={"population"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                absolute
            />

            <View style={chartStyles.legendContainer}>
                {data.map((item, index) => (
                    <View key={index} style={chartStyles.legendItem}>
                        <View style={[chartStyles.colorDot, { backgroundColor: item.color }]} />
                        <Text style={chartStyles.legendText}>
                            {item.category} ({item.percentage}%)
                        </Text>
                        <Text style={chartStyles.legendAmount}>
                            {formatMoney(item.amount)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

// --------------------------------------------------------
// 2. КОМПОНЕНТ: Гүйлгээний Мөр
// --------------------------------------------------------
const TransactionItem = ({ item }) => (
    <View style={styles.transactionRow}>
        <View style={styles.transactionIconContainer}>
            <Ionicons 
                name={item.categoryIcon || 'ellipsis-horizontal-outline'} 
                size={24} 
                color={item.type === 'income' ? '#28a745' : '#dc3545'} 
            />
        </View>
        <View style={styles.transactionDetails}>
            <Text style={styles.transactionCategory}>{item.category}</Text>
            <Text style={styles.transactionDate}>{item.date?.toDate ? item.date.toDate().toLocaleDateString() : item.date}</Text>
        </View>
        <Text style={[
            styles.transactionAmount, 
            { color: item.type === 'income' ? '#28a745' : '#dc3545' }
        ]}>
            {item.type === 'income' ? '+' : '-'} {formatMoney(item.amount).replace('₮', '')}₮
        </Text>
    </View>
);

// --------------------------------------------------------
// 3. ҮНДСЭН ДЭЛГЭЦ
// --------------------------------------------------------
const FinanceScreen = () => {
    const navigation = useNavigation();
    const isFocused = useIsFocused();
    
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalEntryType, setModalEntryType] = useState('expense');
    const [transactions, setTransactions] = useState([]);
    const [balance, setBalance] = useState(0);
    const [monthlyIncome, setMonthlyIncome] = useState(0);
    const [monthlyExpense, setMonthlyExpense] = useState(0);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!AUTH.currentUser || !isFocused) return;
        
        setIsDataLoading(true);

        const q = query(
            collection(DB, "transactions"),
            where("userId", "==", AUTH.currentUser.uid),
            limit(100)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            let list = [];
            let totalBalance = 0;
            let inc = 0;
            let exp = 0;
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            snapshot.docs.forEach(doc => {
                const data = doc.data();
                list.push({ id: doc.id, ...data });

                if (data.type === 'income') {
                    totalBalance += data.amount;
                } else {
                    totalBalance -= data.amount;
                }

                if (data.date && data.date.toDate() > thirtyDaysAgo) {
                     if (data.type === 'income') {
                        inc += data.amount;
                    } else {
                        exp += data.amount;
                    }
                }
            });

            // Client-side эрэмбэлэх
            list.sort((a, b) => {
                if (!a.date || !b.date) return 0;
                return b.date.toDate() - a.date.toDate();
            });

            setTransactions(list);
            setBalance(totalBalance);
            setMonthlyIncome(inc);
            setMonthlyExpense(exp);
            setIsDataLoading(false);
        }, (error) => {
            console.error("Error fetching transactions: ", error);
            setIsDataLoading(false);
        });

        return () => unsubscribe();
    }, [isFocused]);

    const prepareChartData = () => {
        const recentExpenses = transactions.filter(t => {
             const thirtyDaysAgo = new Date();
             thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
             return t.type === 'expense' && t.date && t.date.toDate() > thirtyDaysAgo;
        });

        const breakdown = recentExpenses.reduce((acc, t) => {
            acc[t.category] = (acc[t.category] || 0) + t.amount;
            return acc;
        }, {});

        const total = monthlyExpense;
        
        return Object.keys(breakdown).map(category => ({
            category: category,
            amount: breakdown[category],
            percentage: total ? Math.round((breakdown[category] / total) * 100) : 0,
            color: CATEGORY_COLORS[category] || '#6c757d',
        })).sort((a, b) => b.amount - a.amount);
    };
    
    const chartData = prepareChartData();
    const recentTransactions = transactions.slice(0, 5);
    


    // 💡 Түргэн Бүртгэл Нээх Функц
    const openQuickEntry = (type) => {
        setModalEntryType(type);
        setIsModalVisible(true);
    };

    // 💡 EntryScreen руу шилжих (Бүрэн бүртгэл)
    const goToFullEntry = (type) => {
        navigation.navigate('AddTransaction', { type: type });
    };

    const goToIncomeEntry = () => {
        openQuickEntry('income');
    };

    const goToExpenseEntry = () => {
        openQuickEntry('expense');
    };

    // 💡 ШИНЭ ФУНКЦ: Гүйлгээний түүх рүү шилжих
    const goToTransactionHistory = () => {
        navigation.navigate('TransactionHistory');
    };

    return (
        <ScrollView style={styles.container}>
            
            {/* 💡 Header ба НЭМЭХ ТОВЧЛУУР (MODAL-аар нээгдэнэ) */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
                <View style={styles.headerButtons}>
                    <TouchableOpacity 
                        style={styles.recurringButton}
                        onPress={() => navigation.navigate('AddRecurringTransaction')}
                    >
                        <Ionicons name="repeat" size={24} color="#ffc107" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.addButton}
                        onPress={() => openQuickEntry('expense')}
                    >
                        <Ionicons name="add-circle" size={38} color="#007bff" />
                    </TouchableOpacity>
                </View>
            </View>

            <TouchableOpacity 
                style={styles.balanceCard}
                onPress={goToTransactionHistory}
                activeOpacity={0.8}
            >
                <Text style={styles.balanceLabel}>Нийт Үлдэгдэл</Text>
                {isDataLoading ? (
                    <ActivityIndicator color="#fff" size="large" />
                ) : (
                    <Text style={styles.balanceAmount}>{formatMoney(balance)}</Text>
                )}
                <View style={styles.balanceInfoRow}>
                    <Text style={styles.balanceInfoText}>Дэлгэрэнгүй түүхийг харах</Text>
                    <Ionicons name="chevron-forward-outline" size={20} color="#fff" />
                </View>
            </TouchableOpacity>

            {/* 2. Орлого ба Зарлагын Тойм */}
            <View style={styles.summaryContainer}>
                <TouchableOpacity 
                    style={[styles.summaryBox, styles.incomeBox]}
                    onPress={goToIncomeEntry}
                    onLongPress={() => goToFullEntry('income')}
                    activeOpacity={0.8}
                >
                    {isDataLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Ionicons name="arrow-up-circle-outline" size={30} color="#fff" />
                            <Text style={styles.summaryLabel}>Орлого (30 хоног)</Text>
                            <Text style={styles.summaryAmount}>{formatMoney(monthlyIncome)}</Text>
                            <Text style={styles.hintText}>Tap to Quick Entry</Text>
                        </>
                    )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.summaryBox, styles.expenseBox]}
                    onPress={goToExpenseEntry}
                    onLongPress={() => goToFullEntry('expense')}
                    activeOpacity={0.8}
                >
                    {isDataLoading ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Ionicons name="arrow-down-circle-outline" size={30} color="#fff" />
                            <Text style={styles.summaryLabel}>Зарлага (30 хоног)</Text>
                            <Text style={styles.summaryAmount}>{formatMoney(monthlyExpense)}</Text>
                            <Text style={styles.hintText}>Tap to Quick Entry</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Зарлагын Задаргаа</Text>
                {isDataLoading ? (
                    <ActivityIndicator size="small" color="#007bff" style={{padding: 20}}/>
                ) : (
                    <ExpenseChart data={chartData} totalExpense={monthlyExpense} />
                )}
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Сүүлийн Гүйлгээнүүд</Text>
                {isDataLoading ? (
                     <ActivityIndicator size="small" color="#007bff" />
                ) : recentTransactions.length > 0 ? (
                    recentTransactions.map(item => (
                        <TransactionItem key={item.id} item={item} />
                    ))
                ) : (
                    <Text style={{textAlign: 'center', color: '#6c757d'}}>Сүүлийн гүйлгээ байхгүй байна.</Text>
                )}
                
                <TouchableOpacity style={styles.seeAllButton} onPress={goToTransactionHistory}>
                    <Text style={styles.seeAllText}>Бүгдийг Харах</Text>
                </TouchableOpacity>
            </View>
            
            {/* 💡 QUICK ENTRY MODAL-ыг render хийх */}
            <QuickEntryModal
                isVisible={isModalVisible}
                onClose={() => setIsModalVisible(false)}
                initialType={modalEntryType}
            />

            <View style={{height: 50}} />
        </ScrollView>
    );
};

// --------------------------------------------------------
// 3. СТИЛ
// --------------------------------------------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6', // Зөөлөн цагаан дэвсгэр
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#212529',
    },
    headerButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    recurringButton: {
        marginRight: 15,
        padding: 8,
        borderRadius: 20,
        backgroundColor: '#fff3cd',
    },
    // Үндсэн Үлдэгдлийн Карт
    balanceCard: {
        backgroundColor: '#007bff', // Гол цэнхэр өнгө
        padding: 25,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    balanceLabel: {
        fontSize: 16,
        color: '#e9ecef',
        marginBottom: 5,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 10,
    },
    balanceInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    balanceInfoText: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
    },
    // Орлого/Зарлагын Тойм
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    summaryBox: {
        width: '48%',
        padding: 15,
        borderRadius: 15,
        alignItems: 'flex-start',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    incomeBox: {
        backgroundColor: '#28a745', // Ногоон
    },
    expenseBox: {
        backgroundColor: '#dc3545', // Улаан
    },
    summaryLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 5,
    },
    summaryAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 3,
    },
    hintText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 10,
        marginTop: 5,
    },
    // Ерөнхий Карт ба График
    sectionCard: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 15,
    },
    chartPlaceholder: {
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
    },
    // Гүйлгээний жагсаалт
    transactionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
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
    transactionDate: {
        fontSize: 12,
        color: '#6c757d',
        marginTop: 2,
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    seeAllButton: {
        marginTop: 15,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        alignItems: 'center',
    },
    seeAllText: {
        color: '#007bff',
        fontWeight: '600',
    }
});

const chartStyles = StyleSheet.create({
    chartContainer: {
        flexDirection: 'column',
        alignItems: 'center',
        paddingVertical: 10,
    },
    noDataContainer: {
        padding: 30,
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        margin: 10,
        alignItems: 'center'
    },
    noDataText: {
        color: '#6c757d',
        fontSize: 14,
    },
    legendContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginTop: 15,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        color: '#343a40',
        flex: 1,
    },
    legendAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#343a40',
    }
});

export default FinanceScreen;