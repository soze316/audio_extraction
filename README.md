# Sermon Highlighter Web App

A mobile-friendly web application that extracts sermon metadata from an RSS feed, allows you to select audio segments, and generates a 10-minute highlight version by calling n8n webhooks.

## Features

- **RSS Feed Integration**: Fetch sermon episodes from any podcast RSS feed
- **Audio Player**: Built-in audio player with play/pause controls
- **Highlight Markers**: Mark key moments in the sermon with timestamps
- **10-Minute Version**: Generate a condensed version of the sermon using your highlights
- **Mobile-Friendly**: Responsive design that works on all devices
- **No Backend Required**: Works entirely in the browser (with n8n webhook integration)

## How to Use

1. **Enter RSS Feed URL**:
   - Paste the URL of the podcast RSS feed containing your sermons
   - Click "Fetch Episodes" to load the available episodes

2. **Select a Sermon**:
   - Browse the list of available episodes
   - Click on an episode to load it into the audio player

3. **Add Highlights**:
   - Play the audio and click "Add Highlight" at key moments
   - Highlights will be saved with timestamps
   - View and manage your highlights in the list below the player

4. **Generate 10-Minute Version**:
   - Click "Generate 10-Minute Version" to process your highlights
   - The app will call the n8n webhook to create a condensed version
   - Download the resulting highlight version

## Setup for Development

This is a static web application that can be opened directly in a web browser. No build step is required.

1. Clone this repository
2. Open `index.html` in a web browser
3. Start using the application

## n8n Webhook Integration

To enable the full functionality, you'll need to set up two n8n webhooks:

1. **RSS Feed Parser Webhook**:
   - Endpoint: `YOUR_N8N_WEBHOOK_URL/rss-parser`
   - Expected payload: `{ "rssUrl": "URL_TO_RSS_FEED" }`
   - Response: Array of episode objects with `title`, `audioUrl`, `date`, and `duration`

2. **Highlight Processor Webhook**:
   - Endpoint: `YOUR_N8N_WEBHOOK_URL/process-highlights`
   - Expected payload: 
     ```json
     {
       "audioUrl": "URL_TO_AUDIO_FILE",
       "highlights": [
         { "time": 123, "text": "Key point about faith" },
         { "time": 456, "text": "Important scripture reference" }
       ],
       "title": "Sermon Title"
     }
     ```
   - Response: URL to the processed highlight version

## Browser Compatibility

This application uses modern JavaScript features and works best in the latest versions of:
- Google Chrome
- Mozilla Firefox
- Microsoft Edge
- Safari

## License

This project is open source and available under the [MIT License](LICENSE).
