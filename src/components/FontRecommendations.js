import React, { useState, useEffect } from 'react';
import { ThumbsUp, Minus, ThumbsDown, Award, Tag, Building, Check, CheckCircle } from 'lucide-react';
import { saveFontScore, getFontScores } from '../services/api';
import { useImageLoader } from '../hooks/useImageLoader';

// Helper function to generate font preview URL
const generateFontPreviewUrl = (md5) => {
    const baseUrl = 'https://render.myfonts.net/fonts/font_rend.php';
    const params = new URLSearchParams({
        id: md5,
        rt: 'The quick brown fox jumps over the lazy dog',
        rs: '30',
        fg: '000000',
        t: 'pc',
        sc: '5',
        bg: 'FFFFFF',
        x: '0',
        y: '0',
        al: 'left'
    });
    return `${baseUrl}?${params.toString()}`;
};

// Preload images for better performance
const preloadImages = (recommendations) => {
    recommendations.forEach(font => {
        const img = new Image();
        img.src = generateFontPreviewUrl(font.md5);
        // Set a timeout to prevent hanging
        setTimeout(() => {
            if (img.complete === false) {
                img.src = '';
            }
        }, 3000);
    });
};

// Font Preview Component
const FontPreview = ({ font }) => {
    const imageUrl = generateFontPreviewUrl(font.md5);
    const { loading, error, loaded } = useImageLoader(imageUrl, { timeout: 3000 });

    return (
        <div className="mb-3 sm:mb-4">
            <div className="relative bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                {loading && (
                    <div className="flex items-center justify-center py-6">
                        <div className="animate-pulse bg-gray-200 rounded-md w-full h-16"></div>
                    </div>
                )}
                {!loading && !error && loaded && (
                    <div className="h-20 sm:h-24 flex items-center justify-center">
                        <img
                            src={imageUrl}
                            alt={`Preview of ${font.family_name}`}
                            className="w-full h-full object-contain rounded-md shadow-sm"
                            crossOrigin="anonymous"
                        />
                    </div>
                )}
                {!loading && error && (
                    <div className="h-20 sm:h-24 flex items-center justify-center text-center text-gray-500 text-xs sm:text-sm">
                        Font preview unavailable
                    </div>
                )}
            </div>
        </div>
    );
};

