import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { prompts } from '../data/prompts';
import { resetPromptFeedback } from '../services/api';
import CustomModal from './CustomModal';

const PromptGrid = ({ onPromptClick, selectedPrompt, onResetSuccess }) => {
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        message: '',
        onConfirm: null
    });

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

    const handleReset = async (e, prompt) => {
        e.stopPropagation(); // Prevent triggering the prompt click

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
                            if (onResetSuccess) {
                                onResetSuccess(prompt);
                            }
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

    return (
        <>
            <div className="space-y-2">
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
                                    onClick={() => onPromptClick(prompt)}
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
                                    onClick={(e) => handleReset(e, prompt)}
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
        </>
    );
};

export default PromptGrid; 