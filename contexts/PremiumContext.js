import React, { createContext, useContext, useState, useEffect } from 'react';
import { DB, AUTH } from '../firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';

const PremiumContext = createContext();

export const usePremium = () => useContext(PremiumContext);

export const PremiumProvider = ({ children }) => {
    const [isPremium, setIsPremium] = useState(false);
    const [premiumUntil, setPremiumUntil] = useState(null);
    const [isLoadingPremium, setIsLoadingPremium] = useState(true);

    useEffect(() => {
        const user = AUTH.currentUser;
        if (!user) {
            setIsLoadingPremium(false);
            return;
        }

        const userRef = doc(DB, "users", user.uid);
        
        const unsubscribe = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                const isPremiumUser = data.isPremium || false;
                const expirationDate = data.premiumUntil ? data.premiumUntil.toDate() : null;

                let isActive = isPremiumUser;

                if (expirationDate) {
                    if (expirationDate <= new Date()) {
                        isActive = false;
                    }
                } else if (isPremiumUser) {
                    isActive = true; 
                }

                setIsPremium(isActive);
                setPremiumUntil(expirationDate);

            } else {
                setIsPremium(false);
                setPremiumUntil(null);
            }
            setIsLoadingPremium(false);
        }, (error) => {
            console.error("Error fetching premium status: ", error);
            setIsLoadingPremium(false);
        });

        return () => unsubscribe();
    }, [AUTH.currentUser]);

    return (
        <PremiumContext.Provider value={{ isPremium, premiumUntil, isLoadingPremium }}>
            {children}
        </PremiumContext.Provider>
    );
};