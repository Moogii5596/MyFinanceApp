import { nanoid } from 'nanoid/non-secure';
import { DB } from '../firebaseConfig';
import { doc, updateDoc, getDocs, collection, query, where, getDoc, setDoc } from 'firebase/firestore';
import { Alert } from 'react-native';

export const generateReferralCode = () => {
    return nanoid(8).toUpperCase();
};

export const saveNewUserDocument = async (uid, email, onboardingCompleted = false) => {
    const userRef = doc(DB, "users", uid);
    
    await setDoc(userRef, {
        email: email,
        createdAt: new Date(),
        isPremium: false,
        premiumUntil: null,
        referralCode: generateReferralCode(),
        referralsCount: 0,
        onboardingCompleted: onboardingCompleted,
    });
};

export const findReferrerUidByCode = async (code) => {
    const q = query(collection(DB, "users"), where("referralCode", "==", code.trim().toUpperCase()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
        return snapshot.docs[0].id;
    }
    return null;
};

export const addReferralTime = async (referrerUid) => {
    const userRef = doc(DB, "users", referrerUid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) return;

    const userData = userDoc.data();
    let currentReferrals = userData.referralsCount || 0;
    
    const newReferralsCount = currentReferrals + 1;
    const monthsToAdd = Math.floor(newReferralsCount / 5) - Math.floor(currentReferrals / 5);

    if (monthsToAdd > 0) {
        let premiumUntil = userData.premiumUntil ? userData.premiumUntil.toDate() : new Date();
        
        premiumUntil.setMonth(premiumUntil.getMonth() + monthsToAdd);
        
        const maxReferralMonths = 6;
        const maxPremiumDate = new Date();
        maxPremiumDate.setMonth(maxPremiumDate.getMonth() + maxReferralMonths);

        if (premiumUntil > maxPremiumDate) {
            premiumUntil = maxPremiumDate;
        }
        
        await updateDoc(userRef, {
            referralsCount: newReferralsCount,
            isPremium: true,
            premiumUntil: premiumUntil,
        });

        Alert.alert("Амжилттай!", `${monthsToAdd} сарын Premium эрх нэмэгдлээ.`);
    } else {
        await updateDoc(userRef, {
            referralsCount: newReferralsCount
        });
    }
};