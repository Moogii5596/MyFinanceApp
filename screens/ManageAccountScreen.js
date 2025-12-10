import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, PhoneAuthProvider, linkWithCredential } from 'firebase/auth';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';

const ManageAccountScreen = () => {
    const navigation = useNavigation();
    const user = AUTH.currentUser;

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Хэрэглэгч олдсонгүй. Дахин нэвтэрнэ үү.</Text>
            </View>
        );
    }

    const [isLoading, setIsLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [fullName, setFullName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [secretQuestion, setSecretQuestion] = useState('');
    const [secretAnswer, setSecretAnswer] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [reAuthNeeded, setReAuthNeeded] = useState(false);
    const [reAuthLoading, setReAuthLoading] = useState(false);
    const [phoneVerificationId, setPhoneVerificationId] = useState(null);
    const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
    const [isPhoneLinking, setIsPhoneLinking] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const docRef = doc(DB, "users", user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setFullName(data.fullName || '');
                    setPhoneNumber(data.phoneNumber || '');
                    setSecretQuestion(data.secretQuestion || '');
                    setSecretAnswer(data.secretAnswer || '');
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsDataLoading(false);
            }
        };
        fetchUserData();
    }, [user.uid]);

    const handleLinkPhoneNumber = async () => {
        if (!phoneNumber || phoneNumber.length < 8) {
            Alert.alert("Анхааруулга", "Утасны дугаарыг зөв оруулна уу.");
            return;
        }
        
        setIsPhoneLinking(true);
        try {
            const phoneProvider = new PhoneAuthProvider(AUTH);
            const fullPhoneNumber = `+976${phoneNumber}`;
            
            const verificationId = await phoneProvider.verifyPhoneNumber(
                fullPhoneNumber,
                null
            );
            
            setPhoneVerificationId(verificationId);
            Alert.alert('Амжилттай', `Баталгаажуулах кодыг ${phoneNumber} дугаар руу илгээлээ.`);
        } catch (error) {
            Alert.alert('Алдаа', 'Утасны дугаараар баталгаажуулж чадсангүй.');
        } finally {
            setIsPhoneLinking(false);
        }
    };
    
    const handleConfirmPhoneLink = async () => {
        if (!phoneVerificationId || !phoneVerificationCode) return;

        setIsLoading(true);
        try {
            const credential = PhoneAuthProvider.credential(phoneVerificationId, phoneVerificationCode);
            await linkWithCredential(user, credential);
            
            const userRef = doc(DB, "users", user.uid);
            await setDoc(userRef, { phoneNumber: phoneNumber }, { merge: true });
            
            Alert.alert("Амжилттай", "Утасны дугаарыг таны бүртгэлтэй амжилттай холболоо.");
            setPhoneVerificationId(null); 
            setPhoneVerificationCode('');
        } catch (error) {
            Alert.alert('Алдаа', 'Баталгаажуулах код буруу байна, эсвэл энэ дугаар аль хэдийн бүртгэгдсэн.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        setIsLoading(true);
        try {
            const userRef = doc(DB, "users", user.uid);
            await setDoc(userRef, {
                email: user.email,
                fullName,
                phoneNumber,
                secretQuestion,
                secretAnswer,
            }, { merge: true });
            Alert.alert("Амжилттай", "Хувийн мэдээлэл амжилттай хадгалагдлаа.");
        } catch (error) {
            console.error("Error updating profile:", error);
            Alert.alert("Алдаа", "Хувийн мэдээллийг хадгалж чадсангүй.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReauthenticate = async () => {
        if (!currentPassword) {
            Alert.alert("Анхааруулга", "Та одоогийн нууц үгээ заавал оруулна уу.");
            return;
        }
        setReAuthLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            
            Alert.alert("Амжилттай", "Бүртгэл амжилттай баталгаажлаа. Та одоо мэдээллээ солино уу.");
            setReAuthNeeded(false);
            setCurrentPassword('');
        } catch (error) {
            Alert.alert("Алдаа", "Одоогийн нууц үг буруу байна. Дахин оролдоно уу.");
            console.error(error);
        } finally {
            setReAuthLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === user.email) {
            Alert.alert("Анхааруулга", "Шинэ и-мэйл хаягаа зөв оруулна уу.");
            return;
        }

        if (reAuthNeeded) {
            Alert.alert("Анхааруулга", "Үйлдэл хийхийн өмнө та бүртгэлээ баталгаажуулах шаардлагатай.");
            return;
        }

        setIsLoading(true);
        try {
            await updateEmail(user, newEmail);
            Alert.alert("Амжилттай", "И-мэйл хаяг амжилттай солигдлоо. Та дахин нэвтэрнэ үү.");
            await AUTH.signOut();
        } catch (error) {
            let errorMessage = "И-мэйл солих үйлдэл амжилтгүй боллоо.";
            if (error.code === 'auth/requires-recent-login') {
                Alert.alert("Анхааруулга", "Аюулгүй байдлын үүднээс, та одоогийн нууц үгээ оруулж баталгаажуулна уу.");
                setReAuthNeeded(true);
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "Буруу форматтай и-мэйл хаяг байна.";
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = "Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн байна.";
            }
            Alert.alert("Алдаа", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async () => {
        if (!oldPassword) {
            Alert.alert("Анхааруулга", "Нууц үг солихын тулд та Одоогийн Нууц Үгээ заавал оруулна уу.");
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            Alert.alert("Анхааруулга", "Шинэ нууц үг дор хаяж 6 тэмдэгттэй байна.");
            return;
        }
        if (newPassword !== confirmNewPassword) {
            Alert.alert("Алдаа", "Шинэ нууц үгнүүд таарахгүй байна.");
            return;
        }

        setIsLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, oldPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            Alert.alert("Амжилттай", "Нууц үг амжилттай солигдлоо.");
            setNewPassword('');
            setConfirmNewPassword('');
            setOldPassword('');
        } catch (error) {
            let errorMessage = "Нууц үг солих үйлдэл амжилтгүй боллоо.";
            if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "Одоогийн нууц үг буруу байна. Дахин шалгана уу.";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "Шинэ нууц үг хэтэрхий сул байна (6+ тэмдэгт шаардлагатай).";
            }
            Alert.alert("Алдаа", errorMessage);
            console.error("Password update error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isDataLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={{ marginTop: 10, color: '#3b82f6' }}>Мэдээллийг татаж байна...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="settings-outline" size={30} color="#3b82f6" />
                <Text style={styles.headerTitle}>Бүртгэлийн Мэдээлэл</Text>
            </View>

            <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Одоогийн И-мэйл:</Text>
                <Text style={styles.infoValue}>{user?.email || 'Нэвтрээгүй'}</Text>
            </View>

            {reAuthNeeded && (
                <View style={styles.reAuthCard}>
                    <Text style={styles.reAuthTitle}>Үйлдэл Хийхийн Өмнө Баталгаажуулна уу</Text>
                    <Text style={styles.reAuthSubTitle}>Та аюулгүй байдлын үүднээс одоогийн нууц үгээ оруулна уу.</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Одоогийн нууц үг"
                        secureTextEntry
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                    />

                    <TouchableOpacity 
                        style={[styles.button, styles.reAuthButton]}
                        onPress={handleReauthenticate}
                        disabled={reAuthLoading}
                    >
                        {reAuthLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Баталгаажуулах</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Хувийн Мэдээлэл</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Овог нэр (Жишээ: Д.Дорж)"
                    value={fullName}
                    onChangeText={setFullName}
                />
                
                <Text style={styles.sectionTitleSmall}>Утасны Дугаар (Нэвтрэхэд ашиглаж болно)</Text>
                
                {!phoneVerificationId ? (
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Утасны дугаар (Жишээ: 9911xxxx)"
                            keyboardType="phone-pad"
                            maxLength={8}
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.linkButton]}
                            onPress={handleLinkPhoneNumber}
                            disabled={isPhoneLinking || !phoneNumber || phoneNumber.length < 8}
                        >
                            {isPhoneLinking ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Утасны Дугаарыг Холбох (Код Илгээх)</Text>
                            )}
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <Text style={styles.verificationText}>
                            Баталгаажуулах кодыг **+976 {phoneNumber}** дугаар руу илгээсэн.
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Баталгаажуулах код"
                            keyboardType="number-pad"
                            value={phoneVerificationCode}
                            onChangeText={setPhoneVerificationCode}
                        />
                        <TouchableOpacity 
                            style={[styles.button, styles.confirmButton]}
                            onPress={handleConfirmPhoneLink}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Дугаарыг Холбох</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setPhoneVerificationId(null)} style={{marginTop: 10}}>
                            <Text style={styles.toggleText}>Дугаарыг засах / Буцах</Text>
                        </TouchableOpacity>
                    </>
                )}
                
                <Text style={styles.sectionTitleSmall}>Нууц Асуулт (Нууц үг сэргээхэд ашиглана)</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Нууц асуулт (Жишээ: Миний төрсөн хот)"
                    value={secretQuestion}
                    onChangeText={setSecretQuestion}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Нууц хариулт"
                    secureTextEntry
                    value={secretAnswer}
                    onChangeText={setSecretAnswer}
                />
                
                <TouchableOpacity 
                    style={styles.button}
                    onPress={handleUpdateProfile}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Нэмэлт Мэдээлэл Хадгалах</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>И-мэйл Хаяг Солих</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Шинэ и-мэйл хаяг"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={newEmail}
                    onChangeText={setNewEmail}
                />
                <TouchableOpacity 
                    style={styles.button}
                    onPress={handleUpdateEmail}
                    disabled={isLoading || reAuthNeeded}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>И-мэйл Солих</Text>
                    )}
                </TouchableOpacity>
            </View>

            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Нууц Үг Солих</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Одоогийн нууц үг"
                    secureTextEntry
                    value={oldPassword}
                    onChangeText={setOldPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Шинэ нууц үг (6+ тэмдэгт)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Шинэ нууц үг давтах"
                    secureTextEntry
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                />
                <TouchableOpacity 
                    style={styles.button}
                    onPress={handleUpdatePassword}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Нууц Үг Солих</Text>
                    )}
                </TouchableOpacity>
            </View>
            
            <View style={{height: 50}} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        marginLeft: 10,
    },
    infoBox: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftWidth: 5,
        borderLeftColor: '#3b82f6',
    },
    infoLabel: {
        fontSize: 14,
        color: '#6c757d',
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#343a40',
    },
    sectionCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        paddingBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 5,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    reAuthCard: {
        backgroundColor: '#fff3cd',
        borderColor: '#ffeeba',
        borderWidth: 1,
        borderRadius: 10,
        padding: 20,
        marginBottom: 20,
    },
    reAuthTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#856404',
        marginBottom: 5,
    },
    reAuthSubTitle: {
        fontSize: 14,
        color: '#856404',
        marginBottom: 15,
    },
    reAuthButton: {
        backgroundColor: '#fd7e14',
    },
    errorText: {
        fontSize: 16,
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
    },
    sectionTitleSmall: {
        fontSize: 14,
        fontWeight: '600',
        color: '#343a40',
        marginBottom: 10,
        marginTop: 10,
    },
    linkButton: {
        backgroundColor: '#17a2b8',
        marginBottom: 15,
    },
    confirmButton: {
        backgroundColor: '#28a745',
    },
    verificationText: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 15,
        textAlign: 'center',
    },
    toggleText: {
        color: '#3b82f6',
        fontSize: 14,
        textAlign: 'center'
    }
});

export default ManageAccountScreen;
