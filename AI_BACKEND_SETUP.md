# AI Backend Integration Setup

Your Q-bot frontend is now ready to connect to your AI backend! Follow these steps to complete the integration:

## 🚀 Quick Start (Test with Provided Server)

### 1. Start the Test Backend
```bash
# Install Python dependencies
pip install flask flask-cors

# Run the test server
python test-backend.py
```

### 2. Test the Connection
1. Open Q-bot: http://localhost:5173/Q-bot
2. Click the "Test AI" button in the sidebar
3. Should show "AI Connected" if working
4. Try sending a chat message

## 🔧 Connect Your Own AI Backend

## 🔧 Configuration

### 1. Update Backend URL
Edit `src/config/api.js` and update the `BASE_URL`:

```javascript
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000', // Change this to your backend URL
  // ... rest of config
}
```

### 2. Configure API Endpoint
Update the chat endpoint if needed:

```javascript
ENDPOINTS: {
  CHAT: '/api/chat',  // Change this to match your backend endpoint
}
```

### 3. Set Response Format
Tell the frontend how to extract the AI response from your API:

```javascript
RESPONSE_FORMAT: {
  messageKey: 'response',  // Change to match your API response key
  fallbackKeys: ['message', 'content', 'text', 'reply']
}
```

## 📡 Expected API Format

### Request Format
The frontend sends POST requests to your chat endpoint with this format:

```json
{
  "message": "User's message here",
  "conversation_history": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant", 
      "content": "Previous AI response"
    }
  ]
}
```

### Response Format
Your backend should respond with JSON containing the AI's message:

```json
{
  "response": "AI's response message here"
}
```

Or any of these alternative formats:
```json
{
  "message": "AI response"
}
```
```json
{
  "content": "AI response"
}
```

## 🔐 Authentication (Optional)

If your backend requires authentication, add headers in `src/config/api.js`:

```javascript
REQUEST_CONFIG: {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your-token-here',
    // or
    'X-API-Key': 'your-api-key-here'
  }
}
```

## 🚀 Testing

1. **Start your AI backend** (make sure it's running on the configured URL)
2. **Start the Q-bot frontend**: `npm run dev`
3. **Open the app**: http://localhost:5173/Q-bot
4. **Send a test message** in the chat

## 🔍 Debugging

### Check Browser Console
Open browser dev tools (F12) and check the Console tab for any errors.

### Check Network Tab
In dev tools, go to Network tab to see if API requests are being made and what responses you're getting.

### Common Issues

1. **CORS Error**: Your backend needs to allow requests from `http://localhost:5173`
2. **Wrong URL**: Double-check the BASE_URL in the config
3. **Wrong Response Format**: Make sure your API returns the expected JSON format

## 📝 Example Backend Response

Here's what a successful response should look like:

```json
{
  "response": "Hello! I'm Q-bot, your AI assistant. How can I help you today?"
}
```

## 🎯 Features Included

✅ **Real-time Chat**: Send messages and get AI responses
✅ **Typing Indicator**: Shows "typing..." while waiting for AI response  
✅ **Error Handling**: Graceful error messages for connection issues
✅ **Conversation History**: Sends previous messages for context
✅ **Timeout Protection**: 30-second timeout for API calls
✅ **Dark Mode Support**: Works in both light and dark themes

## 🔄 Next Steps

Once basic chat is working, you can extend the integration:

1. **File Upload**: Add file processing to your backend
2. **Streaming**: Implement streaming responses for real-time typing
3. **Authentication**: Add user authentication if needed
4. **Custom Features**: Add any specific AI capabilities your backend supports

Happy chatting! 🤖✨
