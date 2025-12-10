import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


const CustomAlertModal = ({ 
    isVisible, 
    title, 
    message, 
    onConfirm, 
    onCancel, 
    confirmText = 'Ойлголоо', 
    cancelText = 'Үгүй',
    showCancelButton = false
}) => {
    return (
        <Modal animationType="fade" transparent={true} visible={isVisible} onRequestClose={onCancel}>
            <TouchableOpacity 
                style={styles.centeredView}
                activeOpacity={1}
                onPress={onCancel}
            >
                <TouchableOpacity 
                    style={[styles.modalView, { backgroundColor: '#FFFFFF' }]}
                    activeOpacity={1}
                    onPress={() => {}}
                >
                    
                    <Ionicons name="alert-circle-outline" size={30} color="#FF3B30" style={styles.icon} />
                    <Text style={[styles.modalTitle, { color: '#000000' }]}>{title}</Text>
                    
                    <Text style={[styles.modalText, { color: '#666666' }]}>{message}</Text>

                    <View style={[styles.buttonContainer, !showCancelButton && styles.singleButtonContainer]}>
                        {showCancelButton && (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { borderColor: '#E0E0E0' }]}
                                onPress={onCancel}
                            >
                                <Text style={[styles.textStyle, { color: '#000000' }]}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={[
                                styles.button, 
                                styles.confirmButton, 
                                !showCancelButton && { flex: 1, marginHorizontal: 0 },
                                { backgroundColor: '#007AFF' }
                            ]}
                            onPress={onConfirm}
                        >
                            <Text style={styles.textStyleConfirm}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalView: {
        margin: 20,
        borderRadius: 15,
        padding: 25,
        alignItems: 'center',
        elevation: 5,
        width: '80%',
    },
    icon: {
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalText: {
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    singleButtonContainer: {
        justifyContent: 'center',
    },
    button: {
        borderRadius: 8,
        padding: 10,
        elevation: 2,
        flex: 1,
        marginHorizontal: 5,
        borderWidth: 1,
        minWidth: 100,
    },
    cancelButton: {
        backgroundColor: 'transparent',
    },
    confirmButton: {
        
    },
    textStyle: {
        textAlign: 'center',
        fontWeight: '600',
    },
    textStyleConfirm: {
        color: 'white',
        textAlign: 'center',
        fontWeight: '600',
    }
});

export default CustomAlertModal;