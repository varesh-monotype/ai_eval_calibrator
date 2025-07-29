import { useState, useEffect, useCallback } from 'react';

// Global cache for loaded images
const imageCache = new Map();

export const useImageLoader = (src, options = {}) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [loaded, setLoaded] = useState(false);

    const loadImage = useCallback(() => {
        if (!src) {
            setLoading(false);
            setError(true);
            return;
        }

        // Check cache first
        if (imageCache.has(src)) {
            const cachedResult = imageCache.get(src);
            setLoading(false);
            setLoaded(cachedResult.loaded);
            setError(cachedResult.error);
            return;
        }

        const img = new Image();

        // Set timeout for loading
        const timeout = setTimeout(() => {
            if (!img.complete) {
                setLoading(false);
                setError(true);
                imageCache.set(src, { loaded: false, error: true });
            }
        }, options.timeout || 3000);

        img.onload = () => {
            clearTimeout(timeout);
            setLoading(false);
            setLoaded(true);
            setError(false);
            imageCache.set(src, { loaded: true, error: false });
        };

        img.onerror = () => {
            clearTimeout(timeout);
            setLoading(false);
            setLoaded(false);
            setError(true);
            imageCache.set(src, { loaded: false, error: true });
        };

        img.src = src;
        img.crossOrigin = 'anonymous';

        return () => {
            clearTimeout(timeout);
        };
    }, [src, options.timeout]);

    useEffect(() => {
        const cleanup = loadImage();
        return cleanup;
    }, [loadImage]);

    return { loading, error, loaded };
}; 