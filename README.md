# Font Recommendation Evaluator

A modern React application for evaluating font recommendations from the FontGPT API. Users can select from 20 predefined prompts, fetch font recommendations, and score them as Good Match, Average Match, or Bad Match.

## Features

- **20 Predefined Prompts**: Grid layout of font-related prompts
- **API Integration**: Fetches recommendations from FontGPT backend
- **Interactive Scoring**: Score each font recommendation with three options
- **Real-time Statistics**: Live scoring summary with percentages
- **Modern UI**: Beautiful, responsive design with Tailwind CSS
- **Loading States**: Smooth loading animations and error handling

## Technology Stack

- **React 18**: Modern React with hooks
- **Tailwind CSS**: Utility-first CSS framework
- **Axios**: HTTP client for API calls
- **Lucide React**: Beautiful icons
- **PostCSS**: CSS processing

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Open Browser**
   Navigate to `http://localhost:3000`

## Usage

1. **Select a Prompt**: Click on any of the 20 prompts in the grid
2. **View Recommendations**: The app will fetch up to 20 font recommendations
3. **Score Fonts**: For each font, click one of the three scoring options:
   - ✅ **Good Match**: Font is a good recommendation
   - ➖ **Average Match**: Font is an okay recommendation
   - ❌ **Bad Match**: Font is a poor recommendation
4. **View Statistics**: See real-time scoring summary with percentages

## API Integration

The application integrates with the FontGPT backend API:

```bash
curl --location 'https://fontgpt-backend.monotype-pp.com/fontrecommendations/typesense/stream' \
--header 'Content-Type: application/json' \
--data '{
    "query": "fonts of helvetica",
    "intermediate_query_enabled": true,
    "prompt" : "",
    "with_conversion_ranking": "true",
    "faiss_optimized": true
}'
```

## Database Schema

The scoring data is structured for storage in a `font_scores` collection:

```javascript
{
  prompt: "fonts for modern websites",
  font_family: "helvetica",
  font_style: "helvetica rounded bold",
  font_md5: "ab08299944ea47df7a44c49a79f0bc9e",
  foundry: "linotype",
  score: "good", // "good", "average", or "bad"
  timestamp: "2024-01-01T00:00:00.000Z",
  font_data: { /* complete font object */ }
}
```

## Project Structure

```
src/
├── components/
│   ├── PromptGrid.js          # 20 prompts grid
│   ├── FontRecommendations.js # Font display and scoring
│   ├── LoadingSpinner.js      # Loading animation
│   └── ScoreSummary.js        # Statistics display
├── services/
│   └── api.js                 # API integration
├── data/
│   └── prompts.js             # 20 predefined prompts
├── App.js                     # Main application
└── index.js                   # React entry point
```

## Customization

### Adding New Prompts

Edit `src/data/prompts.js` to add or modify prompts:

```javascript
export const prompts = [
  "your new prompt here",
  // ... existing prompts
];
```

### Modifying API Endpoint

Update the API base URL in `src/services/api.js`:

```javascript
const API_BASE_URL = 'your-api-endpoint';
```

### Styling

The application uses Tailwind CSS. Customize colors and styling in `tailwind.config.js`.

## Development

- **Build for Production**: `npm run build`
- **Run Tests**: `npm test`
- **Eject Configuration**: `npm run eject` (not recommended)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this project for your own needs. 