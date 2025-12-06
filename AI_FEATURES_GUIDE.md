# AI Features Guide - LearnNest

## Overview

LearnNest now includes powerful AI features powered by Google's Gemini 2.0 Flash model, providing intelligent assistance throughout the platform.

## Features

### 1. Study Room AI Assistant (@ai)

In any study room, you can ask the AI assistant for help by mentioning `@ai` in your message.

#### How to Use:

1. Join any study room
2. In the chat, type `@ai` followed by your question
3. Example: `@ai What is the Pythagorean theorem?`
4. The AI Assistant will respond with helpful information

#### Features:

- **Context-Aware**: The AI analyzes recent conversation history to provide relevant answers
- **Multi-User Support**: All participants can see AI responses
- **Real-time**: Instant AI responses appear as messages in the chat
- **Smart Recognition**: The AI is identified with a 🤖 icon and sparkles ✨

#### Examples:

```
@ai Can you explain photosynthesis?
@ai What's the difference between machine learning and deep learning?
@ai Help me understand this concept better
```

### 2. Enhanced Question Bot

The Question Bot page now supports advanced PDF and image analysis.

#### Capabilities:

- **PDF Analysis**: Upload PDF documents and ask questions about their content
- **Image Understanding**: Upload images (diagrams, charts, photos) and get detailed analysis
- **Multi-File Support**: Upload multiple files in a single conversation
- **Voice Input**: Use speech-to-text for hands-free interaction
- **Text-to-Speech**: Listen to AI responses

#### Supported File Types:

- Images: JPEG, PNG, GIF, WebP
- Documents: PDF

#### How to Use:

1. Navigate to Question Bot
2. Click the paperclip icon to attach files
3. Type your question or use voice input
4. The AI will analyze the files and provide detailed responses

#### Example Use Cases:

- "Analyze this diagram and explain what's happening"
- "Summarize this PDF document for me"
- "What equations are shown in this image?"
- "Extract key points from this document"

## Technical Details

### Backend Implementation

#### API Endpoint

- **Route**: `/api/ai/query`
- **Method**: POST
- **Body**:
  ```json
  {
    "prompt": "Your question here",
    "context": "Optional conversation context",
    "fileData": {
      "mimeType": "image/jpeg",
      "data": "base64_encoded_data"
    }
  }
  ```

#### Socket.IO Event

The backend automatically detects `@ai` mentions in study room messages and triggers AI responses through Socket.IO events:

- **Event**: `sendMessage`
- **Detection**: Checks if message content includes `@ai`
- **Response**: Sends `newMessage` event with AI response

### Frontend Implementation

#### Environment Variables

Add to `frontend/.env.local`:

```env
VITE_GEMINI_STUDYROOM_API_KEY=your_api_key_here
VITE_GEMINI_QUESTIONBOT_API_KEY=your_api_key_here
```

#### Backend Environment Variables

Add to `Backend/.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

### Model Configuration

- **Model**: gemini-2.0-flash-exp
- **Temperature**: 0.7
- **Top K**: 40
- **Top P**: 0.95
- **Max Output Tokens**: 2048

## API Key Setup

### Getting Your API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key

### Configuration

The current implementation uses the API key: `AIzaSyCIQ6E3eHINZaxpKjOfwedwwgY_xzZ6PV8`

⚠️ **Security Note**: For production, always use environment variables and never commit API keys to version control.

## Usage Limits

- Gemini 2.0 Flash offers generous free tier limits
- Rate limiting is handled automatically by the API
- For production apps, monitor usage through Google Cloud Console

## Best Practices

### Study Room AI

1. **Be Specific**: Ask clear, specific questions for better responses
2. **Provide Context**: The AI uses recent messages for context
3. **Educational Focus**: Best for learning-related questions
4. **Group Benefit**: Everyone in the room sees AI responses

### Question Bot

1. **Quality Files**: Use clear, high-resolution images for better analysis
2. **Relevant Questions**: Ask specific questions about uploaded content
3. **Multiple Angles**: For complex topics, ask follow-up questions
4. **File Size**: Keep files under 10MB for optimal performance

## Troubleshooting

### AI Not Responding in Study Room

- Ensure `@ai` is included in your message
- Check backend console for errors
- Verify GEMINI_API_KEY is set in Backend/.env
- Confirm Socket.IO connection is active

### Question Bot Issues

- Verify VITE_GEMINI_QUESTIONBOT_API_KEY in frontend/.env.local
- Check file type is supported (images or PDF)
- Ensure file size is under 10MB
- Check browser console for errors

### Common Errors

1. **API Key Invalid**: Double-check the key is correct and active
2. **Rate Limit Exceeded**: Wait a few minutes and try again
3. **File Upload Failed**: Reduce file size or change format
4. **No Response**: Check network connection and API status

## Development Notes

### Adding New AI Features

1. Import GoogleGenerativeAI in your component/route
2. Initialize with API key from environment
3. Use gemini-2.0-flash-exp model
4. Configure generation parameters
5. Handle responses and errors appropriately

### Testing

- Test with various question types
- Verify file upload and analysis
- Check error handling
- Monitor API usage and costs

## Future Enhancements

- [ ] Image upload support in study rooms for @ai queries
- [ ] Conversation history persistence for Question Bot
- [ ] Custom AI personas for different subjects
- [ ] Voice-to-voice interaction
- [ ] Real-time collaborative document analysis

## Support

For issues or questions about AI features, contact the development team or file an issue in the repository.

---

**Powered by Google Gemini 2.0 Flash** 🚀
