import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DUMMY_CATEGORIES = [
    { name: 'Хүнс', type: 'expense' }, { name: 'Түрээс', type: 'expense' },
    { name: 'Тээвэр', type: 'expense' }, { name: 'Цалин', type: 'income' }, 
    { name: 'Бонус', type: 'income' }, { name: 'Бусад', type: 'expense' }
];
const TRANSACTION_TYPES = [
    { label: 'Орлого', value: 'income' }, 
    { label: 'Зарлага', value: 'expense' },
    { label: 'Хадгаламж', value: 'saving' },
    { label: 'Шилжүүлэг', value: 'transfer' }
];
const MONTHS = ['1-р сар', '2-р сар', '3-р сар', '4-р сар', '5-р сар', '6-р сар', '7-р сар', '8-р сар', '9-р сар', '10-р сар', '11-р сар', '12-р сар'];

const TransactionFilterModal = ({ isVisible, onClose, onApplyFilter, initialFilters }) => {
    const [typeFilter, setTypeFilter] = useState(initialFilters.type || null);
    const [categoryFilter, setCategoryFilter] = useState(initialFilters.category || null);
    const [monthFilter, setMonthFilter] = useState(initialFilters.month || null);
    
    const handleClear = () => {
        setTypeFilter(null);
        setCategoryFilter(null);
        setMonthFilter(null);
        onApplyFilter({ type: null, category: null, month: null });
        onClose();
    };

    const handleApply = () => {
        const filters = {
            type: typeFilter,
            category: categoryFilter,
            month: monthFilter,
        };
        onApplyFilter(filters);
        onClose();
    };
    
    const filteredCategories = typeFilter 
        ? DUMMY_CATEGORIES.filter(c => c.type === typeFilter) 
        : DUMMY_CATEGORIES;

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Гүйлгээг Шүүх</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Ionicons name="close-circle-outline" size={32} color="#6c757d" />
                    </TouchableOpacity>
                </View>
                
                <ScrollView contentContainerStyle={styles.content}>
                    
                    <Text style={styles.sectionTitle}>Төрөл</Text>
                    <View style={styles.filterGroup}>
                        {TRANSACTION_TYPES.map((type) => (
                            <TouchableOpacity
                                key={type.value}
                                style={[styles.filterButton, typeFilter === type.value && styles.activeButton]}
                                onPress={() => setTypeFilter(type.value === typeFilter ? null : type.value)}
                            >
                                <Text style={[styles.filterText, typeFilter === type.value && styles.activeText]}>{type.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Категори</Text>
                    <View style={styles.categoryGrid}>
                        {filteredCategories.map((cat) => (
                            <TouchableOpacity
                                key={cat.name}
                                style={[styles.categoryButton, categoryFilter === cat.name && styles.activeButton]}
                                onPress={() => setCategoryFilter(cat.name === categoryFilter ? null : cat.name)}
                            >
                                <Text style={[styles.filterText, categoryFilter === cat.name && styles.activeText]}>{cat.name}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <Text style={styles.sectionTitle}>Сар</Text>
                    <View style={styles.monthGrid}>
                        {MONTHS.map((month, index) => (
                            <TouchableOpacity
                                key={month}
                                style={[styles.monthButton, monthFilter === index + 1 && styles.activeButton]}
                                onPress={() => setMonthFilter(index + 1 === monthFilter ? null : index + 1)}
                            >
                                <Text style={[styles.filterText, monthFilter === index + 1 && styles.activeText]}>{month}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                </ScrollView>
                
                <View style={styles.footer}>
                    <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                        <Text style={styles.clearText}>Цэвэрлэх</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
                        <Text style={styles.applyText}>Шүүлтүүр Хэрэглэх</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f7f6' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: '#e9ecef' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#343a40' },
    content: { padding: 20 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#343a40', marginTop: 15, marginBottom: 10 },
    
    filterGroup: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 15 },

    filterButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', marginRight: 10, marginBottom: 10, },
    categoryButton: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, borderWidth: 1, borderColor: '#ccc', marginRight: 10, marginBottom: 10, },
    monthButton: { width: '31%', paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ccc', marginHorizontal: '1%', alignItems: 'center', marginBottom: 10 },
    
    activeButton: { backgroundColor: '#007bff', borderColor: '#007bff' },
    filterText: { color: '#343a40', fontSize: 14 },
    activeText: { color: 'white', fontWeight: 'bold' },

    footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#e9ecef' },
    clearButton: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#e9ecef', marginRight: 10 },
    clearText: { color: '#6c757d', fontWeight: 'bold' },
    applyButton: { flex: 2, padding: 15, borderRadius: 10, alignItems: 'center', backgroundColor: '#28a745' },
    applyText: { color: 'white', fontWeight: 'bold' },
});

export default TransactionFilterModal;