import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { AUTH, DB } from '../firebaseConfig';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const [userProfile, setUserProfile] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = AUTH.onAuthStateChanged(user => {
            if (user) {
                const userRef = doc(DB, "users", user.uid);
                
                const unsubscribeFirestore = onSnapshot(userRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setUserProfile(data);
                        setIsPremium(data.isPremium || false);
                    } else {
                        setUserProfile(null);
                        setIsPremium(false);
                    }
                    setIsLoading(false);
                });
                
                return () => unsubscribeFirestore();

            } else {
                setUserProfile(null);
                setIsPremium(false);
                setIsLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const value = { userProfile, isPremium, isLoading };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => useContext(UserContext);
