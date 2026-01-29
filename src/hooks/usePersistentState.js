import { useState, useEffect } from 'react';

const usePersistentState = (key, initialValue) => {
    const [state, setState] = useState(initialValue);
    const [isLoaded, setIsLoaded] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadData = async () => {
            try {
                // Try fetching from server first
                const response = await fetch('/api/data');
                // Note: In dev with "vite" proxying to "node server.js", this should work.

                if (response.ok) {
                    const allData = await response.json();
                    if (allData[key] !== undefined) {
                        setState(allData[key]);
                    } else {
                        // Fallback to localStorage if key not on server but exists locally
                        const item = window.localStorage.getItem(key);
                        if (item) setState(JSON.parse(item));
                    }
                } else {
                    throw new Error('Server response not ok');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                // Fallback to localStorage for robustness
                const item = window.localStorage.getItem(key);
                if (item) setState(JSON.parse(item));
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, [key]);

    // Save on Change
    useEffect(() => {
        if (!isLoaded) return;

        const saveData = async () => {
            try {
                // Send ONLY the specific key that changed. 
                // The server will merge this into the existing data object.
                await fetch('/api/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ [key]: state })
                });

                // Still keep localStorage as a backup
                window.localStorage.setItem(key, JSON.stringify(state));
            } catch (error) {
                console.error('Error saving data:', error);
            }
        };

        const timeout = setTimeout(saveData, 500); // Debounce saves
        return () => clearTimeout(timeout);
    }, [key, state, isLoaded]);

    return [state, setState, isLoaded];
};

export default usePersistentState;
