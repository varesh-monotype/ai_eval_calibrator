import React from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

const CustomModal = ({
    isOpen,
    onClose,
    title,
    message,
    type = 'info', // 'info', 'warning', 'success', 'confirm'
    onConfirm,
    confirmText = 'OK',
    cancelText = 'Cancel',
    showCancel = false
}) => {
    if (!isOpen) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning':
            case 'confirm':
                return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-600" />;
            default:
                return <Info className="w-6 h-6 text-blue-600" />;
        }
    };

    const getButtonStyle = () => {
        switch (type) {
            case 'warning':
            case 'confirm':
                return 'bg-red-600 hover:bg-red-700 text-white';
            case 'success':
                return 'bg-green-600 hover:bg-green-700 text-white';
            default:
                return 'bg-blue-600 hover:bg-blue-700 text-white';
        }
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm();
        }
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-auto transform transition-all">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            {getIcon()}
                            <h3 className="text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-700 leading-relaxed">
                            {message}
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                        {showCancel && (
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={handleConfirm}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${getButtonStyle()}`}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomModal; 