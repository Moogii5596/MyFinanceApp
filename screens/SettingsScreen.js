import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { signOut } from 'firebase/auth';
import { AUTH } from '../firebaseConfig';


const SettingsScreen = () => {
    const navigation = useNavigation();

    const navigateToPolicy = (type) => {
        navigation.navigate('PolicyScreen', { type });
    };


    const handleLogout = () => {
        Alert.alert(
            'Гарах',
            'Та системээс гарахдаа итгэлтэй байна уу?',
            [
                { text: 'Үгүй', style: 'cancel' },
                { 
                    text: 'Тийм', 
                    onPress: async () => {
                        try {
                            await signOut(AUTH);
                        } catch (error) {
                            Alert.alert('Алдаа', 'Гарахад алдаа гарлаа: ' + error.message);
                        }
                    }
                },
            ]
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: '#FFFFFF',
        },
        header: {
            backgroundColor: '#FFFFFF',
            padding: 20,
            paddingTop: 60,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
        },
        headerTitle: {
            fontSize: 28,
            fontWeight: 'bold',
            color: '#000000',
        },
        section: {
            backgroundColor: '#FFFFFF',
            marginTop: 20,
            marginHorizontal: 16,
            borderRadius: 12,
            overflow: 'hidden',
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '600',
            color: '#666666',
            marginHorizontal: 16,
            marginTop: 20,
            marginBottom: 8,
        },
        menuItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
        },
        lastMenuItem: {
            borderBottomWidth: 0,
        },
        menuIcon: {
            marginRight: 16,
            width: 24,
        },
        menuText: {
            flex: 1,
            fontSize: 16,
            color: '#000000',
        },
        menuSubtext: {
            fontSize: 14,
            color: '#666666',
            marginTop: 2,
        },
        chevron: {
            marginLeft: 8,
        },
        logoutButton: {
            backgroundColor: '#dc3545',
            margin: 16,
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
        },
        logoutText: {
            color: '#FFFFFF',
            fontSize: 16,
            fontWeight: 'bold',
        },
    });

    const MenuItem = ({ icon, title, subtitle, onPress, showChevron = true, isLast = false }) => (
        <TouchableOpacity 
            style={[styles.menuItem, isLast && styles.lastMenuItem]} 
            onPress={onPress}
        >
            <Ionicons name={icon} size={24} color="#007AFF" style={styles.menuIcon} />
            <View style={{ flex: 1 }}>
                <Text style={styles.menuText}>{title}</Text>
                {subtitle && <Text style={styles.menuSubtext}>{subtitle}</Text>}
            </View>
            {showChevron && (
                <Ionicons name="chevron-forward" size={20} color="#666666" style={styles.chevron} />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Тохиргоо</Text>
            </View>

            <ScrollView>
                <Text style={styles.sectionTitle}>САНХҮҮ</Text>
                <View style={styles.section}>
                    <MenuItem
                        icon="wallet-outline"
                        title="Данс Удирдах"
                        subtitle="Дансуудаа нэмэх, засах, устгах"
                        onPress={() => navigation.navigate('ManageWallets')}
                    />
                    <MenuItem
                        icon="list-outline"
                        title="Категори Удирдах"
                        subtitle="Орлого, зардлын категориуд"
                        onPress={() => navigation.navigate('ManageCategories')}
                        isLast
                    />
                </View>

                <Text style={styles.sectionTitle}>БҮРТГЭЛ</Text>
                <View style={styles.section}>
                    <MenuItem
                        icon="person-outline"
                        title="Профайл"
                        subtitle="Хувийн мэдээлэл засах"
                        onPress={() => navigation.navigate('Profile')}
                    />
                    <MenuItem
                        icon="star-outline"
                        title="Premium Эрх"
                        subtitle="Нэмэлт боломжууд авах"
                        onPress={() => navigation.navigate('PremiumScreen')}
                        isLast
                    />
                </View>

                <Text style={styles.sectionTitle}>ХУУЛЬ ЭРХ ЗҮЙН МЭДЭЭЛЭЛ</Text>
                <View style={styles.section}>
                    <MenuItem
                        icon="document-text-outline"
                        title="Үйлчилгээний Нөхцөл"
                        subtitle="Апп ашиглах нөхцөл, журам"
                        onPress={() => navigateToPolicy('terms')}
                    />
                    <MenuItem
                        icon="shield-outline"
                        title="Нууцлалын Бодлого"
                        subtitle="Хувийн мэдээллийн хамгаалалт"
                        onPress={() => navigateToPolicy('privacy')}
                        isLast
                    />
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutText}>Гарах</Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
};

export default SettingsScreen;