import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';

export default function BudgetScreen() {
  const navigation = useNavigation();
  const currentMonthYear = new Date().toISOString().substring(0, 7);
  
  const [budgets, setBudgets] = useState([]);
  const [mainBudget, setMainBudget] = useState(null);
  const [categories, setCategories] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState('monthly');
  
  const [selectedMonthYear, setSelectedMonthYear] = useState(currentMonthYear);
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const userId = AUTH.currentUser?.uid;
    if (!userId || !selectedMonthYear) return;

    const qMain = query(
      collection(DB, 'budgets'),
      where('userId', '==', userId),
      where('type', '==', 'main'),
      where('monthYear', '==', selectedMonthYear)
    );

    const unsubscribeMain = onSnapshot(qMain, (snapshot) => {
      const budgetDoc = snapshot.docs[0];
      if (budgetDoc) {
        const data = { id: budgetDoc.id, ...budgetDoc.data() };
        setMainBudget(data);
        setBudgets(data.allocatedCategories || []);
      } else {
        setMainBudget(null);
        setBudgets([]);
      }
    });

    const categoriesQuery = query(collection(DB, 'categories'), where('userId', '==', userId), where('type', '==', 'expense'));
    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCategories(categoriesList);
    });

    return () => { unsubscribeMain(); unsubscribeCategories(); };
  }, [selectedMonthYear]);

  const handleSave = async () => {
    if (!categoryId || !amount) {
      Alert.alert('Алдаа', 'Бүх талбарыг бөглөнө үү');
      return;
    }

    try {
      if (editingBudget) {
        await updateDoc(doc(DB, 'budgets', editingBudget.id), {
          categoryId,
          amount: parseFloat(amount),
          period,
        });
      } else {
        await addDoc(collection(DB, 'budgets'), {
          userId: AUTH.currentUser.uid,
          categoryId,
          amount: parseFloat(amount),
          period,
          createdAt: new Date(),
        });
      }
      resetForm();
    } catch (error) {
      Alert.alert('Алдаа', 'Төсөв хадгалахад алдаа гарлаа');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Устгах', 'Энэ төсвийг устгах уу?', [
      { text: 'Үгүй', style: 'cancel' },
      { text: 'Тийм', onPress: async () => {
        await deleteDoc(doc(DB, 'budgets', id));
      }}
    ]);
  };

  const openModal = (budget = null) => {
    if (budget) {
      setEditingBudget(budget);
      setCategoryId(budget.categoryId);
      setAmount(budget.amount.toString());
      setPeriod(budget.period);
    }
    setModalVisible(true);
  };

  const resetForm = () => {
    setModalVisible(false);
    setEditingBudget(null);
    setCategoryId('');
    setAmount('');
    setPeriod('monthly');
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setIsPickerVisible(Platform.OS === 'ios');

    if (event.type === 'set') {
      setSelectedDate(currentDate);
      const newMonthYear = currentDate.toISOString().substring(0, 7);
      setSelectedMonthYear(newMonthYear);
    }
  };

  const showPicker = () => {
    setIsPickerVisible(true);
  };

  const getCategoryName = (catId) => {
    return categories.find(c => c.id === catId)?.name || 'Тодорхойгүй';
  };

  return (
    <SafeAreaView style={styles.container}>
      {isPickerVisible && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      <View style={styles.headerContainer}>
        <Text style={styles.title}>Төсөв Удирдах</Text>
        <TouchableOpacity style={styles.monthPicker} onPress={showPicker}>
          <Ionicons name="calendar-outline" size={24} color="#007bff" />
          <Text style={styles.monthText}>{selectedMonthYear}</Text>
        </TouchableOpacity>
      </View>

      {mainBudget ? (
        <View style={styles.mainBudgetBox}>
          <Text style={styles.mainBudgetTitle}>{selectedMonthYear} сарын нийт төсөв:</Text>
          <Text style={styles.mainBudgetAmount}>{(mainBudget.totalIncome || 0).toLocaleString()} ₮</Text>
          <Text style={styles.mainBudgetInfo}>
            Хуваарилсан: {((mainBudget.allocatedCategories || []).reduce((sum, cat) => sum + (cat.amount || 0), 0)).toLocaleString()} ₮
          </Text>
          <Text style={styles.mainBudgetInfo}>
            Зарцуулсан: {((mainBudget.allocatedCategories || []).reduce((sum, cat) => sum + (cat.spent || 0), 0)).toLocaleString()} ₮
          </Text>
          <TouchableOpacity 
            style={styles.editMainButton} 
            onPress={() => navigation.navigate('AddBudgetScreen')}
          >
            <Ionicons name="create-outline" size={16} color="#fff" />
            <Text style={styles.editMainText}>Засах</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noBudgetBox}>
          <Text style={styles.noBudgetText}>{selectedMonthYear} сард төсөв үүсгээгүй байна.</Text>
          <TouchableOpacity 
            style={styles.createBudgetButton} 
            onPress={() => navigation.navigate('AddBudgetScreen')}
          >
            <Text style={styles.createBudgetText}>Төсөв Үүсгэх</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Категорийн Төсөв</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('BudgetingScreen')}>
          <Ionicons name="settings-outline" size={24} color="#007bff" />
          <Text style={styles.budgetingText}>Төсөвлөлт</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={budgets}
        keyExtractor={(item, index) => item.name || `budget-${index}`}
        renderItem={({ item }) => {
          const spent = item.spent || 0;
          const amount = item.amount || 0;
          const remaining = amount - spent;
          const percentage = amount > 0 ? (spent / amount) * 100 : 0;
          
          const progressBarColor = percentage >= 100 ? '#dc3545'
                                  : percentage >= 75 ? '#ffc107'
                                  : '#28a745';
          
          return (
            <TouchableOpacity 
              style={styles.budgetItem}
              onPress={() => {
                if (mainBudget) {
                  navigation.navigate('AddBudgetScreen', {
                    budgetId: mainBudget.id,
                    editingCategory: item.name,
                    monthYear: selectedMonthYear,
                  });
                }
              }}
            >
              <View style={styles.budgetHeader}>
                <Text style={styles.categoryName}>{item.name || 'Тодорхойгүй'}</Text>
                <Text style={[styles.remainingAmount, { color: remaining < 0 ? '#dc3545' : '#28a745' }]}>
                  {remaining.toLocaleString()} ₮ {remaining < 0 ? '(Хэтэрсэн)' : ''}
                </Text>
              </View>
              
              <View style={styles.amountContainer}>
                <Text style={styles.spentAmount}>Зарцуулалт: {spent.toLocaleString()} ₮</Text>
                <Text style={styles.totalAmount}> / Төсөв: {amount.toLocaleString()} ₮</Text>
              </View>
              
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${Math.min(percentage, 100)}%`, backgroundColor: progressBarColor }]} />
              </View>
              
              <Text style={styles.percentageText}>
                {Math.min(percentage, 100).toFixed(1)}%
                {percentage > 100 && <Text style={{ color: '#dc3545' }}> ({Math.abs(remaining).toLocaleString()}₮ хэтэрсэн)</Text>}
              </Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          mainBudget ? 
            <Text style={styles.emptyText}>Төсөвлөсөн категори байхгүй.</Text> :
            <View />
        }
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingBudget ? 'Төсөв Засах' : 'Төсөв Нэмэх'}</Text>
            
            <Text style={styles.label}>Категори</Text>
            <View style={styles.pickerContainer}>
              {categories.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryOption, categoryId === cat.id && styles.selectedCategory]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <Text style={categoryId === cat.id ? styles.selectedText : styles.optionText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Дүн</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholder="0"
            />

            <Text style={styles.label}>Хугацаа</Text>
            <View style={styles.periodContainer}>
              <TouchableOpacity
                style={[styles.periodButton, period === 'monthly' && styles.selectedPeriod]}
                onPress={() => setPeriod('monthly')}
              >
                <Text style={period === 'monthly' ? styles.selectedText : styles.optionText}>Сар бүр</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.periodButton, period === 'yearly' && styles.selectedPeriod]}
                onPress={() => setPeriod('yearly')}
              >
                <Text style={period === 'yearly' ? styles.selectedText : styles.optionText}>Жил бүр</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetForm}>
                <Text style={styles.buttonText}>Болих</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.buttonText}>Хадгалах</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    elevation: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#343a40',
  },
  monthPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f7ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  monthText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
    marginLeft: 5,
  },
  mainBudgetBox: {
    backgroundColor: '#ffffff',
    padding: 15,
    margin: 10,
    borderRadius: 10,
    elevation: 3,
  },
  noBudgetBox: {
    backgroundColor: '#f8d7da',
    padding: 15,
    margin: 10,
    borderRadius: 8,
    borderLeftWidth: 5,
    borderLeftColor: '#dc3545',
  },
  mainBudgetTitle: {
    fontSize: 16,
    color: '#6c757d',
  },
  mainBudgetAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#17a2b8',
    marginTop: 5,
  },
  mainBudgetInfo: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 5,
  },
  editMainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffc107',
    padding: 8,
    borderRadius: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  editMainText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  noBudgetText: {
    fontSize: 16,
    color: '#721c24',
    textAlign: 'center',
  },
  createBudgetButton: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  createBudgetText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  addButton: {
    padding: 5,
  },
  budgetItem: {
    backgroundColor: '#ffffff',
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#343a40',
  },
  remainingAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  amountContainer: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  spentAmount: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c757d',
  },
  totalAmount: {
    fontSize: 14,
    color: '#adb5bd',
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 6,
    marginBottom: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  percentageText: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'right',
    fontWeight: '600',
  },
  period: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6c757d',
    marginTop: 50,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  selectedCategory: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  optionText: {
    color: '#343a40',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  periodContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
  },
  selectedPeriod: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007bff',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  budgetingText: {
    color: '#007bff',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },
});
