import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { Text, View, ActivityIndicator } from 'react-native';
import { AUTH, DB } from './firebaseConfig';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProvider } from './contexts/UserContext';
import { PremiumProvider } from './contexts/PremiumContext';

import { registerForPushNotificationsAsync } from './utils/notificationManager';
import { checkAndProcessRecurringTransactions } from './utils/recurringProcessor';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Үндсэн дэлгэцүүдийг импортлох
import AuthScreen from './screens/AuthScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import FinanceScreen from './screens/FinanceScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import TransactionHistoryScreen from './screens/TransactionHistoryScreen';
import BudgetScreen from './screens/BudgetScreen';
import AddMonthlyBudgetScreen from './screens/AddMonthlyBudgetScreen';
import ReportScreen from './screens/ReportScreen';
import SettingsScreen from './screens/SettingsScreen';
import ManageCategoriesScreen from './screens/ManageCategoriesScreen';
import ManageWalletsScreen from './screens/ManageWalletsScreen';
import PremiumScreen from './screens/PremiumScreen';
import TransferScreen from './screens/TransferScreen';
import ManageAccountScreen from './screens/ManageAccountScreen';
import FamilyGroupScreen from './screens/FamilyGroupScreen';
import BudgetingScreen from './screens/BudgetingScreen';
import ReferralScreen from './screens/ReferralScreen';
import ProfileScreen from './screens/ProfileScreen';
import PasswordResetScreen from './screens/PasswordResetScreen';
import AddRecurringTransactionScreen from './screens/AddRecurringTransactionScreen';
import AddWalletScreen from './screens/AddWalletScreen';
import AddCategoryScreen from './screens/AddCategoryScreen';
import EditTransactionScreen from './screens/EditTransactionScreen';
import PolicyScreen from './screens/PolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ====================================================================
// A. Finance Stack (Санхүүгийн хэсэгт дэлгэцүүдийн давхраа)
// ====================================================================
function FinanceStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="FinancialOverview" 
                component={FinanceScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="AddTransaction" 
                component={AddTransactionScreen} 
                options={{ title: 'Гүйлгээ Нэмэх', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="TransactionHistory" 
                component={TransactionHistoryScreen} 
                options={{ title: 'Гүйлгээний Түүх', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="ManageWalletsFromAdd" 
                component={ManageWalletsScreen} 
                options={{ title: 'Данс Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="ManageCategoriesFromAdd" 
                component={ManageCategoriesScreen} 
                options={{ title: 'Категори Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="PremiumScreen" 
                component={PremiumScreen} 
                options={{ title: 'Premium Эрх', presentation: 'modal' }} 
            />
            <Stack.Screen 
                name="TransferScreen" 
                component={TransferScreen} 
                options={{ title: 'Данс Шилжүүлэг', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="AddRecurringTransaction" 
                component={AddRecurringTransactionScreen} 
                options={{ title: 'Тогтмол Гүйлгээ Нэмэх', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="EditTransaction" 
                component={EditTransactionScreen} 
                options={{ title: 'Гүйлгээ Засах', headerBackTitle: 'Буцах' }} 
            />
        </Stack.Navigator>
    );
}

// ====================================================================
// B. Budget Stack (Төсвийн хэсэгт дэлгэцүүдийн давхраа)
// ====================================================================
function BudgetStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="BudgetOverview" 
                component={BudgetScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="AddBudgetScreen" 
                component={AddMonthlyBudgetScreen} 
                options={{ title: 'Сарын Төсөв Үүсгэх' }} 
            />
            <Stack.Screen 
                name="BudgetingScreen" 
                component={BudgetingScreen} 
                options={{ title: 'Төсөвлөлт', headerBackTitle: 'Буцах' }} 
            />
        </Stack.Navigator>
    );
}

// ====================================================================
// C. Settings Stack (Тохиргоогийн хэсэгт дэлгэцүүдийн давхраа)
// ====================================================================
function SettingsStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="SettingsOverview" 
                component={SettingsScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="ManageWallets" 
                component={ManageWalletsScreen} 
                options={{ title: 'Данс Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="ManageCategories" 
                component={ManageCategoriesScreen} 
                options={{ title: 'Категори Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="ManageAccount" 
                component={ManageAccountScreen} 
                options={{ title: 'Бүртгэл Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="PremiumScreen" 
                component={PremiumScreen} 
                options={{ title: 'Premium Эрх', presentation: 'modal' }} 
            />
            <Stack.Screen 
                name="FamilyGroup" 
                component={FamilyGroupScreen} 
                options={{ title: 'Гэр Бүлийн Санхүү', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="ReferralScreen" 
                component={ReferralScreen} 
                options={{ title: 'Найзаа Урих', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="Profile" 
                component={ProfileScreen} 
                options={{ title: 'Профайл Удирдах', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="PasswordReset" 
                component={PasswordResetScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="AddWallet" 
                component={AddWalletScreen} 
                options={{ title: 'Данс Нэмэх', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="AddCategory" 
                component={AddCategoryScreen} 
                options={{ title: 'Категори Нэмэх', headerBackTitle: 'Буцах' }} 
            />
            <Stack.Screen 
                name="PolicyScreen" 
                component={PolicyScreen} 
                options={({ route }) => ({ 
                    title: route.params?.type === 'terms' ? 'Үйлчилгээний Нөхцөл' : 'Нууцлалын Бодлого',
                    headerBackTitle: 'Буцах'
                })} 
            />
        </Stack.Navigator>
    );
}

// ====================================================================
// D. Үндсэн Tabs (Нэвтэрсэн үед харагдах 4 хэсэг)
// ====================================================================
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Санхүү') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Төсөв') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Тайлан') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Тохиргоо') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#666666',
      })}
    >
      <Tab.Screen name="Санхүү" component={FinanceStack} options={{ headerShown: false }} />
      <Tab.Screen name="Төсөв" component={BudgetStack} options={{ headerShown: false }} />
      <Tab.Screen name="Тайлан" component={ReportScreen} options={{ headerShown: false }} />
      <Tab.Screen name="Тохиргоо" component={SettingsStack} options={{ headerShown: false }} />
    </Tab.Navigator>
  );
}

// ====================================================================
// E. Auth Stack (Нэвтрээгүй үед харагдах хэсэг)
// ====================================================================
function AuthStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Нэвтрэх" 
                component={AuthScreen} 
                options={{ headerShown: false }} 
            />
            <Stack.Screen 
                name="PasswordReset" 
                component={PasswordResetScreen} 
                options={{ headerShown: false }} 
            />
        </Stack.Navigator>
    )
}

// ====================================================================
// F. Үндсэн App Component
// ====================================================================
export default function App() {
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const appState = useRef(AppState.currentState);

  // Хэрэглэгчийн төлөвийг шалгах (Auto Login)
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding');
        if (value === 'true') {
          setHasSeenOnboarding(true);
        }
      } catch (error) {
        console.error('Error reading onboarding state:', error);
      }
    };
    
    checkOnboarding();
    
    const unsubscribe = onAuthStateChanged(AUTH, (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Onboarding төлөвийг шалгах
  useEffect(() => {
    if (user) {
      const userRef = doc(DB, "users", user.uid);
      const unsubscribe = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setOnboardingComplete(data.onboardingCompleted === true);
        }
      });
      return () => unsubscribe();
    }
  }, [user]);

  // Notification зөвшөөрөл авах
  useEffect(() => {
    if (user && onboardingComplete) {
      registerForPushNotificationsAsync();
    }
  }, [user, onboardingComplete]);

  // Recurring transactions шалгах
  useEffect(() => {
    if (!user || !onboardingComplete) return;

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        checkAndProcessRecurringTransactions();
      }
      appState.current = nextAppState;
    });

    // Апп анх ачаалагдах үед шалгах
    checkAndProcessRecurringTransactions();

    return () => subscription?.remove();
  }, [user, onboardingComplete]);

  if (isAuthLoading) {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={{ marginTop: 10, color: '#3b82f6' }}>Нэвтрэлтийн мэдээллийг шалгаж байна...</Text>
        </View>
    ); 
  }

  const handleOnboardingComplete = () => {
    setHasSeenOnboarding(true);
  };

  if (!hasSeenOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <UserProvider>
      <PremiumProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {user ? (
              onboardingComplete ? (
                <Stack.Screen name="AppTabs" component={AppTabs} />
              ) : (
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              )
            ) : (
              <Stack.Screen name="Auth" component={AuthStack} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </PremiumProvider>
    </UserProvider>
  );
}
