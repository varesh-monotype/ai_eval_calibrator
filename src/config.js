// Configuration file for all URLs and API endpoints
const config = {
    // API Endpoints
    API: {
        // Font recommendations API
        FONT_RECOMMENDATIONS: '/fontrecommendations/typesense/stream',

        // Font feedback API (for saving and retrieving feedback)
        FONT_FEEDBACK: '/api/feedback',
    },

    // Development settings
    DEV: {
        // Base URL for development
        BASE_URL: process.env.REACT_APP_BASE_URL || 'http://172.22.1.139:3000',

        // API timeout in milliseconds
        TIMEOUT: 30000,

        // Retry attempts for failed requests
        MAX_RETRIES: 3
    },

    // Production settings
    PROD: {
        // Base URL for production
        BASE_URL: process.env.REACT_APP_BASE_URL,

        // API timeout in milliseconds
        TIMEOUT: 30000,

        // Retry attempts for failed requests
        MAX_RETRIES: 3
    },

    // Feature flags
    FEATURES: {
        // Enable/disable streaming responses
        STREAMING_ENABLED: true,

        // Enable/disable score saving
        SCORE_SAVING_ENABLED: true,

        // Enable/disable analytics
        ANALYTICS_ENABLED: true,

        // Enable/disable localStorage fallback
        LOCALSTORAGE_FALLBACK: true
    },

    // UI Configuration
    UI: {
        // Number of recommendations to show
        MAX_RECOMMENDATIONS: 10,

        // Progress update interval (ms)
        PROGRESS_UPDATE_INTERVAL: 1000,

        // Animation duration (ms)
        ANIMATION_DURATION: 300
    }
};

// Helper function to get current environment config
const getConfig = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return {
        ...config,
        current: isDevelopment ? config.DEV : config.PROD
    };
};

// Helper function to get API URL
const getApiUrl = (endpoint) => {
    const currentConfig = getConfig();
    return `${currentConfig.current.BASE_URL}${endpoint}`;
};

// Helper function to get full URL for external services
const getExternalUrl = (url) => {
    return url.startsWith('http') ? url : getApiUrl(url);
};

export default config;
export { getConfig, getApiUrl, getExternalUrl }; 