import { StyleSheet } from 'react-native';

export const successNotificationStyles = StyleSheet.create({
    successOverlay: { 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        backgroundColor: 'rgba(0,0,0,0.5)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    successContainer: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 40, 
        alignItems: 'center', 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 2 }, 
        shadowOpacity: 0.25, 
        shadowRadius: 4, 
        elevation: 5 
    },
    successTitle: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: '#28a745', 
        marginTop: 15, 
        marginBottom: 10 
    },
    successMessage: { 
        fontSize: 16, 
        color: '#6c757d', 
        textAlign: 'center' 
    },
});