import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import FeedbackPage from './pages/FeedbackPage';

// Protected Route component
const ProtectedRoute = ({ children }) => {
    const user = localStorage.getItem('user');
    return user ? children : <Navigate to="/" replace />;
};

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                    path="/feedback"
                    element={
                        <ProtectedRoute>
                            <FeedbackPage />
                        </ProtectedRoute>
                    }
                />
            </Routes>
        </Router>
    );
}

export default App; 