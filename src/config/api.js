// AI Backend Configuration
// Update these settings to match your AI backend

export const API_CONFIG = {
  // Backend URL - Update this to your AI backend URL
  BASE_URL: 'http://localhost:8001', // Change this to your backend URL
  
  // API Endpoints
  ENDPOINTS: {
    CHAT: '/api/chat',           // Chat endpoint
    UPLOAD: '/api/upload',       // File upload endpoint (for future use)
    HEALTH: '/api/health'        // Health check endpoint
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    timeout: 30000,              // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
      // Add any authentication headers here if needed
      // 'Authorization': 'Bearer your-token-here',
      // 'X-API-Key': 'your-api-key-here'
    }
  },
  
  // Response format configuration
  RESPONSE_FORMAT: {
    // The key in the response that contains the AI's message
    messageKey: 'response',      // Change to 'message', 'content', etc. based on your API
    
    // Alternative keys to try if the primary key doesn't exist
    fallbackKeys: ['message', 'content', 'text', 'reply']
  },
  
  // Error handling
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Unable to connect to the AI service. Please check your internet connection.',
    TIMEOUT_ERROR: 'The AI service is taking too long to respond. Please try again.',
    SERVER_ERROR: 'The AI service encountered an error. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.'
  }
}

// Helper function to get the full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// Helper function to get request headers
export const getRequestHeaders = () => {
  return {
    ...API_CONFIG.REQUEST_CONFIG.headers,
    // Add any dynamic headers here (e.g., auth tokens from localStorage)
  }
}

// Helper function to extract message from API response
export const extractMessageFromResponse = (data) => {
  // Try the primary message key first
  if (data[API_CONFIG.RESPONSE_FORMAT.messageKey]) {
    return data[API_CONFIG.RESPONSE_FORMAT.messageKey]
  }

  // Try fallback keys
  for (const key of API_CONFIG.RESPONSE_FORMAT.fallbackKeys) {
    if (data[key]) {
      return data[key]
    }
  }

  // If no message found, return a default message
  return 'I received your message but had trouble formatting my response.'
}

// Health check function to test backend connection
export const checkBackendHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.HEALTH), {
      method: 'GET',
      headers: getRequestHeaders(),
      signal: AbortSignal.timeout(5000) // 5 second timeout for health check
    })

    return {
      isHealthy: response.ok,
      status: response.status,
      message: response.ok ? 'Backend is healthy' : `Backend returned status ${response.status}`
    }
  } catch (error) {
    return {
      isHealthy: false,
      status: 0,
      message: `Backend connection failed: ${error.message}`
    }
  }
}
