# 🤖 Complete AI Backend Integration Guide

## ✅ All Steps to Connect Your AI Backend

### Step 1: Test with Provided Backend (Recommended First)

1. **Install Python dependencies:**
   ```bash
   pip install flask flask-cors
   ```

2. **Start the test backend:**
   ```bash
   python test-backend.py
   ```
   You should see:
   ```
   🤖 Starting Q-bot AI Backend Test Server...
   📡 Server will run on: http://localhost:8000
   🚀 Starting server...
   ```

3. **Test the connection:**
   - Open Q-bot: http://localhost:5173/Q-bot
   - Click the "Test AI" button in the sidebar
   - Should change to "AI Connected" (green)
   - Try sending a chat message like "Hello"

### Step 2: Configure for Your AI Backend

1. **Update the backend URL in `src/config/api.js`:**
   ```javascript
   BASE_URL: 'http://your-backend-url:port',
   ```

2. **Update the chat endpoint if needed:**
   ```javascript
   ENDPOINTS: {
     CHAT: '/your/chat/endpoint',
   }
   ```

3. **Configure response format:**
   ```javascript
   RESPONSE_FORMAT: {
     messageKey: 'response', // Change to match your API
   }
   ```

### Step 3: Ensure Your Backend Supports

**Required Endpoints:**
- `POST /api/chat` - Main chat endpoint
- `GET /api/health` - Health check (optional but recommended)

**Request Format Your Backend Should Accept:**
```json
{
  "message": "User's message here",
  "conversation_history": [
    {"role": "user", "content": "Previous user message"},
    {"role": "assistant", "content": "Previous AI response"}
  ]
}
```

**Response Format Your Backend Should Return:**
```json
{
  "response": "AI's response message here"
}
```

### Step 4: Add CORS Support

Your backend must allow requests from `http://localhost:5173`:

**Python Flask Example:**
```python
from flask_cors import CORS
app = Flask(__name__)
CORS(app)
```

**Node.js Express Example:**
```javascript
const cors = require('cors');
app.use(cors());
```

### Step 5: Test Everything

1. **Start your AI backend**
2. **Start Q-bot frontend:** `npm run dev`
3. **Test connection:** Click "Test AI" button
4. **Send test message:** Try "Hello" or "Test"
5. **Check browser console** for any errors (F12 → Console)

## 🎯 Features You Get

✅ **Real-time Chat** - Send messages and get AI responses
✅ **Typing Indicator** - Shows "typing..." while waiting
✅ **Connection Status** - Visual indicator of AI backend status
✅ **Error Handling** - Graceful error messages
✅ **Conversation History** - Context sent to AI
✅ **Dark Mode Support** - Works in both themes
✅ **Mobile Responsive** - Works on all devices

## 🔧 Troubleshooting

### "AI Offline" Status
- Check if your backend is running
- Verify the URL in `src/config/api.js`
- Check browser console for CORS errors

### Messages Not Sending
- Check network tab in browser dev tools
- Verify your backend accepts POST requests
- Check the request/response format

### CORS Errors
- Add CORS headers to your backend
- Allow origin: `http://localhost:5173`

## 🚀 Ready to Chat!

Once everything is connected, you'll have a fully functional AI chat interface with:
- Professional typing indicators
- Real-time responses from your AI
- Beautiful dark/light mode support
- Mobile-friendly design
- Robust error handling

Your Q-bot is now ready to chat with your AI backend! 🎉
