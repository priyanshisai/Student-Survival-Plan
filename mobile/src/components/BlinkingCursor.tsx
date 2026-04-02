import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';

export default function BlinkingCursor({ color = '#fff' }) {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.Text style={[styles.cursor, { opacity, color }]}>
            _
        </Animated.Text>
    );
}

const styles = StyleSheet.create({
    cursor: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});