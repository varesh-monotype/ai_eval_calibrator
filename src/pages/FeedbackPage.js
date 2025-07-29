import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, AlertCircle, Menu, X, RotateCcw, LogOut } from 'lucide-react';
import PromptGrid from '../components/PromptGrid';
import FontRecommendations from '../components/FontRecommendations';
import LoadingSpinner from '../components/LoadingSpinner';
import ScoreSummary from '../components/ScoreSummary';
import CustomModal from '../components/CustomModal';
import { fetchFontRecommendationsStream, resetPromptFeedback } from '../services/api';
import config from '../config';
import { prompts } from '../data/prompts';

const FeedbackPage = () => {
    const [selectedPrompt, setSelectedPrompt] = useState('');
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [progress, setProgress] = useState(0);
    const [scores, setScores] = useState([]);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null
    });
    const [scoreSummaryRefreshTrigger, setScoreSummaryRefreshTrigger] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const navigate = useNavigate();

    // Check if user is logged in on component mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/');
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
        } catch (error) {
            console.error('Error parsing stored user:', error);
            navigate('/');
        }
    }, [navigate]);

    const handlePromptClick = async (prompt) => {
        setSelectedPrompt(prompt);
        setLoading(true);
        setError('');
        setProgress(0);
        setScores([]); // Clear scores when switching prompts
        setRecommendations([]); // Clear recommendations when switching prompts

        try {
            const data = await fetchFontRecommendationsStream(prompt, prompt, (progressData) => {
                if (progressData.progress) {
                    setProgress(progressData.progress);
                }
            });

            if (data.results && data.results.recommendations) {
                setRecommendations(data.results.recommendations.slice(0, config.UI.MAX_RECOMMENDATIONS));
            } else {
                setError('No recommendations found');
            }
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(err.message || 'Failed to fetch recommendations');
        } finally {
            setLoading(false);
            setProgress(0);
        }
    };

    const handleScoreSaved = (font, score) => {
        setScores(prev => {
            // Check if this font already has a score in the current session
            const existingIndex = prev.findIndex(s => s.font.md5 === font.md5);
            if (existingIndex !== -1) {
                // Update existing score
                const updated = [...prev];
                updated[existingIndex] = { font, score, timestamp: new Date() };
                console.log('App.js - Updated score:', { font: font.family_name, score, newLength: updated.length });
                return updated;
            } else {
                // Add new score
                const newScores = [...prev, { font, score, timestamp: new Date() }];
                console.log('App.js - Added new score:', { font: font.family_name, score, newLength: newScores.length });
                return newScores;
            }
        });
    };

    const toggleMobileNav = () => {
        setMobileNavOpen(!mobileNavOpen);
    };

    const closeMobileNav = () => {
        setMobileNavOpen(false);
    };

    const showModal = (type, title, message, onConfirm) => {
        setModalState({
            isOpen: true,
            type,
            title,
            message,
            onConfirm
        });
    };

    const closeModal = () => {
        setModalState({
            isOpen: false,
            type: 'info',
            title: '',
            message: '',
            onConfirm: null
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('userEmail');
        navigate('/');
    };

    const handleMobileReset = async (prompt) => {
        showModal(
            'confirm',
            'Reset Feedback Data',
            `Are you sure you want to reset all feedback data for "${prompt}"? This action cannot be undone.`,
            async () => {
                try {
                    await resetPromptFeedback(prompt);
                    showModal(
                        'success',
                        'Reset Successful',
                        `Feedback data cleared for "${prompt}". You can now add fresh feedback.`,
                        () => {
                            if (selectedPrompt === prompt) {
                                setScores([]);
                            }
                            // Trigger ScoreSummary refresh
                            setScoreSummaryRefreshTrigger(prev => prev + 1);
                            closeMobileNav();
                        }
                    );
                } catch (error) {
                    console.error('Error resetting feedback:', error);
                    showModal(
                        'warning',
                        'Reset Failed',
                        'Failed to reset feedback data. Please try again.',
                        null
                    );
                }
            }
        );
    };

    // Handle body scroll when mobile nav is open
    useEffect(() => {
        if (mobileNavOpen) {
            document.body.classList.add('nav-open');
        } else {
            document.body.classList.remove('nav-open');
        }

        return () => {
            document.body.classList.remove('nav-open');
        };
    }, [mobileNavOpen]);

    // If user is not logged in, don't render anything
    if (!currentUser) {
        return null;
    }

    return (
        <div className="h-screen bg-gray-50 overflow-hidden">
            {/* Enhanced Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
                    <div className="relative flex items-center justify-center">
                        {/* Mobile Menu Button - Absolute Position */}
                        <button
                            onClick={toggleMobileNav}
                            className="lg:hidden absolute left-0 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu className="w-6 h-6 text-gray-600" />
                        </button>

                        {/* Centered Brand Section */}
                        <div className="flex items-center space-x-4 sm:space-x-5">
                            {/* Enhanced App Icon */}
                            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-3 sm:p-4 shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <Zap className="text-white w-6 h-6 sm:w-7 sm:h-7" />
                            </div>

                            {/* Enhanced Title Section */}
                            <div className="text-center">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight tracking-tight">
                                    Expert & AI Eval Calibrator
                                </h1>
                                <p className="text-gray-600 text-sm sm:text-base mt-1 font-medium">
                                    Evaluate prompts and their results
                                </p>
                                {currentUser && (
                                    <p className="text-blue-600 text-xs mt-1 font-medium">
                                        Logged in as: {currentUser.username}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Logout Button - Absolute Position */}
                        {currentUser && (
                            <button
                                onClick={handleLogout}
                                className="absolute right-0 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-red-600"
                                aria-label="Logout"
                                title="Logout"
                            >
                                <LogOut className="w-6 h-6" />
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* Mobile Navigation Overlay */}
            {mobileNavOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={closeMobileNav}
                />
            )}

            {/* Mobile Side Navigation */}
            <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 lg:hidden ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Prompts</h2>
                    <button
                        onClick={closeMobileNav}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        aria-label="Close navigation"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>
                <div className="p-4 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3 sm:mb-4">
                        <span className="text-gray-600 text-xs sm:text-sm font-medium">
                            40 prompts available
                        </span>
                    </div>
                    <div className="flex-1 min-h-0">
                        <div className="space-y-2 h-full overflow-y-auto">
                            {prompts.map((prompt, index) => (
                                <div
                                    key={index}
                                    className={`w-full p-3 sm:p-4 rounded-xl transition-all duration-200 ${selectedPrompt === prompt
                                        ? 'bg-blue-50 border-2 border-blue-200 shadow-sm'
                                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <button
                                                onClick={() => {
                                                    handlePromptClick(prompt);
                                                    closeMobileNav();
                                                }}
                                                className="w-full text-left"
                                            >
                                                <h3 className={`font-medium text-xs sm:text-sm mb-1 ${selectedPrompt === prompt ? 'text-blue-700' : 'text-gray-900'
                                                    } truncate`}>
                                                    {prompt}
                                                </h3>
                                                <p className="text-gray-500 text-xs">
                                                    Click to analyze fonts
                                                </p>
                                            </button>
                                        </div>

                                        <div className="ml-2 sm:ml-3 flex-shrink-0 flex items-center space-x-2">
                                            {selectedPrompt === prompt && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMobileReset(prompt);
                                                }}
                                                className="p-1 rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-red-600"
                                                title="Reset feedback data for this prompt"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-none mx-auto px-4 sm:px-6 py-4 sm:py-8 h-full">
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-8 h-full" style={{ height: 'calc(100vh - 120px)' }}>
                    {/* Desktop Sidebar - Prompts */}
                    <div className="hidden lg:block lg:col-span-2 order-2 lg:order-1">
                        <div className="card-simple p-4 sm:p-6 animate-slide-in-left h-full flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
                            <div className="flex items-center space-x-3 mb-4 sm:mb-6 flex-shrink-0">
                                <div className="bg-blue-500 p-2 rounded-lg">
                                    <TrendingUp className="text-white sm:w-5 sm:h-5" size={16} />
                                </div>
                                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Prompts</h2>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <PromptGrid
                                    onPromptClick={handlePromptClick}
                                    selectedPrompt={selectedPrompt}
                                    onResetSuccess={(promptName) => {
                                        // Clear current scores if the reset prompt is the selected one
                                        if (selectedPrompt === promptName) {
                                            setScores([]);
                                        }
                                        // Trigger ScoreSummary refresh
                                        setScoreSummaryRefreshTrigger(prev => prev + 1);
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-4 flex flex-col order-1 lg:order-2 h-full" style={{ height: 'calc(100vh - 140px)' }}>
                        {/* Score Summary at Top */}
                        <div className="animate-fade-in-up flex-shrink-0">
                            <ScoreSummary
                                key={`${selectedPrompt}-${scores.length}-${scoreSummaryRefreshTrigger}`}
                                scores={scores}
                                totalResults={recommendations.length}
                                currentPrompt={selectedPrompt}
                                refreshTrigger={scoreSummaryRefreshTrigger}
                            />
                        </div>

                        {/* Scrollable Content Area */}
                        <div className="flex-1 overflow-y-auto min-h-0">
                            <div className="space-y-4 sm:space-y-6">
                                {/* Error State */}
                                {error && (
                                    <div className="card-simple p-6 animate-fade-in-up">
                                        <div className="flex items-start space-x-4">
                                            <div className="bg-red-100 p-2 rounded-lg">
                                                <AlertCircle className="text-red-600" size={20} />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="text-red-900 font-semibold mb-2">Service Unavailable</h4>
                                                <p className="text-red-700 text-sm mb-3">{error}</p>
                                                <div className="flex items-center space-x-2 text-xs text-red-600">
                                                    <span>💡</span>
                                                    <span>Try refreshing or selecting a different prompt</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Loading State */}
                                {loading && (
                                    <div className="card-simple p-8 animate-fade-in-up">
                                        <LoadingSpinner message={`Analyzing fonts... ${progress}%`} />
                                        {progress > 0 && progress < 100 && (
                                            <div className="mt-6">
                                                <div className="progress-modern">
                                                    <div
                                                        className="progress-modern-fill"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                                <p className="text-gray-600 text-sm mt-3 text-center">
                                                    Processing recommendations... {progress}% complete
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Results */}
                                {!loading && !error && recommendations.length > 0 && (
                                    <div className="card-simple p-6 animate-fade-in-up h-full">
                                        <FontRecommendations
                                            recommendations={recommendations}
                                            prompt={selectedPrompt}
                                            onScoreSaved={handleScoreSaved}
                                            refreshTrigger={scoreSummaryRefreshTrigger}
                                        />
                                    </div>
                                )}

                                {/* Empty State */}
                                {!loading && !error && recommendations.length === 0 && selectedPrompt && (
                                    <div className="card-simple p-8 animate-fade-in-up">
                                        <div className="text-center">
                                            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                                                <TrendingUp className="text-gray-400 mx-auto" size={24} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Found</h3>
                                            <p className="text-gray-600 text-sm">
                                                Try selecting a different prompt or refreshing the current one.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Initial State */}
                                {!loading && !error && recommendations.length === 0 && !selectedPrompt && (
                                    <div className="card-simple p-8 animate-fade-in-up">
                                        <div className="text-center">
                                            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                                                <Zap className="text-blue-600 mx-auto" size={24} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Font Evaluator</h3>
                                            <p className="text-gray-600 text-sm">
                                                Select a prompt from the sidebar to start evaluating font recommendations.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Modal */}
            <CustomModal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                onConfirm={modalState.onConfirm}
                confirmText={modalState.type === 'confirm' ? 'Reset' : 'OK'}
                showCancel={modalState.type === 'confirm'}
                cancelText="Cancel"
            />
        </div>
    );
};

export default FeedbackPage; 