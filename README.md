# YouTube Summarizer Extension

A Chrome extension that adds a "Summarize" button to YouTube videos, calling the Gemini API to generate AI summaries with full markdown rendering support.

## Features

- 🎯 **One-click summarization**: Add a "Summarize" button to any YouTube video
- 🤖 **Gemini AI integration**: Uses Google's Gemini 2.5 Flash model for intelligent summaries
- 📝 **Markdown rendering**: Full HTML rendering of markdown responses from the AI
- 🎨 **Beautiful UI**: Clean, YouTube-integrated design with proper styling
- ⚡ **Real-time updates**: Works with YouTube's dynamic page navigation

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Configure your Gemini API key in the extension popup

## Technical Implementation

### Markdown Rendering Solution

The extension uses **Marked.js** library for converting markdown to HTML. To avoid Content Security Policy (CSP) issues common with Chrome extensions, we:

1. **Bundle the library locally**: Instead of loading from CDN, Marked.js is included directly in the extension
2. **Proper manifest configuration**: The `manifest.json` loads `marked.min.js` before the main content script
3. **Safe HTML rendering**: Markdown is parsed and rendered with appropriate styling while maintaining security

### File Structure

```
├── manifest.json           # Extension configuration
├── hello.html             # Popup interface
├── hello.js               # Popup logic
├── hello.css              # Popup styling
├── scripts/
│   ├── marked.min.js      # Markdown parsing library
│   └── content.js         # Main content script
└── images/                # Extension icons
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### Key Features

#### CSP-Compliant Design
- No external script loading
- All dependencies bundled locally
- Secure content script injection

#### Rich Markdown Support
- Headers (H1-H6)
- Bold and italic text
- Bullet points and numbered lists
- Code blocks and inline code
- Blockquotes
- Links (with hover effects)

### Prerequisites
- Chrome browser with Developer mode enabled
- Gemini API key from Google AI Studio

### Adding New Features
1. Modify `scripts/content.js` for YouTube page interactions
2. Update `hello.html` and `hello.js` for popup functionality
3. Test thoroughly with extension reload

### Troubleshooting

**CSP Errors**: Ensure all scripts are loaded locally, never from external URLs
**API Issues**: Verify your Gemini API key is correctly configured
**YouTube Changes**: The extension observes DOM changes to handle YouTube's SPA navigation

## API Configuration

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Generate an API key for Gemini
3. Click the extension icon and enter your API key
4. Start summarizing videos!

## Contributing

Feel free to submit issues and pull requests to improve the extension.

## License

This project is open source and available under the MIT License.
