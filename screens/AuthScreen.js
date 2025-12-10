import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { setDoc, doc, addDoc, collection, writeBatch } from 'firebase/firestore';
import CountryPicker from 'react-native-country-picker-modal';
import { AUTH, DB } from '../firebaseConfig';
import { saveNewUserDocument, findReferrerUidByCode, addReferralTime } from '../utils/referralUtils';

const AuthScreen = ({ navigation }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);


    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [isPhoneAuth, setIsPhoneAuth] = useState(false);

    const [countryCode, setCountryCode] = useState('MN');
    const [countryCallingCode, setCountryCallingCode] = useState('976');
    const [phoneNumberInput, setPhoneNumberInput] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationId, setVerificationId] = useState(null);
    const [isCountryPickerVisible, setIsCountryPickerVisible] = useState(false);
    const [referralCode, setReferralCode] = useState('');

    const onSelectCountry = (country) => {
        setCountryCode(country.cca2);
        setCountryCallingCode(country.callingCode[0]);
        setIsCountryPickerVisible(false);
    };

    const createInitialUserData = async (uid) => {
        try {
            // Хэрэглэгчийн үндсэн мэдээлэл
            await saveNewUserDocument(uid, AUTH.currentUser.email, false);
            
            // Анхны данс үүсгэх
            await addDoc(collection(DB, "wallets"), {
                userId: uid,
                name: "Бэлэн Мөнгө",
                balance: 0,
                isDefault: true,
                createdAt: new Date(),
            });
            
            // Анхны категориуд үүсгэх (batch ашиглан)
            const defaultCategories = [
                { name: 'Цалин', type: 'income', icon: 'cash-outline', color: '#4CAF50' },
                { name: 'Бусад Орлого', type: 'income', icon: 'gift-outline', color: '#8BC34A' },
                { name: 'Хүнс', type: 'expense', icon: 'restaurant-outline', color: '#FF9800' },
                { name: 'Түрээс/Байр', type: 'expense', icon: 'home-outline', color: '#F44336' },
            ];
            
            const batch = writeBatch(DB);
            defaultCategories.forEach((cat) => {
                const newCatRef = doc(collection(DB, 'categories'));
                batch.set(newCatRef, {
                    userId: uid,
                    ...cat,
                    isDefault: true,
                    isLocked: true,
                    createdAt: new Date(),
                });
            });
            
            await batch.commit();
        } catch (error) {
            console.error('Анхны өгөгдөл үүсгэхэд алдаа:', error);
            throw error;
        }
    };
    
    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert("Анхааруулга", "И-мэйл болон Нууц үгийг заавал бөглөнө үү.");
            return;
        }

        if (!isLoginMode && password !== confirmPassword) {
            Alert.alert("Алдаа", "Нууц үгнүүд таарахгүй байна.");
            return;
        }

        setIsLoading(true);
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(AUTH, email, password);
            } else {
                const userCredential = await createUserWithEmailAndPassword(AUTH, email, password);
                
                try {
                    await createInitialUserData(userCredential.user.uid);
                    
                    if (referralCode.trim()) {
                        const referrerUid = await findReferrerUidByCode(referralCode);
                        if (referrerUid) {
                            await addReferralTime(referrerUid);
                        } else {
                            Alert.alert("Мэдээлэл", "Таны оруулсан уригчийн код буруу байна.");
                        }
                    }
                    
                    Alert.alert("Амжилттай", "Бүртгэл амжилттай хийгдлээ. Анхны данс болон категориуд үүсгэгдлээ.");
                    setIsLoginMode(true);
                } catch (setupError) {
                    console.error('Анхны тохиргоо хийхэд алдаа:', setupError);
                    Alert.alert("Анхааруулга", "Бүртгэл хийгдсэн боловч анхны тохиргоо хийхэд алдаа гарлаа. Нэвтэрсний дараа тохиргоо хийнэ үү.");
                    setIsLoginMode(true);
                }
            }
        } catch (error) {
            console.error('Нэвтрэх/Бүртгүүлэх алдаа:', error);
            let errorMessage = "Үйлдэл амжилтгүй боллоо. Сүлжээний холболтоо шалгана уу.";
            
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'И-мэйл хаяг буруу байна.';
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = 'И-мэйл эсвэл нууц үг буруу байна.';
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'Энэ и-мэйл хаяг аль хэдийн бүртгэгдсэн.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'Нууц үг дор хаяж 6 тэмдэгтээс бүрдсэн байх ёстой.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Сүлжээний холболт алдагдсан. Интернэт холболтоо шалгана уу.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу.';
            }
            
            Alert.alert("Алдаа", errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert("Анхааруулга", "Нууц үг сэргээх и-мэйл хаягийг оруулна уу.");
            return;
        }

        setIsResetting(true);
        try {
            await sendPasswordResetEmail(AUTH, email.trim());
            
            Alert.alert(
                "Амжилттай", 
                `"${email}" хаяг руу нууц үг сэргээх холбоосыг илгээлээ. И-мэйлээ шалгана уу.`
            );
            
        } catch (error) {
            console.error("Password reset error: ", error);
            let errorMessage = "Нууц үг сэргээхэд алдаа гарлаа. Сүлжээний холболтоо шалгана уу.";
            
            if (error.code === 'auth/user-not-found') {
                errorMessage = "Уг и-мэйлээр бүртгэлтэй хэрэглэгч олдсонгүй.";
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = "И-мэйл хаяг буруу форматтай байна.";
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = "Сүлжээний холболт алдагдсан. Интернэт холболтоо шалгана уу.";
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = "Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу.";
            }
            
            Alert.alert("Алдаа", errorMessage);
        } finally {
            setIsResetting(false);
        }
    };

    const handlePhoneSignIn = async () => {
        const fullPhoneNumber = `+${countryCallingCode}${phoneNumberInput}`;

        try {
            if (!phoneNumberInput || phoneNumberInput.length < 8) { 
                Alert.alert('Алдаа', 'Утасны дугаарыг зөв оруулна уу.');
                return;
            }
            setIsLoading(true);

            const phoneProvider = new PhoneAuthProvider(AUTH);
            
            const verificationId = await phoneProvider.verifyPhoneNumber(
                fullPhoneNumber,
                null 
            );
            
            setVerificationId(verificationId);
            Alert.alert('Амжилттай', 'Баталгаажуулах кодыг таны дугаар руу илгээлээ.');
            
        } catch (error) {
            console.error("Phone sign-in error:", error);
            let errorMessage = 'Код илгээж чадсангүй. Утасны дугаараа шалгана уу.';
            
            if (error.code === 'auth/invalid-phone-number') {
                errorMessage = 'Утасны дугаар буруу байна.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Сүлжээний холболт алдагдсан. Интернэт холболтоо шалгана уу.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMessage = 'Хэт олон оролдлого хийлээ. Хэдэн минутын дараа дахин оролдоно уу.';
            }
            
            Alert.alert('Утасны Нэвтрэх Алдаа', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        try {
            if (!verificationId || !verificationCode) {
                Alert.alert('Алдаа', 'Код оруулна уу.');
                return;
            }
            setIsLoading(true);
            const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
            await signInWithCredential(AUTH, credential);

            setPhoneNumberInput('');
            setVerificationCode('');
            setVerificationId(null);
            setIsPhoneAuth(false);

        } catch (error) {
            console.error('Баталгаажуулах алдаа:', error);
            let errorMessage = 'Код буруу байна. Дахин оролдоно уу.';
            
            if (error.code === 'auth/invalid-verification-code') {
                errorMessage = 'Баталгаажуулах код буруу байна.';
            } else if (error.code === 'auth/code-expired') {
                errorMessage = 'Кодын хүчин төгссөн. Шинэ код авна уу.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Сүлжээний холболт алдагдсан.';
            }
            
            Alert.alert('Баталгаажуулах Алдаа', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    if (isForgotPassword) {
        return (
            <View style={styles.container}>
                <View style={styles.scrollContent}>
                    <Text style={styles.title}>Нууц Үг Сэргээх</Text>
                    <Text style={styles.subtitle}>И-мэйл хаягаа оруулна уу</Text>

                    <View style={styles.card}>
                        <TextInput
                            style={styles.input}
                            placeholder="И-мэйл хаяг"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            style={styles.button} 
                            onPress={handlePasswordReset}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Сэргээх Холбоос Илгээх</Text>
                            )}
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={() => setIsForgotPassword(false)} 
                            style={styles.toggleButton}
                        >
                            <Text style={styles.toggleText}>Буцах</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
    
    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Ionicons 
                    name="wallet-outline" 
                    size={80} 
                    color="#3b82f6" 
                    style={styles.logo}
                />
                <Text style={styles.title}>{isLoginMode ? "Нэвтрэх" : "Бүртгүүлэх"}</Text>
                <Text style={styles.subtitle}>Санхүүгээ хянах хялбар шийдэл</Text>

                <View style={styles.card}>
                    {!isPhoneAuth && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="И-мэйл хаяг"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                value={email}
                                onChangeText={setEmail}
                            />
                            
                            <View style={styles.passwordContainer}>
                                <TextInput
                                    style={styles.passwordInput}
                                    placeholder="Нууц үг (6+ тэмдэгт)"
                                    secureTextEntry={!isPasswordVisible}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity 
                                    style={styles.visibilityToggle}
                                    onPress={() => setIsPasswordVisible(prev => !prev)}
                                >
                                    <Ionicons 
                                        name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                                        size={24} 
                                        color="#6c757d" 
                                    />
                                </TouchableOpacity>
                            </View>

                            {!isLoginMode && (
                                <>
                                    <View style={styles.passwordContainer}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            placeholder="Нууц үг давтах"
                                            secureTextEntry={!isPasswordVisible}
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                        />
                                        <TouchableOpacity 
                                            style={styles.visibilityToggle}
                                            onPress={() => setIsPasswordVisible(prev => !prev)}
                                        >
                                            <Ionicons 
                                                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                                                size={24} 
                                                color="#6c757d" 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Уригчийн код (заавал биш)"
                                        value={referralCode}
                                        onChangeText={setReferralCode}
                                        autoCapitalize="characters"
                                        maxLength={8}
                                    />
                                </>
                            )}
                            
                            <TouchableOpacity 
                                style={styles.button} 
                                onPress={handleAuth}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>
                                        {isLoginMode ? "Нэвтрэх" : "Бүртгүүлэх"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            {isLoginMode && (
                                <TouchableOpacity 
                                    style={styles.forgotPasswordButton} 
                                    onPress={() => navigation.navigate('PasswordReset')}
                                    disabled={isLoading}
                                >
                                    <Text style={styles.forgotPasswordText}>Нууц үг мартсан уу?</Text>
                                </TouchableOpacity>
                            )}
                            
                            <TouchableOpacity 
                                onPress={() => setIsLoginMode(prev => !prev)}
                                style={styles.toggleButton}
                            >
                                <Text style={styles.toggleText}>
                                    {isLoginMode ? 
                                        "Шинэ хэрэглэгч үү? Бүртгүүлэх" : 
                                        "Аль хэдийн бүртгүүлсэн үү? Нэвтрэх"}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                    
                    {isPhoneAuth && (
                        <View style={{ width: '100%', alignItems: 'center' }}>
                            <Text style={styles.phoneHeader}>Утасны Дугаараар Нэвтрэх</Text>
                            
                            {!verificationId ? (
                                <>
                                    <View style={styles.phoneInputContainer}>
                                        <TouchableOpacity 
                                            style={styles.countryPickerButton}
                                            onPress={() => setIsCountryPickerVisible(true)}
                                        >
                                            <CountryPicker
                                                withFlag
                                                withCallingCode
                                                countryCode={countryCode}
                                                onSelect={onSelectCountry}
                                                visible={isCountryPickerVisible}
                                                onClose={() => setIsCountryPickerVisible(false)}
                                                withFilter={true}
                                                filterPlaceholder="Улсын нэрээр хайх"
                                                theme={{
                                                    onBackgroundTextColor: '#343a40',
                                                    fontSize: 16
                                                }}
                                            />
                                            <Text style={styles.countryCodeText}>
                                                +{countryCallingCode}
                                            </Text>
                                            <Ionicons name="caret-down" size={12} color="#6c757d" style={{marginLeft: 5}} />
                                        </TouchableOpacity>

                                        <TextInput
                                            style={styles.phoneNumberInput}
                                            placeholder="Утасны дугаар"
                                            value={phoneNumberInput}
                                            onChangeText={setPhoneNumberInput}
                                            keyboardType="phone-pad"
                                            maxLength={10}
                                        />
                                    </View>

                                    <TouchableOpacity 
                                        style={[styles.button, {backgroundColor: '#28a745'}]} 
                                        onPress={handlePhoneSignIn}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.buttonText}>Код Илгээх</Text>
                                    </TouchableOpacity>
                                </>
                            ) : (
                                <>
                                    <Text style={styles.verificationText}>
                                        Кодыг **+{countryCallingCode} {phoneNumberInput}** дугаар руу илгээсэн.
                                    </Text>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Баталгаажуулах код"
                                        value={verificationCode}
                                        onChangeText={setVerificationCode}
                                        keyboardType="number-pad"
                                    />
                                    <TouchableOpacity 
                                        style={styles.button} 
                                        onPress={handleVerifyCode}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.buttonText}>Нэвтрэх</Text>
                                        )}
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => setVerificationId(null)} style={{marginTop: 10}}>
                                        <Text style={styles.linkText}>Дугаарыг засах / Буцах</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.switchAuthType}
                        onPress={() => {
                            setIsPhoneAuth(prev => !prev);
                            setIsLoginMode(true); 
                        }}
                    >
                        <Text style={styles.switchText}>
                            {isPhoneAuth ? "И-мэйл/Нууц Үгээр Нэвтрэх" : "Утасны Дугаараар Нэвтрэх"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    logo: {
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#6c757d',
        marginBottom: 30,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 25,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ced4da',
        padding: 12,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        width: '100%',
    },
    button: {
        backgroundColor: '#3b82f6',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
        width: '100%',
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    toggleButton: {
        marginTop: 20,
        alignItems: 'center',
    },
    toggleText: {
        color: '#3b82f6',
        fontSize: 14,
    },

    linkText: {
        color: '#3b82f6',
        fontSize: 14,
        marginTop: 10,
    },
    phoneHeader: {
        fontWeight: 'bold', 
        color: '#343a40', 
        marginBottom: 15,
        fontSize: 16,
    },
    switchAuthType: {
        marginTop: 25,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f2f5',
        alignItems: 'center',
    },
    switchText: {
        color: '#6c757d',
        fontSize: 14,
        fontWeight: '600',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        width: '100%',
        height: 50,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    countryPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 5,
        borderRightWidth: 1,
        borderRightColor: '#ced4da',
        height: '100%',
    },
    countryCodeText: {
        fontSize: 16,
        marginLeft: 5,
        marginRight: 5,
        fontWeight: 'bold',
        color: '#343a40',
    },
    phoneNumberInput: {
        flex: 1,
        paddingHorizontal: 10,
        fontSize: 16,
        height: '100%',
    },
    verificationText: {
        fontSize: 14,
        color: '#6c757d',
        marginBottom: 15,
        textAlign: 'center',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        marginBottom: 15,
        width: '100%',
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    visibilityToggle: {
        padding: 10,
        marginRight: 5,
    },
    forgotPasswordButton: {
        alignSelf: 'flex-end',
        marginTop: 10,
        marginBottom: 10,
        padding: 5,
    },
    forgotPasswordText: {
        color: '#007bff',
        fontSize: 14,
    }
});

export default AuthScreen;
