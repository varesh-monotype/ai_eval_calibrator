const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/font_evaluator', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Font Score Schema
const fontScoreSchema = new mongoose.Schema({
    prompt: { type: String, required: true },
    font_family: { type: String, required: true },
    font_style: { type: String, required: true },
    font_md5: { type: String, required: true },
    foundry: { type: String, required: true },
    score: {
        type: String,
        required: true,
        enum: ['good', 'average', 'bad']
    },
    timestamp: { type: Date, default: Date.now },
    font_data: { type: Object, required: true },
    user_session: { type: String, required: true },
    ip_address: { type: String },
    user_agent: { type: String },
    screen_resolution: { type: String },
    timezone: { type: String }
});

const FontScore = mongoose.model('FontScore', fontScoreSchema);

// API Routes

// POST /api/font-scores - Save a font score
app.post('/api/font-scores', async (req, res) => {
    try {
        const scoreData = new FontScore(req.body);
        const savedScore = await scoreData.save();

        console.log('Font score saved:', savedScore);
        res.status(201).json({
            success: true,
            id: savedScore._id,
            message: 'Font score saved successfully'
        });
    } catch (error) {
        console.error('Error saving font score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save font score',
            error: error.message
        });
    }
});

// GET /api/font-scores - Get all font scores
app.get('/api/font-scores', async (req, res) => {
    try {
        const scores = await FontScore.find().sort({ timestamp: -1 });
        res.json(scores);
    } catch (error) {
        console.error('Error fetching font scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch font scores',
            error: error.message
        });
    }
});

// GET /api/font-scores/stats - Get scoring statistics
app.get('/api/font-scores/stats', async (req, res) => {
    try {
        const stats = await FontScore.aggregate([
            {
                $group: {
                    _id: '$score',
                    count: { $sum: 1 },
                    fonts: { $push: '$font_family' }
                }
            }
        ]);

        const totalScores = await FontScore.countDocuments();
        const uniquePrompts = await FontScore.distinct('prompt');
        const uniqueFonts = await FontScore.distinct('font_family');

        res.json({
            total_scores: totalScores,
            unique_prompts: uniquePrompts.length,
            unique_fonts: uniqueFonts.length,
            score_distribution: stats,
            recent_scores: await FontScore.find().sort({ timestamp: -1 }).limit(10)
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

// GET /api/font-scores/prompt/:prompt - Get scores for specific prompt
app.get('/api/font-scores/prompt/:prompt', async (req, res) => {
    try {
        const scores = await FontScore.find({
            prompt: req.params.prompt
        }).sort({ timestamp: -1 });

        res.json(scores);
    } catch (error) {
        console.error('Error fetching prompt scores:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prompt scores',
            error: error.message
        });
    }
});

// DELETE /api/font-scores/:id - Delete a specific score
app.delete('/api/font-scores/:id', async (req, res) => {
    try {
        await FontScore.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Score deleted successfully' });
    } catch (error) {
        console.error('Error deleting score:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete score',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Font Evaluator Backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoints:`);
    console.log(`  POST /api/font-scores - Save font score`);
    console.log(`  GET  /api/font-scores - Get all scores`);
    console.log(`  GET  /api/font-scores/stats - Get statistics`);
    console.log(`  GET  /api/font-scores/prompt/:prompt - Get scores by prompt`);
    console.log(`  DELETE /api/font-scores/:id - Delete score`);
}); 