const FontRecommendations = ({ recommendations, prompt, onScoreSaved, refreshTrigger = 0 }) => {
    const [scoredFonts, setScoredFonts] = useState(new Set());
    const [savingStates, setSavingStates] = useState({});
    const [fontScores, setFontScores] = useState({}); // Track current scores for each font
    const [showReasonInput, setShowReasonInput] = useState({}); // Track which fonts need reason input
    const [reasonText, setReasonText] = useState({}); // Store reason text for each font

    // Load existing feedback for current prompt
    useEffect(() => {
        const loadExistingFeedback = async () => {
            if (!prompt) return;

            try {
                const allFeedback = await getFontScores();
                const currentPromptFeedback = allFeedback.filter(feedback => feedback.promptName === prompt);

                // Update state with existing feedback
                const newScoredFonts = new Set();
                const newFontScores = {};

                currentPromptFeedback.forEach(feedback => {
                    newScoredFonts.add(feedback.md5);
                    // Convert score back to internal format
                    const score = feedback.score === 'Good Match' ? 'good' :
                        feedback.score === 'Average Match' ? 'average' :
                            feedback.score === 'Bad Match' ? 'bad' : feedback.score;
                    newFontScores[feedback.md5] = score;
                });

                setScoredFonts(newScoredFonts);
                setFontScores(newFontScores);
                // Clear reason input states when data is refreshed
                setShowReasonInput({});
                setReasonText({});
            } catch (error) {
                console.error('Error loading existing feedback:', error);
            }
        };

        loadExistingFeedback();
    }, [prompt, refreshTrigger]); // Re-run when prompt changes or refresh is triggered



    const handleScore = async (font, score) => {
        setSavingStates(prev => ({ ...prev, [font.md5]: true }));

        try {
            const result = await saveFontScore(prompt, font, score);
            setScoredFonts(prev => new Set([...prev, font.md5]));
            setFontScores(prev => ({ ...prev, [font.md5]: score }));

            // Always update progress count for real-time updates
            onScoreSaved(font, score);
        } catch (error) {
            console.error('Error saving score:', error);
        } finally {
            setSavingStates(prev => ({ ...prev, [font.md5]: false }));
        }
    };

    const handleScoreWithReason = (font, score) => {
        if (score === 'average' || score === 'bad') {
            // Show reason input for average/bad scores
            setShowReasonInput(prev => ({ ...prev, [font.md5]: true }));
            setFontScores(prev => ({ ...prev, [font.md5]: score }));
        } else {
            // Hide reason input and direct save for good scores
            setShowReasonInput(prev => ({ ...prev, [font.md5]: false }));
            setReasonText(prev => ({ ...prev, [font.md5]: '' }));
            setFontScores(prev => ({ ...prev, [font.md5]: score }));
            // Call handleScore directly for good scores - it will handle onScoreSaved
            handleScore(font, score);
        }
    };

    const handleSubmitReason = async (font, score) => {
        const reason = reasonText[font.md5] || '';
        setSavingStates(prev => ({ ...prev, [font.md5]: true }));

        try {
            const result = await saveFontScore(prompt, font, score, reason);
            setScoredFonts(prev => new Set([...prev, font.md5]));
            setShowReasonInput(prev => ({ ...prev, [font.md5]: false }));
            setReasonText(prev => ({ ...prev, [font.md5]: '' }));

            // Always update progress count for real-time updates
            onScoreSaved(font, score);
        } catch (error) {
            console.error('Error saving score with reason:', error);
        } finally {
            setSavingStates(prev => ({ ...prev, [font.md5]: false }));
        }
    };

    const getScoreButton = (font, score, icon, colorClass, isSelected) => (
        <button
            onClick={() => handleScoreWithReason(font, score)}
            disabled={savingStates[font.md5]}
            className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                ? `${colorClass} ring-2 ring-offset-2 ring-white`
                : `hover:scale-105 ${colorClass} opacity-70 hover:opacity-100`
                }`}
        >
            {savingStates[font.md5] ? (
                <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            ) : (
                <>
                    {isSelected ? <Check className="w-4 h-4 sm:w-5 sm:h-5" /> : icon}
                </>
            )}
        </button>
    );

    const getScoreLabel = (score) => {
        switch (score) {
            case 'good': return 'Good Match';
            case 'average': return 'Average Match';
            case 'bad': return 'Bad Match';
            default: return '';
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4 sm:mb-6 flex-shrink-0">
                <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 sm:mb-2">Font Recommendations</h2>
                    <p className="text-gray-600 text-xs sm:text-sm">
                        {recommendations.length} fonts found for "{prompt}"
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="badge-simple badge-success text-xs sm:text-sm">
                        {recommendations.length} results
                    </div>
                </div>
            </div>

            {/* Font Cards */}
            <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                    {recommendations.map((font, index) => {
                        const currentScore = fontScores[font.md5];
                        const isScored = scoredFonts.has(font.md5);
                        const needsReason = showReasonInput[font.md5];

                        return (
                            <div
                                key={font.md5}
                                className={`card-simple p-4 sm:p-6 transition-all duration-300 relative flex flex-col h-full ${isScored ? 'ring-2 ring-green-400/50 bg-green-50/30' : ''
                                    }`}
                            >
                                {/* Completion badge */}
                                {isScored && (
                                    <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-1 sm:space-x-2 bg-green-100 text-green-800 px-2 sm:px-3 py-1 rounded-full text-xs font-medium">
                                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Completed</span>
                                        <span className="sm:hidden">Done</span>
                                    </div>
                                )}

                                {/* Header with ranking */}
                                <div className="flex items-start justify-between mb-3 sm:mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1 sm:mb-2">
                                            {index < 3 && (
                                                <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex-shrink-0">
                                                    <Award className="text-white sm:w-3 sm:h-3" size={10} />
                                                </div>
                                            )}
                                            <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate">
                                                {font.family_name}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2 truncate">{font.style_name}</p>
                                        <div className="flex items-center space-x-1 sm:space-x-2 text-xs text-gray-500">
                                            <Building className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{font.foundry_name}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Font Preview */}
                                <FontPreview font={font} />



                                {/* Scoring buttons */}
                                <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-gray-200 mt-auto">
                                    {getScoreButton(
                                        font,
                                        'good',
                                        <ThumbsUp className="w-5 h-5" />,
                                        'bg-green-500 hover:bg-green-600 text-white',
                                        currentScore === 'good'
                                    )}

                                    {getScoreButton(
                                        font,
                                        'average',
                                        <Minus className="w-5 h-5" />,
                                        'bg-yellow-500 hover:bg-yellow-600 text-white',
                                        currentScore === 'average'
                                    )}

                                    {getScoreButton(
                                        font,
                                        'bad',
                                        <ThumbsDown className="w-5 h-5" />,
                                        'bg-red-500 hover:bg-red-600 text-white',
                                        currentScore === 'bad'
                                    )}
                                </div>

                                {/* Reason input for average/bad scores */}
                                {needsReason && (
                                    <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                                        <div className="space-y-3">
                                            <label className="block text-xs sm:text-sm font-medium text-gray-700">
                                                Please provide a reason for your {currentScore === 'average' ? 'average' : 'bad'} rating:
                                            </label>
                                            <textarea
                                                value={reasonText[font.md5] || ''}
                                                onChange={(e) => setReasonText(prev => ({
                                                    ...prev,
                                                    [font.md5]: e.target.value
                                                }))}
                                                placeholder="Explain why this font doesn't match well..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-sm"
                                                rows={3}
                                            />
                                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                                <button
                                                    onClick={() => handleSubmitReason(font, currentScore)}
                                                    disabled={savingStates[font.md5] || !reasonText[font.md5]?.trim()}
                                                    className="px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm font-medium"
                                                >
                                                    {savingStates[font.md5] ? 'Submitting...' : 'Submit'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setShowReasonInput(prev => ({ ...prev, [font.md5]: false }));
                                                        setReasonText(prev => ({ ...prev, [font.md5]: '' }));
                                                        setFontScores(prev => ({ ...prev, [font.md5]: undefined }));
                                                    }}
                                                    className="px-3 sm:px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-xs sm:text-sm font-medium"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-4 sm:pt-6 border-t border-gray-200 flex-shrink-0">
                <p className="text-gray-500 text-xs sm:text-sm">
                    Rate each font based on how well it matches the prompt
                </p>
            </div>
        </div>
    );
};

export default FontRecommendations; 