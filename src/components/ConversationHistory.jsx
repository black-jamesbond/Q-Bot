import { useState, useEffect } from 'react';
import { firestoreService } from '../services/firestoreService';
import './ConversationHistory.css';

function ConversationHistory({ isOpen, onClose, onSelectConversation }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  // Mock data for demonstration (replace with actual API calls)
  const mockConversations = [
    {
      id: 1,
      title: 'Getting Started with Q-bot',
      lastMessage: 'Thank you for the help!',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      messageCount: 8
    },
    {
      id: 2,
      title: 'Project Planning Discussion',
      lastMessage: 'Can you help me create a project timeline?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      messageCount: 15
    },
    {
      id: 3,
      title: 'Code Review Questions',
      lastMessage: 'What are the best practices for React components?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      messageCount: 12
    },
    {
      id: 4,
      title: 'API Integration Help',
      lastMessage: 'How do I handle authentication tokens?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      messageCount: 6
    },
    {
      id: 5,
      title: 'Database Design Questions',
      lastMessage: 'Should I use SQL or NoSQL for this project?',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      messageCount: 10
    }
  ];

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery]);

  const loadConversations = async () => {
    setLoading(true);
    setError('');

    try {
      // For now, use mock data until user authentication is implemented
      // TODO: Replace with Firebase Firestore call:
      // const response = await firestoreService.conversations.getByUser(userId);
      // setConversations(response.data || []);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setConversations(mockConversations);
    } catch (err) {
      setError('Failed to load conversation history');
      console.error('Error loading conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const filtered = conversations.filter(conv =>
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredConversations(filtered);
  };

  const handleSelectConversation = (conversation) => {
    onSelectConversation(conversation);
    onClose();
  };

  const handleDeleteConversation = async (conversationId, event) => {
    event.stopPropagation();
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      // await conversationAPI.deleteConversation(conversationId);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
    } catch (err) {
      setError('Failed to delete conversation');
      console.error('Error deleting conversation:', err);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="conversation-history-overlay">
      <div className="conversation-history-modal">
        <div className="conversation-history-header">
          <h2>Conversation History</h2>
          <button className="close-button" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="conversation-search">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="conversation-list">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading conversations...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={loadConversations} className="retry-button">
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && filteredConversations.length === 0 && (
            <div className="empty-state">
              <p>No conversations found</p>
            </div>
          )}

          {!loading && !error && filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className="conversation-item"
              onClick={() => handleSelectConversation(conversation)}
            >
              <div className="conversation-content">
                <div className="conversation-title">{conversation.title}</div>
                <div className="conversation-preview">{conversation.lastMessage}</div>
                <div className="conversation-meta">
                  <span className="message-count">{conversation.messageCount} messages</span>
                  <span className="timestamp">{formatTimestamp(conversation.timestamp)}</span>
                </div>
              </div>
              <button
                className="delete-button"
                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                title="Delete conversation"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3,6 5,6 21,6"></polyline>
                  <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ConversationHistory;
