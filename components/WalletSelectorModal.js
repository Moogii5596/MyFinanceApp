import React from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const WalletSelectorModal = ({ isVisible, onClose, wallets, onSelectWallet }) => {
    const navigation = useNavigation();

    const navigateToAddWallet = () => {
        onClose();
        navigation.navigate('Тохиргоо', { screen: 'AddWallet' });
    };

    const renderWalletItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.itemContainer} 
            onPress={() => {
                onSelectWallet(item);
                onClose();
            }}
        >
            <View style={styles.walletInfo}>
                <Text style={styles.walletName}>{item.name}</Text>
                <Text style={styles.walletBalance}>₮{item.balance.toLocaleString()}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666666" />
        </TouchableOpacity>
    );

    return (
        <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <Text style={styles.headerText}>Данс Сонгох</Text>
                    
                    <TouchableOpacity style={styles.addButton} onPress={navigateToAddWallet}>
                        <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                        <Text style={styles.addText}>Шинэ Данс Нэмэх</Text>
                    </TouchableOpacity>

                    <FlatList
                        data={wallets}
                        renderItem={renderWalletItem}
                        keyExtractor={item => item.id}
                        style={styles.list}
                        showsVerticalScrollIndicator={false}
                    />

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Буцах</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalView: {
        width: '90%',
        maxHeight: '70%',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        elevation: 5,
    },
    headerText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        color: '#000000',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F0F8FF',
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#007AFF',
    },
    addText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#007AFF',
        fontWeight: '600',
    },
    list: {
        maxHeight: 300,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    walletInfo: {
        flex: 1,
    },
    walletName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    walletBalance: {
        fontSize: 14,
        color: '#666666',
    },
    closeButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 15,
    },
    closeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WalletSelectorModal;