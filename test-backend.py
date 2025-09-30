#!/usr/bin/env python3
"""
Simple AI Backend Test Server for Q-bot
This is a basic test server to verify the frontend integration works.
Replace this with your actual AI backend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import time
import random

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Simple responses for testing
TEST_RESPONSES = [
    "Hello! I'm your AI assistant. How can I help you today?",
    "That's an interesting question! Let me think about that...",
    "I understand what you're asking. Here's my response:",
    "Thanks for your message! I'm here to help with any questions you have.",
    "I'm processing your request. Is there anything specific you'd like to know?",
    "Great question! I'd be happy to assist you with that.",
    "I'm your AI companion, ready to help with various tasks and questions.",
    "That's a thoughtful inquiry. Let me provide you with some insights.",
]

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "message": "AI Backend is running",
        "timestamp": time.time()
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    """Main chat endpoint"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        user_message = data.get('message', '')
        conversation_history = data.get('conversation_history', [])
        
        if not user_message:
            return jsonify({"error": "No message provided"}), 400
        
        # Simulate processing time
        time.sleep(random.uniform(0.5, 2.0))
        
        # Simple response logic for testing
        if 'hello' in user_message.lower() or 'hi' in user_message.lower():
            response = "Hello! Nice to meet you. I'm your AI assistant."
        elif 'how are you' in user_message.lower():
            response = "I'm doing great, thank you for asking! How can I assist you today?"
        elif 'test' in user_message.lower():
            response = "Test successful! The AI backend is working correctly."
        elif 'bye' in user_message.lower() or 'goodbye' in user_message.lower():
            response = "Goodbye! Feel free to come back anytime you need assistance."
        else:
            # Random response for other messages
            response = random.choice(TEST_RESPONSES)
        
        return jsonify({
            "response": response,
            "timestamp": time.time(),
            "message_count": len(conversation_history) + 1
        })
        
    except Exception as e:
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@app.route('/api/upload', methods=['POST'])
def upload_file():
    """File upload endpoint (placeholder)"""
    return jsonify({
        "message": "File upload endpoint - not implemented yet",
        "status": "placeholder"
    })

if __name__ == '__main__':
    print("🤖 Starting Q-bot AI Backend Test Server...")
    print("📡 Server will run on: http://localhost:8001")
    print("🔗 Frontend should connect to: http://localhost:8001/api/chat")
    print("💡 This is a test server. Replace with your actual AI backend.")
    print("🚀 Starting server...")

    app.run(
        host='0.0.0.0',
        port=8001,
        debug=True
    )
