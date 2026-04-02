// components/GrainBackground.tsx
import { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GrainBackground() {
    const opacity = useRef(new Animated.Value(0.08)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.13,
                    duration: 1500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.08,
                    duration: 1500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={StyleSheet.absoluteFill}>
            {/* Deep blue/purple gradient matching your Grainient colors */}
            <LinearGradient
                colors={['#303746', '#343783', '#364ba1']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />
            {/* Grain overlay */}
            <Animated.View
                style={[styles.grain, { opacity }]}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    grain: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'transparent',
        // Simulates grain with a semi-transparent noise pattern
        backgroundImage: undefined,
        opacity: 0.1,
    },
});