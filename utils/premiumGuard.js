import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';


export const PremiumGuard = ({ navigation, featureName }) => {

    
    return (
        <View style={[styles.container, { backgroundColor: '#f9f9f9' }]}>
            <View style={[styles.card, { backgroundColor: '#FFFFFF' }]}>
                <Ionicons name="star" size={60} color="#FFD700" style={styles.icon} />
                <Text style={[styles.title, { color: '#000000' }]}>Premium Шаардлагатай</Text>
                <Text style={[styles.description, { color: '#666666' }]}>
                    {featureName} функц нь зөвхөн Premium хэрэглэгчдэд нээлттэй байна.
                </Text>
                <TouchableOpacity 
                    style={[styles.upgradeButton, { backgroundColor: '#007AFF' }]}
                    onPress={() => navigation.navigate('PremiumScreen')}
                >
                    <Text style={styles.upgradeText}>Premium-д Шилжих</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={[styles.backText, { color: '#666666' }]}>Буцах</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    card: {
        padding: 30,
        borderRadius: 15,
        alignItems: 'center',
        elevation: 5,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    icon: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 25,
        lineHeight: 22,
    },
    upgradeButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
        borderRadius: 10,
        marginBottom: 15,
    },
    upgradeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    backText: {
        fontSize: 14,
    },
});