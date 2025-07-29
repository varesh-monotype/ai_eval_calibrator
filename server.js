const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// File paths
const feedbackFilePath = path.join(__dirname, 'feedback.json');
const userFilePath = path.join(__dirname, 'user.json');

// Initialize feedback file if it doesn't exist or is empty
const initializeFeedbackFile = () => {
    try {
        if (!fs.existsSync(feedbackFilePath)) {
            fs.writeFileSync(feedbackFilePath, '{}', 'utf8');
            console.log('Created new feedback.json file');
        } else {
            // Check if file is empty or invalid
            const content = fs.readFileSync(feedbackFilePath, 'utf8');
            if (!content.trim()) {
                fs.writeFileSync(feedbackFilePath, '{}', 'utf8');
                console.log('Reset empty feedback.json file');
            } else {
                // Validate JSON
                JSON.parse(content);
                console.log('Valid feedback.json file found');
            }
        }
    } catch (error) {
        console.log('Invalid feedback.json file, creating new one');
        fs.writeFileSync(feedbackFilePath, '{}', 'utf8');
    }
};

// Initialize the file
initializeFeedbackFile();

// Login endpoint
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Read user data
        const userContent = fs.readFileSync(userFilePath, 'utf8');
        const userData = JSON.parse(userContent);

        // Find user
        const user = userData.users.find(u => u.username === username && u.password === password);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Return user info (without password)
        const { password: _, ...userInfo } = user;
        res.json({
            success: true,
            user: userInfo,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET endpoint to retrieve feedback
app.get('/api/feedback', (req, res) => {
    try {
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        const content = fs.readFileSync(feedbackFilePath, 'utf8');
        if (!content.trim()) {
            res.json({});
            return;
        }

        const allFeedback = JSON.parse(content);

        // Return only feedback for the specific user
        const userFeedback = allFeedback[username] || {};
        res.json(userFeedback);
    } catch (error) {
        console.error('Error reading feedback:', error);
        // Reset the file if it's corrupted
        fs.writeFileSync(feedbackFilePath, '{}', 'utf8');
        res.json({});
    }
});

// POST endpoint to save feedback
app.post('/api/feedback', (req, res) => {
    try {
        const { promptName, feedbackData } = req.body;
        const username = feedbackData.username;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Read existing feedback with error handling
        let existingFeedback = {};
        try {
            const content = fs.readFileSync(feedbackFilePath, 'utf8');
            if (content.trim()) {
                existingFeedback = JSON.parse(content);
            }
        } catch (error) {
            console.log('Error reading existing feedback, starting fresh');
            existingFeedback = {};
        }

        // Initialize user if it doesn't exist
        if (!existingFeedback[username]) {
            existingFeedback[username] = {};
        }

        // Initialize prompt for this user if it doesn't exist
        if (!existingFeedback[username][promptName]) {
            existingFeedback[username][promptName] = [];
        }

        // Check if feedback for this font already exists for this user
        const existingIndex = existingFeedback[username][promptName].findIndex(
            item => item.md5 === feedbackData.md5
        );

        if (existingIndex !== -1) {
            // Update existing feedback
            existingFeedback[username][promptName][existingIndex] = feedbackData;
            console.log('Updated existing feedback for font:', feedbackData.md5, 'for user:', username);
        } else {
            // Add new feedback
            existingFeedback[username][promptName].push(feedbackData);
            console.log('Added new feedback for font:', feedbackData.md5, 'for user:', username);
        }

        // Write back to file
        fs.writeFileSync(feedbackFilePath, JSON.stringify(existingFeedback, null, 2), 'utf8');

        console.log('Feedback saved for prompt:', promptName, 'for user:', username);
        res.json({
            success: true,
            promptName: promptName,
            username: username,
            isNew: existingIndex === -1
        });
    } catch (error) {
        console.error('Error saving feedback:', error);
        res.status(500).json({ error: 'Failed to save feedback' });
    }
});

// DELETE endpoint to reset feedback for a specific prompt
app.delete('/api/feedback/:promptName', (req, res) => {
    try {
        const { promptName } = req.params;
        const { username } = req.query;

        if (!username) {
            return res.status(400).json({ error: 'Username is required' });
        }

        // Read existing feedback
        let existingFeedback = {};
        try {
            const content = fs.readFileSync(feedbackFilePath, 'utf8');
            if (content.trim()) {
                existingFeedback = JSON.parse(content);
            }
        } catch (error) {
            console.log('Error reading existing feedback, starting fresh');
            existingFeedback = {};
        }

        // Remove the specific prompt's data for this user
        if (existingFeedback[username] && existingFeedback[username][promptName]) {
            delete existingFeedback[username][promptName];
            console.log('Removed feedback data for prompt:', promptName, 'for user:', username);
        }

        // Write back to file
        fs.writeFileSync(feedbackFilePath, JSON.stringify(existingFeedback, null, 2), 'utf8');

        res.json({
            success: true,
            message: `Feedback data cleared for prompt: ${promptName} for user: ${username}`
        });
    } catch (error) {
        console.error('Error clearing feedback:', error);
        res.status(500).json({ error: 'Failed to clear feedback' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Server accessible at: http://172.22.1.139:${PORT}`);
    console.log(`Feedback will be saved to: ${feedbackFilePath}`);
}); 