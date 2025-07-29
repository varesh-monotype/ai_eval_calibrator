import React, { useState, useEffect } from 'react';
import { getFontScores } from '../services/api';

const ScoreSummary = ({ scores, totalResults = 0, currentPrompt = '', refreshTrigger = 0 }) => {
    const [allScores, setAllScores] = useState([]);
    const [renderKey, setRenderKey] = useState(0);
    const [lastPrompt, setLastPrompt] = useState('');

    // Load existing feedback on mount and when refresh is triggered
    useEffect(() => {
        const loadExistingFeedback = async () => {
            try {
                const existingScores = await getFontScores();
                setAllScores(existingScores);
            } catch (error) {
                console.error('Error loading existing feedback:', error);
            }
        };

        loadExistingFeedback();
    }, [currentPrompt, refreshTrigger]); // Re-load when prompt changes or refresh is triggered

    // Reset lastPrompt when currentPrompt changes to ensure proper state management
    useEffect(() => {
        if (currentPrompt !== lastPrompt) {
            setLastPrompt(currentPrompt);
        }
    }, [currentPrompt, lastPrompt]);

    // Force re-render when scores change
    useEffect(() => {
        setRenderKey(prev => prev + 1);
    }, [scores]);

    // Helper function to normalize score format
    const normalizeScore = (score) => {
        if (typeof score === 'string') {
            if (score === 'good' || score === 'Good Match') return 'Good Match';
            if (score === 'average' || score === 'Average Match') return 'Average Match';
            if (score === 'bad' || score === 'Bad Match') return 'Bad Match';
        }
        return score;
    };

    // Filter existing scores for current prompt only
    const currentPromptScores = currentPrompt ? allScores.filter(score => score.promptName === currentPrompt) : [];

    // Create a map of current session scores by md5 for easy lookup and updates
    const currentSessionScoresMap = new Map();
    scores.forEach(score => {
        currentSessionScoresMap.set(score.font.md5, score);
    });

    // Combine existing feedback with current session scores
    let finalScores = [];

    // Create a map of all scores by md5 for deduplication
    const allScoresMap = new Map();

    // First, add existing feedback to the map
    if (currentPrompt && currentPromptScores.length > 0) {
        currentPromptScores.forEach(score => {
            allScoresMap.set(score.md5, score);
        });
    }

    // Then, add/update with session scores (session scores take priority)
    if (scores.length > 0) {
        scores.forEach(sessionScore => {
            const normalizedScore = {
                promptID: sessionScore.font.promptID,
                promptName: currentPrompt,
                md5: sessionScore.font.md5,
                familyName: sessionScore.font.family_name,
                score: sessionScore.score,
                reason: sessionScore.reason || '',
                email: sessionScore.email || '',
                timestamp: sessionScore.timestamp
            };
            allScoresMap.set(sessionScore.font.md5, normalizedScore);
        });
    }

    // Convert map back to array
    finalScores = Array.from(allScoresMap.values());

    // If refresh trigger is active and no session scores, clear the scores (reset operation)
    if (refreshTrigger > 0 && scores.length === 0) {
        finalScores = [];
    }

    // Debug logging
    console.log('ScoreSummary render:', {
        scoresLength: scores.length,
        currentPromptScoresLength: currentPromptScores.length,
        finalScoresLength: finalScores.length,
        currentPrompt,
        refreshTrigger,
        existingScores: currentPromptScores.map(s => ({ font: s.familyName, score: s.score, md5: s.md5 })),
        sessionScores: scores.map(s => ({ font: s.font.family_name, score: s.score, md5: s.font.md5 })),
        finalScores: finalScores.map(s => ({ font: s.familyName || s.font?.family_name, score: s.score, md5: s.md5 }))
    });

    const goodScores = finalScores.filter(s => normalizeScore(s.score) === 'Good Match').length;
    const averageScores = finalScores.filter(s => normalizeScore(s.score) === 'Average Match').length;
    const badScores = finalScores.filter(s => normalizeScore(s.score) === 'Bad Match').length;
    const totalScores = finalScores.length;

    const goodPercentage = totalScores > 0 ? Math.round((goodScores / totalScores) * 100) : 0;
    const averagePercentage = totalScores > 0 ? Math.round((averageScores / totalScores) * 100) : 0;
    const badPercentage = totalScores > 0 ? Math.round((badScores / totalScores) * 100) : 0;

    return (
        <div className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
            <div className="space-y-3 sm:space-y-4">
                {/* Overall Progress */}
                <div>
                    <h3 className="font-bold text-black mb-1 sm:mb-2 text-sm sm:text-base">Overall Progress:</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{totalScores}/{totalResults} results evaluated ({totalResults > 0 ? Math.round((totalScores / totalResults) * 100) : 0}%)</p>
                </div>

                {/* Score Distribution */}
                <div>
                    <h3 className="font-bold text-black mb-2 sm:mb-3 text-sm sm:text-base">Score Distribution:</h3>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                        <span className="bg-green-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            Good: {goodPercentage}%
                        </span>
                        <span className="bg-orange-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            Average: {averagePercentage}%
                        </span>
                        <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                            Bad: {badPercentage}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScoreSummary; 