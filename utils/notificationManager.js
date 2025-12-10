import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return false;
  }
  
  return true;
}

export const scheduleBudgetNotification = async (categoryName, spentAmount, limitAmount, percentage) => {
  try {
    await registerForPushNotificationsAsync();

    const title = percentage >= 100 ? 
      '🚨 Төсвийн хязгаар хэтэрлээ!' : 
      '⚠️ Төсвийн анхааруулга';
      
    const body = `${categoryName} категорид ${percentage}% (${spentAmount}₮/${limitAmount}₮) зарцуулсан байна.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { screen: 'BudgetingScreen', category: categoryName },
      },
      trigger: { seconds: 1 },
    });
    
    console.log('Budget notification scheduled:', { categoryName, percentage });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

export const scheduleReminderNotification = async (title, body, delaySeconds = 86400) => {
  try {
    await registerForPushNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'reminder' },
      },
      trigger: { seconds: delaySeconds },
    });
  } catch (error) {
    console.error('Error scheduling reminder:', error);
  }
};

export const clearAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};