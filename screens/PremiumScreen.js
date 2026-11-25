import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AUTH, DB } from '../firebaseConfig';
import { useNavigation } from '@react-navigation/native';
import { useUser } from '../contexts/UserContext';
import { formatMoney } from '../utils/formatMoney';
import CustomAlertModal from '../components/CustomAlertModal';

const PREMIUM_PLANS = [
    { duration: '1 сар', price: 2500, discount: 0, description: 'Үндсэн Premium эрх' },
    { duration: '6 сар', price: 12000, discount: 20, description: '1 сарын төлбөртэй харьцуулахад хямд' },
    { duration: '1 жил', price: 23000, discount: 23, description: 'Жилийн шилдэг сонголт' },
];

const PREMIUM_FEATURES = [
    { icon: 'people-outline', name: '3 ба түүнээс олон гишүүнтэй гэр бүлийн групп', isNew: true },
    { icon: 'bar-chart-outline', name: 'Нарийвчилсан График ба Тайлан', isNew: false },
    { icon: 'receipt-outline', name: 'Хязгааргүй категорийн төсөв', isNew: true },
    { icon: 'filter-outline', name: 'Шүүлтүүрийн бүх боломж', isNew: false },
    { icon: 'save-outline', name: 'Үүлэн сан руу нөөцлөх', isNew: false },
];

const PremiumScreen = () => {
    const navigation = useNavigation();
    const { isPremium } = useUser();
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const userId = AUTH.currentUser?.uid;
    
    const handlePurchase = (plan) => {
        Alert.alert(
            "Төлбөр хийх",
            `${plan.duration} хугацааны Premium эрхийг ${formatMoney(plan.price)}-өөр авах уу?`,
            [
                { text: "Буцах", style: "cancel" },
                { text: "Төлөх", onPress: () => {
                    Alert.alert("Тун удахгүй", "Төлбөрийн систем холбогдож байна. Удахгүй Premium эрх авах боломжтой болно.");
                } }
            ]
        );
    };

    const handleSuccessConfirm = () => {
        setIsSuccessModalVisible(false);
        if (successMessage.includes('амжилттай')) {
            navigation.goBack();
        }
    };

    const renderFeature = (feature, index) => (
        <View key={index} style={styles.featureItem}>
            <Ionicons name={feature.icon} size={24} color="#007bff" style={styles.featureIcon} />
            <Text style={styles.featureText}>{feature.name}</Text>
            {feature.isNew && <Text style={styles.newBadge}>ШИНЭ</Text>}
        </View>
    );

    const renderPlan = (plan, index) => {
        const isRecommended = plan.duration === '1 жил';
        return (
            <TouchableOpacity 
                key={index} 
                style={[styles.planCard, isRecommended && styles.recommendedCard]}
                onPress={() => handlePurchase(plan)}
            >
                {isRecommended && <View style={styles.badge}><Text style={styles.badgeText}>ШИЛДЭГ</Text></View>}
                <Text style={styles.durationText}>{plan.duration}</Text>
                <Text style={styles.priceText}>{formatMoney(plan.price)}</Text>
                {plan.discount > 0 ? (
                    <Text style={styles.discountText}>🔥 {plan.discount}% Хямдрал</Text>
                ) : (
                    <Text style={styles.descriptionText}>{plan.description}</Text>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{flex: 1, backgroundColor: '#f4f7f6'}}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <View style={styles.header}>
                    <Text style={styles.headerTitle}><Ionicons name="star" size={24} color="#FFD700" /> Premium Сайжруулалт</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>⭐ Premium-ын Онцгой Боломжууд</Text>
                    {PREMIUM_FEATURES.map(renderFeature)}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionHeader}>💰 Төлөвлөгөө Сонгох</Text>
                    {PREMIUM_PLANS.map(renderPlan)}
                </View>

                <View style={styles.referralBox}>
                    <Ionicons name="gift-outline" size={28} color="#28a745" />
                    <Text style={styles.referralTextHeader}>Үнэгүй Premium Эрх Авах Боломж!</Text>
                    <Text style={styles.referralText}>
                        **5 хүн урьсан тохиолдолд 1 сарын Premium эрх** үнэгүй ашиглах боломжтой. (Дээд тал нь 6 сар хүртэлх эрх авах боломжтой).
                    </Text>
                    <TouchableOpacity style={styles.referralButton} onPress={() => navigation.navigate('ReferralScreen')}>
                        <Text style={styles.referralButtonText}>Найзаа Урих</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>

            <CustomAlertModal
                isVisible={isSuccessModalVisible}
                title="Мэдэгдэл"
                message={successMessage}
                onConfirm={handleSuccessConfirm}
                onCancel={handleSuccessConfirm}
                confirmText="Ойлголоо"
                cancelText=""
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        backgroundColor: '#f4f7f6',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#343a40',
    },
    section: {
        marginBottom: 25,
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingBottom: 5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        marginBottom: 8,
        paddingHorizontal: 15,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
    },
    featureIcon: {
        marginRight: 10,
    },
    featureText: {
        fontSize: 15,
        color: '#343a40',
        flex: 1,
    },
    newBadge: {
        backgroundColor: '#dc3545',
        color: 'white',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        fontWeight: 'bold',
    },
    planCard: {
        backgroundColor: '#ffffff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 2,
        borderColor: '#e9ecef',
        alignItems: 'center',
    },
    recommendedCard: {
        borderColor: '#007bff',
        backgroundColor: '#e6f7ff',
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -12,
        right: -10,
        backgroundColor: '#007bff',
        paddingVertical: 4,
        paddingHorizontal: 10,
        borderRadius: 15,
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 10,
    },
    durationText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 5,
    },
    priceText: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#007bff',
    },
    discountText: {
        fontSize: 14,
        color: '#dc3545',
        marginTop: 5,
        fontWeight: 'bold',
    },
    descriptionText: {
        fontSize: 14,
        color: '#6c757d',
        marginTop: 5,
    },
    referralBox: {
        backgroundColor: '#d4edda',
        padding: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#c3e6cb',
        alignItems: 'center',
        marginTop: 10,
    },
    referralTextHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#155724',
        marginVertical: 10,
    },
    referralText: {
        textAlign: 'center',
        fontSize: 14,
        color: '#155724',
        marginBottom: 15,
    },
    referralButton: {
        backgroundColor: '#28a745',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    referralButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    testSection: {
        marginTop: 20,
        alignItems: 'center',
    },
    testButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 8,
        minWidth: 200,
        alignItems: 'center',
    },
    testButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default PremiumScreen;
