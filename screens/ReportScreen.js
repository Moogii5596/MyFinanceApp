import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Platform, Dimensions, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { useUser } from '../contexts/UserContext';
import { usePremium } from '../contexts/PremiumContext';

const screenWidth = Dimensions.get('window').width;

const chartColors = [
  '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
  '#FF9F40', '#E7E9ED', '#33CCFF', '#FFB366', '#85E3FF'
];

const getCurrentMonthRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return {
        startDate: start.getTime(),
        endDate: end.getTime(),
        displayText: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    };
};

const ReportScreen = () => {
    const userId = AUTH.currentUser?.uid;
    const navigation = useNavigation();
    const { isPremium, isLoadingPremium } = usePremium();
    const [transactions, setTransactions] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(getCurrentMonthRange());
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [expenseTrendData, setExpenseTrendData] = useState(null);
    const [budgetPerformanceData, setBudgetPerformanceData] = useState(null);

    // Зарлагын хөгжлийн өгөгдөл бэлтгэх
    const generateExpenseTrendData = async () => {
        if (!userId) return;
        
        const monthlyData = [];
        const labels = [];
        
        for (let i = 3; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).getTime();
            
            const q = query(
                collection(DB, "transactions"),
                where("userId", "==", userId),
                where("type", "==", "expense")
            );
            
            const snapshot = await getDocs(q);
            let monthTotal = 0;
            
            snapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.date >= startOfMonth && data.date <= endOfMonth) {
                    monthTotal += Math.abs(data.amount);
                }
            });
            
            monthlyData.push(monthTotal);
            labels.push(`${date.getMonth() + 1}-р сар`);
        }
        
        setExpenseTrendData({
            labels,
            datasets: [{
                data: monthlyData,
                color: (opacity = 1) => `rgba(220, 53, 69, ${opacity})`,
                strokeWidth: 2
            }]
        });
    };
    
    // Төсвийн биелэлтийн өгөгдөл бэлтгэх
    const generateBudgetPerformanceData = async () => {
        if (!userId) return;
        
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).getTime();
        
        const budgetsQuery = query(
            collection(DB, "budgets"),
            where("groupId", "==", userId)
        );
        
        const transactionsQuery = query(
            collection(DB, "transactions"),
            where("userId", "==", userId),
            where("type", "==", "expense")
        );
        
        const [budgetsSnapshot, transactionsSnapshot] = await Promise.all([
            getDocs(budgetsQuery),
            getDocs(transactionsQuery)
        ]);
        
        const budgets = budgetsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const currentBudgets = budgets.filter(budget => 
            budget.periodEnd && budget.periodEnd.toDate() >= new Date(startOfMonth)
        );
        
        const pieData = [];
        
        currentBudgets.forEach((budget, index) => {
            let spent = 0;
            transactionsSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.date >= startOfMonth && data.date <= endOfMonth && data.category === budget.category) {
                    spent += Math.abs(data.amount);
                }
            });
            
            const percentage = Math.min(100, (spent / budget.budgetAmount) * 100);
            
            pieData.push({
                name: `${budget.category} (${Math.round(percentage)}%)`,
                population: percentage,
                color: chartColors[index % chartColors.length],
                legendFontColor: "#7F7F7F",
                legendFontSize: 14
            });
        });
        
        setBudgetPerformanceData(pieData);
    };
    
    useEffect(() => {
        if (isPremium && userId) {
            generateExpenseTrendData();
            generateBudgetPerformanceData();
        }
    }, [isPremium, userId]);

    useFocusEffect(
        React.useCallback(() => {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            
            const qTransactions = query(
                collection(DB, "transactions"), 
                where("userId", "==", userId)
            );
            
            const unsubscribe = onSnapshot(qTransactions, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                const filtered = data.filter(t => {
                    const tDate = t.date;
                    return tDate >= timeRange.startDate && tDate <= timeRange.endDate && t.type !== 'transfer';
                });
                
                setTransactions(filtered);
                setIsLoading(false);
            }, (error) => {
                console.error("Error fetching transactions: ", error);
                Alert.alert('Алдаа', 'Тайлангийн өгөгдөл татахад алдаа гарлаа.');
                setIsLoading(false);
            });

            return () => unsubscribe();
        }, [userId, timeRange])
    );
    
    const handleDateChange = (event, date) => {
        const currentDate = date || selectedDate;
        setIsPickerVisible(Platform.OS === 'ios');
        
        if (event.type === 'set') {
            setSelectedDate(currentDate);
            
            const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59);

            setTimeRange({
                startDate: start.getTime(),
                endDate: end.getTime(),
                displayText: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
            });
        }
    };
    
    const showPicker = () => {
        setIsPickerVisible(true);
    };

    useEffect(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const categoryBreakdown = {};
        
        transactions.forEach(trans => {
            if (trans.type === 'transfer') return;
            
            const amount = Math.abs(parseFloat(trans.amount)) || 0;

            if (trans.type === 'income') {
                totalIncome += amount;
            } else if (trans.type === 'expense') {
                totalExpense += amount;
                
                const catName = trans.category || trans.categoryName || 'Үл мэдэгдэх';
                categoryBreakdown[catName] = (categoryBreakdown[catName] || 0) + amount;
            }
        });
        
        let chartData = [];
        let colorIndex = 0;
        
        Object.entries(categoryBreakdown)
            .sort(([, a], [, b]) => b - a)
            .forEach(([categoryName, amount]) => {
                if (amount > 0) {
                    chartData.push({
                        name: categoryName,
                        amount: amount,
                        legendFontColor: "#7F7F7F",
                        legendFontSize: 14,
                        color: chartColors[colorIndex % chartColors.length],
                    });
                    colorIndex++;
                }
            });
        
        setReportData({
            totalIncome,
            totalExpense,
            netBalance: totalIncome - totalExpense,
            categoryBreakdown,
            chartData,
        });
    }, [transactions]);

    if (isLoading || isLoadingPremium) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007bff" />
                </View>
            </SafeAreaView>
        );
    }
    
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
            {isPickerVisible && (
                <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                />
            )}
            
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Санхүүгийн Тайлан</Text>
                <TouchableOpacity style={styles.timeRangePicker} onPress={showPicker}>
                    <Ionicons name="calendar-outline" size={20} color="#007bff" />
                    <Text style={styles.timeRangeTextValue}>{timeRange.displayText}</Text>
                </TouchableOpacity>
            </View>
            
            {reportData && (
                <>
                    <View style={styles.summaryCard}>
                        <Text style={styles.cardTitle}>💰 Цэвэр Дүнгийн Нэгтгэл</Text>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Орлого:</Text>
                            <Text style={styles.incomeAmount}>{reportData.totalIncome.toLocaleString()} ₮</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Зарлага:</Text>
                            <Text style={styles.expenseAmount}>{reportData.totalExpense.toLocaleString()} ₮</Text>
                        </View>
                        <View style={styles.netBalanceRow}>
                            <Text style={styles.netBalanceLabel}>Цэвэр Үлдэгдэл:</Text>
                            <Text style={[
                                styles.netBalanceAmount, 
                                { color: reportData.netBalance >= 0 ? '#28a745' : '#dc3545' }
                            ]}>
                                {reportData.netBalance.toLocaleString()} ₮
                            </Text>
                        </View>
                    </View>
                    
                    <View style={styles.categoryCard}>
                        <Text style={styles.cardTitle}>📊 Категорийн Зардлын Хуваарилалт</Text>
                        {
                            Object.entries(reportData.categoryBreakdown)
                                .sort(([, a], [, b]) => b - a)
                                .map(([categoryName, amount]) => (
                                    <View key={categoryName} style={styles.categoryItem}>
                                        <Text style={styles.categoryName}>{categoryName}</Text>
                                        <Text style={styles.categoryAmount}>{amount.toLocaleString()} ₮</Text>
                                    </View>
                                ))
                        }
                        {
                           Object.keys(reportData.categoryBreakdown).length === 0 &&
                           <Text style={styles.noDataText}>Сонгосон хугацаанд зарлага байхгүй байна.</Text>
                        }
                    </View>

                    {!isPremium && (
                        <View style={styles.upsellCard}>
                            <Ionicons name="star" size={28} color="#FFD700" />
                            <Text style={styles.upsellText}>Сүүлийн 4 сарын зарлагын хандлага, төсвийн биелэлтийн графикийг Premium эрхээр үзнэ.</Text>
                            <TouchableOpacity style={styles.premiumButton} onPress={() => navigation.navigate('Тохиргоо', { screen: 'PremiumScreen' })}>
                                <Text style={styles.premiumButtonText}>Premium Авах</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isPremium && expenseTrendData && (
                        <View style={styles.chartContainer}>
                            <Text style={styles.cardTitle}>📈 Зарлагын Хөгжил (Сүүлийн 4 сар)</Text>
                            <LineChart
                                data={expenseTrendData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={{
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(52, 58, 64, ${opacity})`,
                                    strokeWidth: 2,
                                }}
                                bezier
                                style={{ marginVertical: 8, borderRadius: 16 }}
                            />
                        </View>
                    )}
                    
                    {isPremium && budgetPerformanceData && budgetPerformanceData.length > 0 && (
                        <View style={styles.chartContainer}>
                            <Text style={styles.cardTitle}>💰 Төсвийн Биелэлт (Сүүлийн сар)</Text>
                            <PieChart
                                data={budgetPerformanceData}
                                width={screenWidth - 40}
                                height={220}
                                chartConfig={{
                                    backgroundGradientFrom: '#ffffff',
                                    backgroundGradientTo: '#ffffff',
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                }}
                                accessor="population"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                center={[10, 5]}
                            />
                        </View>
                    )}
                    
                    {reportData.chartData && reportData.chartData.length > 0 ? (
                        <View style={styles.chartContainer}>
                            <Text style={styles.cardTitle}>📊 Зардлын Хуваарилалтын График</Text>
                            <PieChart
                                data={reportData.chartData}
                                width={screenWidth - 20}
                                height={220}
                                chartConfig={{
                                    backgroundColor: '#ffffff',
                                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                    decimalPlaces: 0,
                                }}
                                accessor="amount"
                                backgroundColor="transparent"
                                paddingLeft="15"
                                absolute
                                hasLegend={true}
                            />
                        </View>
                    ) : (
                        <View style={styles.chartPlaceholder}>
                            <Text style={styles.chartText}>График харуулах зарлагын мэдээлэл олдсонгүй.</Text>
                        </View>
                    )}
                </>
            )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#f0f2f5',
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    
    header: { 
        padding: 15, 
        backgroundColor: '#fff', 
        borderBottomWidth: 1, 
        borderBottomColor: '#e9ecef',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: { fontSize: 24, fontWeight: 'bold' },
    timeRangePicker: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e6f7ff',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    timeRangeTextValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#007bff',
        marginLeft: 5,
    },
    
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#343a40', marginBottom: 15 },
    
    summaryCard: { 
        backgroundColor: '#fff', 
        padding: 20, 
        margin: 10, 
        borderRadius: 10, 
        elevation: 2 
    },
    summaryRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f8f9fa',
    },
    summaryLabel: { fontSize: 16, color: '#495057' },
    incomeAmount: { fontSize: 16, fontWeight: '600', color: '#28a745' },
    expenseAmount: { fontSize: 16, fontWeight: '600', color: '#dc3545' },
    netBalanceRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: 10,
        marginTop: 10,
        borderTopWidth: 2,
        borderTopColor: '#e9ecef',
    },
    netBalanceLabel: { fontSize: 18, fontWeight: 'bold' },
    netBalanceAmount: { fontSize: 18, fontWeight: 'bold' },

    categoryCard: { 
        backgroundColor: '#fff', 
        padding: 20, 
        margin: 10, 
        borderRadius: 10, 
        elevation: 2 
    },
    categoryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f1f1',
    },
    categoryName: { fontSize: 16, color: '#495057' },
    categoryAmount: { fontSize: 16, fontWeight: '600', color: '#dc3545' },
    noDataText: { fontSize: 15, color: '#adb5bd', textAlign: 'center', padding: 10 },
    
    chartContainer: {
        backgroundColor: '#fff',
        padding: 10,
        margin: 10,
        borderRadius: 10,
        elevation: 2,
        alignItems: 'center',
        marginBottom: 30,
    },
    chartPlaceholder: {
        backgroundColor: '#e9f7ff',
        padding: 50,
        margin: 10,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#007bff',
        marginBottom: 30,
    },
    chartText: { fontSize: 16, color: '#007bff', fontWeight: 'bold' },
    
    
    upsellCard: {
        backgroundColor: '#fff',
        marginHorizontal: 20,
        marginBottom: 20,
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
    },
    upsellText: {
        fontSize: 15,
        color: '#6c757d',
        textAlign: 'center',
        marginVertical: 12,
    },
    // Premium Gate
    premiumGate: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
        backgroundColor: '#f4f7f6',
        minHeight: 400,
    },
    premiumHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 15,
        marginBottom: 10,
    },
    premiumText: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginBottom: 20,
    },
    premiumButton: {
        backgroundColor: '#007bff',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    premiumButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ReportScreen;
