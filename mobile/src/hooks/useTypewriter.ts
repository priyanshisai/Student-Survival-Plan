import { useState, useEffect, useRef } from 'react';

export default function useTypewriter(
    texts: string[],
    typingSpeed = 80,
    deletingSpeed = 40,
    pauseDuration = 2000,
    loop = true
) {
    const [displayed, setDisplayed] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);

    useEffect(() => {
        const current = texts[textIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (charIndex < current.length) {
                    setDisplayed(current.slice(0, charIndex + 1));
                    setCharIndex(c => c + 1);
                } else {
                    // Done typing — pause then delete
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                // Deleting
                if (charIndex > 0) {
                    setDisplayed(current.slice(0, charIndex - 1));
                    setCharIndex(c => c - 1);
                } else {
                    // Done deleting — move to next
                    setIsDeleting(false);
                    if (loop || textIndex < texts.length - 1) {
                        setTextIndex(i => (i + 1) % texts.length);
                    }
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, textIndex, texts]);

    return displayed;
}