import axios from 'axios';
import config, { getApiUrl, getExternalUrl } from '../config';

// Use config for API endpoint
const API_ENDPOINT = config.API.FONT_RECOMMENDATIONS;

export const fetchFontRecommendations = async (query, prompt = "") => {
    try {
        console.log('Making API request with query:', query);

        const response = await axios.post(API_ENDPOINT, {
            query: query,
            intermediate_query_enabled: true,
            prompt: prompt,
            with_conversion_ranking: "true",
            faiss_optimized: true
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000
        });

        console.log('API Response received:', response.data);
        console.log('Response status:', response.data.status);
        console.log('Recommendations count:', response.data.results?.recommendations?.length || 0);

        return response.data;
    } catch (error) {
        console.error('Error fetching font recommendations:', error);
        console.error('Error details:', error.response?.data);
        throw error;
    }
};

// Handle streaming Server-Sent Events (SSE) response
export const fetchFontRecommendationsStream = async (query, prompt = "", onProgress) => {
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: query,
                intermediate_query_enabled: true,
                prompt: prompt,
                with_conversion_ranking: "true",
                faiss_optimized: true
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        return new Promise((resolve, reject) => {
            const processStream = async () => {
                try {
                    while (true) {
                        const { done, value } = await reader.read();

                        if (done) {
                            break;
                        }

                        buffer += decoder.decode(value, { stream: true });

                        // Process complete lines from the stream
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer

                        for (const line of lines) {
                            if (line.trim() && line.startsWith('data: ')) {
                                try {
                                    // Extract JSON from "data: {...}" format
                                    const jsonStr = line.substring(6); // Remove "data: " prefix
                                    const data = JSON.parse(jsonStr);

                                    console.log('Stream data received:', data);

                                    // Call progress callback if provided
                                    if (onProgress) {
                                        onProgress(data);
                                    }

                                    // Check if status is complete
                                    if (data.status === 'complete') {
                                        console.log('Stream completed with data:', data);
                                        resolve(data);
                                        return;
                                    }
                                } catch (parseError) {
                                    console.warn('Failed to parse JSON from stream:', line);
                                }
                            }
                        }
                    }

                    // If we reach here, try to parse the final buffer
                    if (buffer.trim()) {
                        try {
                            const lines = buffer.split('\n');
                            for (const line of lines) {
                                if (line.trim() && line.startsWith('data: ')) {
                                    const jsonStr = line.substring(6);
                                    const finalData = JSON.parse(jsonStr);
                                    if (finalData.status === 'complete') {
                                        resolve(finalData);
                                        return;
                                    }
                                }
                            }
                        } catch (parseError) {
                            reject(new Error('Failed to parse final response'));
                        }
                    }

                    reject(new Error('No complete response received'));
                } catch (error) {
                    reject(error);
                }
            };

            processStream();
        });

    } catch (error) {
        console.error('Error fetching font recommendations stream:', error);
        throw error;
    }
};

// Save font score to JSON file
export const saveFontScore = async (prompt, fontData, score, reason = '') => {
    try {
        // Find the prompt ID from the prompts array
        const prompts = await import('../data/prompts.js');
        const promptID = prompts.prompts.indexOf(prompt) + 1; // +1 to make it 1-based

        // Get user info from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user.username || '';

        const feedbackData = {
            promptID: promptID,
            promptName: prompt, // Add prompt name to each feedback entry
            md5: fontData.md5 || fontData.family_name,
            familyName: fontData.family_name,
            score: score === 'good' ? 'Good Match' :
                score === 'average' ? 'Average Match' :
                    score === 'bad' ? 'Bad Match' : score,
            reason: reason,
            username: username, // Add username to feedback
            email: user.email || '', // Keep email for backward compatibility
            timestamp: new Date().toISOString()
        };

        console.log('Saving font score to JSON:', feedbackData);

        // Save to server JSON file
        const response = await axios.post('http://localhost:3001/api/feedback', {
            promptName: prompt,
            feedbackData: feedbackData
        }, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000
        });

        console.log('Score saved successfully to JSON file');
        return { success: true, data: feedbackData, isNew: response.data.isNew };

    } catch (error) {
        console.error('Error saving font score:', error);
        throw error;
    }
};

// Get all saved scores (for analytics)
export const getFontScores = async () => {
    try {
        // Get user info from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user.username;

        if (!username) {
            console.log('No user found, returning empty feedback');
            return [];
        }

        // Get from server JSON file with username
        const response = await axios.get(`http://localhost:3001/api/feedback?username=${encodeURIComponent(username)}`, {
            timeout: 30000
        });

        // Flatten all feedback from all prompts into a single array
        const allFeedback = [];
        Object.entries(response.data).forEach(([promptName, promptFeedback]) => {
            // Add prompt name to each feedback entry
            const feedbackWithPrompt = promptFeedback.map(feedback => ({
                ...feedback,
                promptName: promptName
            }));
            allFeedback.push(...feedbackWithPrompt);
        });

        return allFeedback;
    } catch (error) {
        console.error('Error reading feedback from JSON:', error);
        return [];
    }
};

// Reset feedback data for a specific prompt
export const resetPromptFeedback = async (promptName) => {
    try {
        console.log('Resetting feedback data for prompt:', promptName);

        // Get user info from localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const username = user.username;

        if (!username) {
            throw new Error('User not found');
        }

        const response = await axios.delete(`http://localhost:3001/api/feedback/${encodeURIComponent(promptName)}?username=${encodeURIComponent(username)}`, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000
        });

        console.log('Feedback data reset successfully for prompt:', promptName, 'for user:', username);
        return { success: true, message: response.data.message };

    } catch (error) {
        console.error('Error resetting feedback data:', error);
        throw error;
    }
};

// Generate unique session ID
const generateSessionId = () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Get client IP (mock implementation)
const getClientIP = async () => {
    if (!config.FEATURES.ANALYTICS_ENABLED) {
        return 'analytics_disabled';
    }

    try {
        const response = await fetch(getExternalUrl(config.API.IP_SERVICE));
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'unknown';
    }
}; 