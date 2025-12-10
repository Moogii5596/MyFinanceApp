import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DB, AUTH } from '../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useFocusEffect } from '@react-navigation/native';


const HomeScreen = ({ navigation }) => {

    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Dashboard Data States
    const [totalBalance, setTotalBalance] = useState(0);
    const [monthlySummary, setMonthlySummary] = useState({ income: 0, expense: 0 });
    const [recentTransactions, setRecentTransactions] = useState([]);
    const [budgetStatus, setBudgetStatus] = useState(null);
    
    const user = AUTH.currentUser;

    // Fetch all dashboard data
    const fetchData = async () => {
        if (!user) return;
        
        const userId = user.uid;
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        try {
            // A. Total Balance calculation
            const qAllTrans = query(
                collection(DB, "transactions"),
                where("userId", "==", userId)
            );
            const transSnapshot = await getDocs(qAllTrans);
            
            let balance = 0;
            transSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.type === 'INCOME') balance += data.amount;
                if (data.type === 'EXPENSE') balance -= data.amount;
                if (data.type === 'SAVING') balance -= data.amount;
            });
            setTotalBalance(balance);

            // B. Monthly Summary
            const monthlyQ = query(
                collection(DB, "transactions"),
                where("userId", "==", userId),
                where("date", ">=", startOfMonth),
                orderBy("date", "desc")
            );
            const monthlySnapshot = await getDocs(monthlyQ);

            let monthlyIncome = 0;
            let monthlyExpense = 0;
            monthlySnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.type === 'INCOME') monthlyIncome += data.amount;
                if (data.type === 'EXPENSE') monthlyExpense += data.amount;
            });
            setMonthlySummary({ income: monthlyIncome, expense: monthlyExpense });
            
            // C. Recent Transactions
            const recentQ = query(
                collection(DB, "transactions"),
                where("userId", "==", userId),
                orderBy("date", "desc"),
                limit(5)
            );
            const recentSnapshot = await getDocs(recentQ);
            setRecentTransactions(recentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            
            // D. Budget Status
            const qBudgets = query(
                collection(DB, "budgets"),
                where("userId", "==", userId)
            );
            const budgetsSnapshot = await getDocs(qBudgets);
            
            if (!budgetsSnapshot.empty) {
                const firstBudget = budgetsSnapshot.docs[0].data();
                // Calculate spent amount for this budget category
                const categoryExpenses = monthlySnapshot.docs
                    .filter(doc => doc.data().category === firstBudget.categoryName && doc.data().type === 'EXPENSE')
                    .reduce((sum, doc) => sum + doc.data().amount, 0);
                
                const percentage = Math.round((categoryExpenses / firstBudget.limitAmount) * 100);
                
                setBudgetStatus({
                    name: firstBudget.categoryName,
                    limit: firstBudget.limitAmount,
                    spent: categoryExpenses,
                    percentage: percentage
                });
            } else {
                setBudgetStatus(null);
            }

        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            Alert.alert("Алдаа", "Dashboard-ийн мэдээллийг татаж чадсангүй.");
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };
    
    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setIsRefreshing(true);
        fetchData();
    };

    if (isLoading) {
        return <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
    }
    
    // Recent transaction item renderer
    const renderRecentItem = (item) => {
        const isExpense = item.type === 'EXPENSE' || item.type === 'SAVING';
        const color = isExpense ? '#dc3545' : '#28a745';
        const icon = isExpense ? 'remove-circle' : 'add-circle';

        return (
            <View key={item.id} style={[styles.recentItem, { borderBottomColor: theme.colors.border }]}>
                <Ionicons name={icon} size={24} color={color} />
                <View style={styles.recentTextContainer}>
                    <Text style={[styles.recentDescription, { color: theme.colors.text }]} numberOfLines={1}>{item.description || item.category}</Text>
                    <Text style={[styles.recentCategory, { color: theme.colors.subText }]}>{item.category} • {item.date.toDate().toLocaleDateString()}</Text>
                </View>
                <Text style={[styles.recentAmount, { color: color }]}>{isExpense ? '-' : '+'}{item.amount.toLocaleString()} ₮</Text>
            </View>
        );
    };

    return (
        <ScrollView 
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        >
            <Text style={[styles.greetingText, { color: theme.colors.subText }]}>👋 Сайн уу, {user.email.split('@')[0]}</Text>

            {/* Total Balance Card */}
            <View style={[styles.balanceCard, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.balanceLabel}>Нийт Үлдэгдэл</Text>
                <Text style={styles.totalBalanceText}>{totalBalance.toLocaleString()} ₮</Text>
                <Text style={styles.balanceNote}>Үндсэн данс + Хадгаламж</Text>
            </View>

            {/* Monthly Summary */}
            <View style={styles.summaryContainer}>
                <View style={[styles.summaryBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Ionicons name="trending-up" size={24} color={theme.colors.success} />
                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>+{monthlySummary.income.toLocaleString()} ₮</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.subText }]}>Энэ сарын Орлого</Text>
                </View>
                <View style={[styles.summaryBox, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                    <Ionicons name="trending-down" size={24} color={theme.colors.danger} />
                    <Text style={[styles.summaryValue, { color: theme.colors.text }]}>-{monthlySummary.expense.toLocaleString()} ₮</Text>
                    <Text style={[styles.summaryLabel, { color: theme.colors.subText }]}>Энэ сарын Зарлага</Text>
                </View>
            </View>

            {/* Budget Status */}
            {budgetStatus ? (
                <View style={[styles.budgetCard, { backgroundColor: theme.colors.card }]}>
                    <View style={styles.budgetHeader}>
                        <Text style={[styles.budgetTitle, { color: theme.colors.text }]}>📈 Төсвийн Хяналт: {budgetStatus.name}</Text>
                        <Text style={[styles.budgetPercent, { color: theme.colors.text }]}>{budgetStatus.percentage}%</Text>
                    </View>
                    <View style={[styles.progressBarBackground, { backgroundColor: theme.colors.border }]}>
                        <View style={[styles.progressBarFill, { 
                            width: `${budgetStatus.percentage > 100 ? 100 : budgetStatus.percentage}%`, 
                            backgroundColor: budgetStatus.percentage > 80 ? theme.colors.danger : theme.colors.warning 
                        }]} />
                    </View>
                    <Text style={[styles.budgetDetails, { color: theme.colors.subText }]}>
                        {budgetStatus.spent.toLocaleString()} ₮ / {budgetStatus.limit.toLocaleString()} ₮
                    </Text>
                    <TouchableOpacity style={[styles.budgetButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]} onPress={() => navigation.navigate('Төсөв')}>
                        <Text style={[styles.budgetButtonText, { color: theme.colors.primary }]}>Төсөв Удирдах</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={[styles.noDataCard, { backgroundColor: theme.colors.card }]}>
                    <Text style={[styles.noDataText, { color: theme.colors.subText }]}>Төсвийн мэдээлэл оруулаагүй байна.</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Төсөв')}>
                        <Text style={[styles.linkText, { color: theme.colors.primary }]}>Төсөв үүсгэх</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Recent Transactions */}
            <View style={[styles.recentSection, { backgroundColor: theme.colors.card }]}>
                <Text style={[styles.sectionHeader, { color: theme.colors.text }]}>Сүүлийн Гүйлгээнүүд</Text>
                {recentTransactions.length > 0 ? (
                    recentTransactions.map(renderRecentItem)
                ) : (
                    <Text style={[styles.emptyRecent, { color: theme.colors.subText }]}>Сүүлийн үеийн гүйлгээ байхгүй.</Text>
                )}
                <TouchableOpacity style={[styles.viewAllButton, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate('TransactionHistory')}>
                    <Text style={[styles.viewAllText, { color: theme.colors.primary }]}>Бүх Гүйлгээг Харах</Text>
                </TouchableOpacity>
            </View>
            
            <View style={{height: 50}} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    greetingText: { fontSize: 18, fontWeight: '500', marginBottom: 20 },
    
    // Balance Card
    balanceCard: { padding: 25, borderRadius: 15, marginBottom: 20, elevation: 5 },
    balanceLabel: { fontSize: 16, color: '#e9ecef' },
    totalBalanceText: { fontSize: 40, fontWeight: 'bold', color: 'white', marginVertical: 5 },
    balanceNote: { fontSize: 12, color: '#adb5bd' },

    // Summary
    summaryContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    summaryBox: { flex: 1, padding: 15, borderRadius: 10, marginHorizontal: 5, alignItems: 'center', borderWidth: 1 },
    summaryValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
    summaryLabel: { fontSize: 12, textAlign: 'center' },

    // Budget Card
    budgetCard: { padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2 },
    budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    budgetTitle: { fontSize: 16, fontWeight: 'bold' },
    budgetPercent: { fontSize: 16, fontWeight: 'bold' },
    progressBarBackground: { height: 10, borderRadius: 5, marginBottom: 5 },
    progressBarFill: { height: 10, borderRadius: 5 },
    budgetDetails: { fontSize: 14, marginBottom: 10 },
    budgetButton: { padding: 10, borderRadius: 8, borderWidth: 1 },
    budgetButtonText: { fontWeight: 'bold', textAlign: 'center' },
    
    // No Data Card
    noDataCard: { padding: 15, borderRadius: 10, marginBottom: 20, elevation: 2, alignItems: 'center' },
    noDataText: { fontSize: 15, marginBottom: 5 },
    linkText: { fontWeight: 'bold' },

    // Recent Transactions
    recentSection: { padding: 15, borderRadius: 10, elevation: 2 },
    sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    recentItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
    recentTextContainer: { flex: 1, marginHorizontal: 10 },
    recentDescription: { fontSize: 15, fontWeight: '600' },
    recentCategory: { fontSize: 12 },
    recentAmount: { fontSize: 16, fontWeight: 'bold' },
    emptyRecent: { textAlign: 'center', paddingVertical: 10 },
    viewAllButton: { marginTop: 15, paddingVertical: 10, borderTopWidth: 1 },
    viewAllText: { textAlign: 'center', fontWeight: 'bold' },
});

export default HomeScreen;