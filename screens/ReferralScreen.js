import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { AUTH, DB } from '../firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';


const ReferralScreen = () => {
    const navigation = useNavigation();
    const [userReferralCode, setUserReferralCode] = useState('');
    const [referralsCount, setReferralsCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    useEffect(() => {
        fetchUserReferralData();
    }, []);

    const fetchUserReferralData = async () => {
        try {
            const userRef = doc(DB, "users", AUTH.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserReferralCode(userData.referralCode || '');
                setReferralsCount(userData.referralsCount || 0);
            }
        } catch (error) {
            console.error('Error fetching referral data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateNewReferralCode = async () => {
        try {
            const { generateReferralCode } = await import('../utils/referralUtils');
            const newCode = generateReferralCode();
            const userRef = doc(DB, "users", AUTH.currentUser.uid);
            
            await updateDoc(userRef, { referralCode: newCode });
            setUserReferralCode(newCode);
            setSuccessMessage('Урилгын код үүслээ!');
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 1500);
        } catch (error) {
            console.error('Error generating referral code:', error);
            Alert.alert('Алдаа', 'Код үүсгэж чадсангүй.');
        }
    };

    const copyToClipboard = async () => {
        try {
            await Clipboard.setStringAsync(userReferralCode);
            setSuccessMessage('Урих код хуулагдлаа!');
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 1500);
        } catch (error) {
            Alert.alert('Урих код', `Таны урих код: ${userReferralCode}\n\nЭнэ кодыг гараар хуулна уу.`);
        }
    };

    const shareReferralCode = async () => {
        try {
            const message = `Миний санхүүгийн апп-д нэгдээрэй! Урих код: ${userReferralCode}`;
            await Share.share({
                message: message,
                title: 'Санхүүгийн Апп-д Урилга'
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    };

    const getRemainingReferrals = () => {
        const nextReward = Math.ceil(referralsCount / 5) * 5;
        return nextReward - referralsCount;
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text>Мэдээлэл татаж байна...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="gift" size={60} color="#28a745" />
                <Text style={styles.headerTitle}>Найзаа Урих</Text>
                <Text style={styles.headerSubtitle}>5 хүн урьж 1 сарын Premium эрх аваарай!</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{referralsCount}</Text>
                    <Text style={styles.statLabel}>Урьсан тоо</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{Math.floor(referralsCount / 5)}</Text>
                    <Text style={styles.statLabel}>Авсан сар</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{getRemainingReferrals()}</Text>
                    <Text style={styles.statLabel}>Дараагийн шагнал хүртэл</Text>
                </View>
            </View>

            <View style={styles.codeContainer}>
                <Text style={styles.codeLabel}>Таны урих код:</Text>
                {userReferralCode ? (
                    <View style={styles.codeBox}>
                        <Text style={styles.codeText}>{userReferralCode}</Text>
                        <TouchableOpacity style={styles.copyButton} onPress={copyToClipboard}>
                            <Ionicons name="copy-outline" size={20} color="#007bff" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity style={styles.generateButton} onPress={generateNewReferralCode}>
                        <Ionicons name="add-circle-outline" size={24} color="white" />
                        <Text style={styles.generateButtonText}>Урилгын Код Үүсгэх</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={styles.shareButton} onPress={shareReferralCode}>
                    <Ionicons name="share-outline" size={24} color="white" />
                    <Text style={styles.shareButtonText}>Хуваалцах</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.infoContainer}>
                <Text style={styles.infoTitle}>Урамшууллын дүрэм:</Text>
                <Text style={styles.infoText}>• 5 хүн урьж 1 сарын Premium эрх авна</Text>
                <Text style={styles.infoText}>• Дээд тал нь 6 сар (30 хүн урих)</Text>
                <Text style={styles.infoText}>• Урьсан хүн амжилттай бүртгүүлсний дараа тооцогдоно</Text>
            </View>
            
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
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f7f6',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 30,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 10,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 5,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
    },
    statBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        alignItems: 'center',
        flex: 1,
        marginHorizontal: 5,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#007bff',
    },
    statLabel: {
        fontSize: 12,
        color: '#6c757d',
        textAlign: 'center',
        marginTop: 5,
    },
    codeContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        marginBottom: 20,
        elevation: 2,
    },
    codeLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
    },
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#f8f9fa',
        padding: 15,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#007bff',
        borderStyle: 'dashed',
    },
    codeText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#007bff',
        letterSpacing: 2,
    },
    copyButton: {
        padding: 5,
    },
    actionsContainer: {
        marginBottom: 30,
    },
    shareButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        elevation: 3,
    },
    shareButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    infoContainer: {
        backgroundColor: '#e9ecef',
        padding: 20,
        borderRadius: 10,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
    },
    infoText: {
        fontSize: 14,
        color: '#495057',
        marginBottom: 5,
    },
    generateButton: {
        backgroundColor: '#28a745',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        marginTop: 10,
    },
    generateButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    successOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    successContainer: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    successTitle: { fontSize: 24, fontWeight: 'bold', color: '#28a745', marginTop: 15, marginBottom: 10 },
    successMessage: { fontSize: 16, color: '#6c757d', textAlign: 'center' },
});

export default ReferralScreen;