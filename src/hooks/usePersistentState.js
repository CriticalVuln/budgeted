import { useState, useEffect } from 'react';

const usePersistentState = (key, initialValue) => {
    // Initialize state from localStorage immediately to prevent hydration mismatch/flashing
    const [state, setState] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return initialValue;
        }
    });

    const [isLoaded, setIsLoaded] = useState(true);

    // Save on Change
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }, [key, state]);

    return [state, setState, isLoaded];
};

export default usePersistentState;
