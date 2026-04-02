import LottieView from 'lottie-react-native';
import { View, Text } from 'react-native';
import { useState } from 'react';
import { useEffect } from 'react';

type Props = {
    uri: string;
    size?: number;
    autoPlay?: boolean;
    loop?: boolean;
    fallback?: string;
};

export function AnimatedEmoji({ uri, size = 32, autoPlay = true, loop = true, fallback = '😊' }: Props) {
    const [error, setError] = useState(false);

    useEffect(() => {
        fetch(uri)
            .then(r => console.log('✅ Lottie URL reachable:', uri, r.status))
            .catch(e => console.log('❌ Lottie URL FAILED:', uri, e.message));
    }, [uri]);

    if (error) {
        return (
            <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: size * 0.7 }}>{fallback}</Text>
            </View>
        );
    }

    return (
        <View style={{ width: size, height: size }}>
            <LottieView
                source={{ uri }}
                autoPlay={autoPlay}
                loop={loop}
                cacheComposition={true}
                onAnimationFailure={(e) => {
                    console.log('Lottie error:', e);
                    setError(true);
                }}
                style={{ width: size, height: size }}
            />
        </View>
    );
}