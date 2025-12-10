import { Alert } from 'react-native';

/**
 * Firebase алдааг хэрэглэгчид ойлгомжтой мэдэгдэл болгон хөрвүүлэх
 */
export const handleFirebaseError = (error, customMessage = null) => {
    console.error('Firebase Error:', error);
    
    let userMessage = customMessage || 'Алдаа гарлаа. Дахин оролдоно уу.';
    
    // Firebase-ийн алдааны кодуудыг шалгах
    if (error.code) {
        switch (error.code) {
            case 'permission-denied':
                userMessage = 'Энэ үйлдлийг хийх эрх танд байхгүй байна.';
                break;
            case 'unavailable':
                userMessage = 'Сүлжээний холболт алдагдсан. Интернет холболтоо шалгана уу.';
                break;
            case 'deadline-exceeded':
                userMessage = 'Хүсэлт хэт удаан байна. Дахин оролдоно уу.';
                break;
            case 'resource-exhausted':
                userMessage = 'Өдрийн хязгаар хэтэрсэн. Маргааш дахин оролдоно уу.';
                break;
            case 'unauthenticated':
                userMessage = 'Нэвтрэх шаардлагатай. Дахин нэвтэрнэ үү.';
                break;
            case 'not-found':
                userMessage = 'Хайсан мэдээлэл олдсонгүй.';
                break;
            default:
                if (error.message) {
                    userMessage = `Алдаа: ${error.message}`;
                }
        }
    }
    
    Alert.alert('Алдаа', userMessage);
    return userMessage;
};

/**
 * Сүлжээний алдааг шалгах
 */
export const isNetworkError = (error) => {
    return error.code === 'unavailable' || 
           error.message?.includes('network') || 
           error.message?.includes('offline');
};

/**
 * Ерөнхий try-catch wrapper функц
 */
export const safeExecute = async (asyncFunction, errorMessage = null) => {
    try {
        return await asyncFunction();
    } catch (error) {
        handleFirebaseError(error, errorMessage);
        throw error; // Re-throw хийж calling function-д шийдвэрлэх боломж өгөх
    }
};

/**
 * Validation алдааг харуулах
 */
export const showValidationError = (message) => {
    Alert.alert('Мэдээлэл дутуу', message);
};

/**
 * Амжилттай мэдэгдэл харуулах
 */
export const showSuccess = (message) => {
    Alert.alert('Амжилттай', message);
};