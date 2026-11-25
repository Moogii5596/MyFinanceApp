import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const slides = [
    {
        key: 'slide1',
        title: 'Санхүүгийн Эрх Чөлөөнд Хүрэх Эхлэл',
        text: 'Мөнгөө хянах, ирээдүйдээ хөрөнгө оруулах анхны алхмыг хийгээрэй.',
        icon: 'wallet-outline',
    },
    {
        key: 'slide2',
        title: 'Бүх Гүйлгээ Нэг Доор',
        text: 'Орлого, зарлага, хадгаламжаа хялбархан бүртгэж, ямар ч гүйлгээг алдалгүй хянаарай.',
        icon: 'bar-chart-outline',
    },
    {
        key: 'slide3',
        title: 'Ухаалаг Төсөвлөлт',
        text: 'Төсөв тавьж, зарлагаа хянаснаар санхүүгийн зорилгодоо хүрэх боломжоо нэмэгдүүлээрэй.',
        icon: 'rocket-outline',
    },
];

const OnboardingScreen = ({ onComplete }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef(null);

    const finishOnboarding = async () => {
        try {
            await AsyncStorage.setItem('hasSeenOnboarding', 'true');
            onComplete();
        } catch (error) {
            console.error('Error saving onboarding state:', error);
            onComplete();
        }
    };

    const renderItem = ({ item }) => (
        <View style={[styles.slide, { width, backgroundColor: '#FFFFFF' }]}>
            <View style={styles.iconContainer}>
                <Ionicons name={item.icon} size={80} color="#007AFF" />
            </View>
            <Text style={[styles.title, { color: '#000000' }]}>{item.title}</Text>
            <Text style={[styles.description, { color: '#666666' }]}>{item.text}</Text>
        </View>
    );



    return (
        <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
            <FlatList
                ref={flatListRef}
                data={slides}
                renderItem={renderItem}
                keyExtractor={(item) => item.key}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                    const newIndex = Math.floor(e.nativeEvent.contentOffset.x / width);
                    setCurrentIndex(newIndex);
                }}
            />

            <View style={styles.footer}>
                <View style={styles.indicatorContainer}>
                    {slides.map((_, index) => (
                        <View 
                            key={index} 
                            style={[
                                styles.dot, 
                                { 
                                    backgroundColor: index === currentIndex ? '#007AFF' : '#666666',
                                    opacity: index === currentIndex ? 1 : 0.4 
                                }
                            ]}
                        />
                    ))}
                </View>

                {currentIndex < slides.length - 1 ? (
                    <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
                        <Text style={[styles.skipText, { color: '#666666' }]}>Алгасах</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity 
                        style={[styles.finishButton, { backgroundColor: '#007AFF' }]} 
                        onPress={finishOnboarding}
                    >
                        <Text style={styles.finishText}>Эхлэх!</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    slide: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 40,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    footer: {
        paddingHorizontal: 40,
        paddingBottom: 50,
        alignItems: 'center',
    },
    indicatorContainer: {
        flexDirection: 'row',
        marginBottom: 40,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginHorizontal: 5,
    },
    skipButton: {
        paddingVertical: 15,
        paddingHorizontal: 30,
    },
    skipText: {
        fontSize: 16,
        fontWeight: '500',
    },
    finishButton: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 25,
    },
    finishText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default OnboardingScreen;