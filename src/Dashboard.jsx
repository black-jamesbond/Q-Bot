import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import ConversationHistory from './components/ConversationHistory'
import Settings from './components/Settings'
import Notifications from './components/Notifications'
import { getApiUrl, getRequestHeaders, extractMessageFromResponse, API_CONFIG, checkBackendHealth } from './config/api'
import './Dashboard.css'
import './DarkTheme.css'

function Dashboard() {
  const { user, logout } = useAuth()
  const { toggleTheme, isDark } = useTheme()

  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: `Hello${user?.firstName ? ` ${user.firstName}` : ''}! I'm Q-bot. How can I help you today?`,
      timestamp: new Date()
    }
  ])

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (inputMessage.trim()) {
      const userMessage = {
        id: messages.length + 1,
        type: 'user',
        content: inputMessage,
        timestamp: new Date()
      }

      // Add user message immediately
      setMessages(prev => [...prev, userMessage])
      const currentInput = inputMessage
      setInputMessage('')

      // Add typing indicator
      const typingMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: 'typing...',
        timestamp: new Date(),
        isTyping: true
      }
      setMessages(prev => [...prev, typingMessage])

      try {
        // Call your AI backend using configuration
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_CONFIG.timeout)

        const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.CHAT), {
          method: 'POST',
          headers: getRequestHeaders(),
          body: JSON.stringify({
            message: currentInput,
            conversation_history: messages.filter(msg => !msg.isTyping).map(msg => ({
              role: msg.type === 'user' ? 'user' : 'assistant',
              content: msg.content
            }))
          }),
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        const aiMessage = extractMessageFromResponse(data)

        // Remove typing indicator and add bot response
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping)
          return [...withoutTyping, {
            id: prev.length + 1,
            type: 'bot',
            content: aiMessage,
            timestamp: new Date()
          }]
        })

      } catch (error) {
        console.error('Error calling AI backend:', error)

        let errorMessage = API_CONFIG.ERROR_MESSAGES.UNKNOWN_ERROR

        if (error.name === 'AbortError') {
          errorMessage = API_CONFIG.ERROR_MESSAGES.TIMEOUT_ERROR
        } else if (error.message.includes('fetch')) {
          errorMessage = API_CONFIG.ERROR_MESSAGES.NETWORK_ERROR
        } else if (error.message.includes('HTTP error')) {
          errorMessage = API_CONFIG.ERROR_MESSAGES.SERVER_ERROR
        }

        // Remove typing indicator and show error message
        setMessages(prev => {
          const withoutTyping = prev.filter(msg => !msg.isTyping)
          return [...withoutTyping, {
            id: prev.length + 1,
            type: 'bot',
            content: errorMessage,
            timestamp: new Date()
          }]
        })
      }
    }
  }

  const [uploadedFiles, setUploadedFiles] = useState([
    // Demo files for testing
    {
      id: 1,
      name: "Sample_Document.pdf",
      size: 2048576, // 2MB
      type: "application/pdf",
      uploadProgress: 100,
      status: 'completed'
    },
    {
      id: 2,
      name: "Study_Notes.docx",
      size: 1536000, // 1.5MB
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadProgress: 100,
      status: 'completed'
    },
    {
      id: 3,
      name: "Research_Paper.txt",
      size: 512000, // 500KB
      type: "text/plain",
      uploadProgress: 100,
      status: 'completed'
    }
  ])
  const [isDragOver, setIsDragOver] = useState(false)
  const [showFileUploadModal, setShowFileUploadModal] = useState(false)
  const [showTest, setShowTest] = useState(false)
  const [showTestLoading, setShowTestLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Initializing...')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState({})
  const [backendStatus, setBackendStatus] = useState(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [testQuestions] = useState([
    {
      id: 1,
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      correctAnswer: 1
    },
    {
      id: 3,
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1
    },
    {
      id: 4,
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      correctAnswer: 1
    },
    {
      id: 5,
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      correctAnswer: 3
    }
  ])

  const handleFileUpload = () => {
    setShowFileUploadModal(true)
  }

  const handleFileSelect = (files) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is 10MB.`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        id: Date.now() + Math.random(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 0,
        status: 'pending' // pending, uploading, completed, error
      }))

      setUploadedFiles(prev => [...prev, ...newFiles])

      // Simulate file upload process
      newFiles.forEach(fileObj => {
        simulateFileUpload(fileObj)
      })
    }
  }

  const simulateFileUpload = (fileObj) => {
    setUploadedFiles(prev =>
      prev.map(f => f.id === fileObj.id ? { ...f, status: 'uploading' } : f)
    )

    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileObj.id ? { ...f, uploadProgress: 100, status: 'completed' } : f)
        )
      } else {
        setUploadedFiles(prev =>
          prev.map(f => f.id === fileObj.id ? { ...f, uploadProgress: Math.floor(progress) } : f)
        )
      }
    }, 200)
  }

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const getFileIcon = (fileType) => {
    if (fileType.startsWith('image/')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21,15 16,10 5,21"></polyline>
        </svg>
      )
    } else if (fileType.startsWith('video/')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polygon points="23,7 16,12 23,17"></polygon>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
        </svg>
      )
    } else if (fileType.startsWith('audio/')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13"></path>
          <circle cx="6" cy="18" r="3"></circle>
          <circle cx="18" cy="16" r="3"></circle>
        </svg>
      )
    } else if (fileType.includes('pdf')) {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10,9 9,9 8,9"></polyline>
        </svg>
      )
    } else {
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z"></path>
          <polyline points="14,2 14,8 20,8"></polyline>
        </svg>
      )
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleTestClick = () => {
    setShowTestLoading(true)
    setLoadingText('Initializing...')
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})

    // Loading sequence
    setTimeout(() => {
      setLoadingText('Making test...')
    }, 800)

    setTimeout(() => {
      setLoadingText('Test ready!')
    }, 1600)

    setTimeout(() => {
      setShowTestLoading(false)
      setShowTest(true)
    }, 2200)
  }

  const handleAnswerSelect = (questionId, answerIndex) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < testQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleFinishTest = () => {
    // Calculate score
    let correctAnswers = 0
    testQuestions.forEach(question => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / testQuestions.length) * 100)
    alert(`Test completed! Your score: ${score}% (${correctAnswers}/${testQuestions.length} correct)`)
    setShowTest(false)
  }

  const currentQuestion = testQuestions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === testQuestions.length - 1
  const hasAnsweredCurrent = selectedAnswers[currentQuestion?.id] !== undefined

  const testBackendConnection = async () => {
    setIsTestingConnection(true)
    setBackendStatus(null)

    try {
      const health = await checkBackendHealth()
      setBackendStatus(health)
    } catch (error) {
      setBackendStatus({
        isHealthy: false,
        status: 0,
        message: `Connection test failed: ${error.message}`
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      // Navigation will be handled by the AuthProvider
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleShowHistory = () => {
    setShowHistory(true)
  }

  const handleCloseHistory = () => {
    setShowHistory(false)
  }

  const handleShowSettings = () => {
    setShowSettings(true)
  }

  const handleCloseSettings = () => {
    setShowSettings(false)
  }

  const handleShowNotifications = () => {
    setShowNotifications(true)
  }

  const handleCloseNotifications = () => {
    setShowNotifications(false)
  }

  const handleSelectConversation = (conversation) => {
    // Load the selected conversation into the current chat
    console.log('Loading conversation:', conversation)
    // For now, just show an alert. In a real app, you'd load the conversation messages
    alert(`Loading conversation: ${conversation.title}`)
  }

  return (
    <div className="dashboard-container">
      {/* Mobile Navigation Bar */}
      <nav className="mobile-navbar">
        <div className="mobile-nav-left">
          <div className="mobile-logo-section">
            <img src="/Q-bot/images/logos/Q-bot_logo.png" alt="Q-bot Logo" className="mobile-nav-logo" />
            <span className="mobile-nav-brand">Q-bot</span>
          </div>
        </div>
        <div className="mobile-nav-right">
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isMobileMenuOpen ? (
                // X icon when menu is open
                <>
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </>
              ) : (
                // Hamburger icon when menu is closed
                <>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <div className={`mobile-menu-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
        <ul className="mobile-menu" onClick={(e) => e.stopPropagation()}>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { handleFileUpload(); setIsMobileMenuOpen(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
              </svg>
              Upload File
            </button>
          </li>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { handleTestClick(); setIsMobileMenuOpen(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              Test
            </button>
          </li>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { handleShowSettings(); setIsMobileMenuOpen(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
              Settings
            </button>
          </li>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { handleShowNotifications(); setIsMobileMenuOpen(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              Notifications
            </button>
          </li>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { handleShowHistory(); setIsMobileMenuOpen(false); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v5h5"></path>
                <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                <path d="M12 7v5l4 2"></path>
              </svg>
              History
            </button>
          </li>
          <li className="mobile-nav-item">
            <button className="mobile-nav-link" onClick={() => { toggleTheme(); setIsMobileMenuOpen(false); }}>
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="19.78" y1="4.22" x2="18.36" y2="5.64"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="19.78" y1="19.78" x2="18.36" y2="18.36"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </li>
        </ul>
      </div>

      {/* File Upload Modal */}
      {showFileUploadModal && (
        <div className="file-upload-modal-overlay" onClick={() => setShowFileUploadModal(false)}>
          <div className="file-upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="file-upload-header">
              <h3>Upload Files</h3>
              <button
                className="close-modal-btn"
                onClick={() => setShowFileUploadModal(false)}
                aria-label="Close upload modal"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="file-upload-content">
              {/* Drag and Drop Area */}
              <div
                className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="drop-zone-content">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7,10 12,15 17,10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  <h4>Drag and drop files here</h4>
                  <p>or</p>
                  <label htmlFor="file-browser" className="browse-files-btn">
                    Browse Files
                    <input
                      id="file-browser"
                      type="file"
                      multiple
                      onChange={(e) => handleFileSelect(e.target.files)}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.mp4,.mp3,.zip,.rar"
                    />
                  </label>
                  <small>Supported formats: PDF, DOC, TXT, Images, Videos, Audio, Archives (Max 10MB each)</small>
                </div>
              </div>

              {/* Uploaded Files List */}
              {uploadedFiles.length > 0 && (
                <div className="uploaded-files-section">
                  <h4>Uploaded Files ({uploadedFiles.length})</h4>
                  <div className="uploaded-files-list">
                    {uploadedFiles.map(fileObj => (
                      <div key={fileObj.id} className={`uploaded-file-item ${fileObj.status}`}>
                        <div className="file-info">
                          <div className="file-icon">
                            {getFileIcon(fileObj.type)}
                          </div>
                          <div className="file-details">
                            <span className="file-name">{fileObj.name}</span>
                            <span className="file-size">{formatFileSize(fileObj.size)}</span>
                          </div>
                        </div>

                        <div className="file-actions">
                          {fileObj.status === 'uploading' && (
                            <div className="upload-progress">
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${fileObj.uploadProgress}%` }}
                                ></div>
                              </div>
                              <span className="progress-text">{fileObj.uploadProgress}%</span>
                            </div>
                          )}

                          {fileObj.status === 'completed' && (
                            <div className="upload-status success">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20,6 9,17 4,12"></polyline>
                              </svg>
                              Uploaded
                            </div>
                          )}

                          <button
                            className="remove-file-btn"
                            onClick={() => removeFile(fileObj.id)}
                            aria-label="Remove file"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3,6 5,6 21,6"></polyline>
                              <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="file-upload-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowFileUploadModal(false)}
              >
                Cancel
              </button>
              <button
                className="upload-btn"
                disabled={uploadedFiles.length === 0}
                onClick={() => {
                  // Process uploaded files
                  console.log('Processing files:', uploadedFiles)
                  setShowFileUploadModal(false)
                }}
              >
                Process Files ({uploadedFiles.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Loading Screen */}
      {showTestLoading && (
        <div className="loading-overlay" style={{ backgroundColor: 'rgba(255, 140, 0, 0.95)' }}>
          <div className="loading-container">
            <div className="logo-animation">
              <div className="logo-fallback">
                <div className="logo-text">Q-bot</div>
              </div>
            </div>
            <div className="loading-text" key={loadingText}>{loadingText}</div>
          </div>
        </div>
      )}

      {/* Test Interface Modal */}
      {showTest && currentQuestion && (
        <div className="file-upload-modal-overlay" onClick={() => setShowTest(false)}>
          <div className="test-modal" onClick={(e) => e.stopPropagation()}>
            <div className="test-header">
              <div className="test-progress">
                <h3>Question {currentQuestionIndex + 1} of {testQuestions.length}</h3>
                <div className="progress-bar-container">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${((currentQuestionIndex + 1) / testQuestions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setShowTest(false)}
                aria-label="Close test"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="test-content">
              <div className="question-section">
                <h2 className="question-text">{currentQuestion.question}</h2>

                <div className="options-container">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      className={`option-btn ${selectedAnswers[currentQuestion.id] === index ? 'selected' : ''}`}
                      onClick={() => handleAnswerSelect(currentQuestion.id, index)}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                      <span className="option-text">{option}</span>
                      {selectedAnswers[currentQuestion.id] === index && (
                        <svg className="check-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="test-footer">
              <button
                className="nav-btn prev-btn"
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15,18 9,12 15,6"></polyline>
                </svg>
                Previous
              </button>

              <div className="question-indicator">
                {testQuestions.map((_, index) => (
                  <div
                    key={index}
                    className={`indicator-dot ${index === currentQuestionIndex ? 'current' : ''} ${selectedAnswers[testQuestions[index].id] !== undefined ? 'answered' : ''}`}
                  ></div>
                ))}
              </div>

              {isLastQuestion ? (
                <button
                  className="nav-btn finish-btn"
                  onClick={handleFinishTest}
                  disabled={!hasAnsweredCurrent}
                >
                  Finish Test
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"></polyline>
                  </svg>
                </button>
              ) : (
                <button
                  className="nav-btn next-btn"
                  onClick={handleNextQuestion}
                  disabled={!hasAnsweredCurrent}
                >
                  Next
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6"></polyline>
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <main className="chat-container">
        <div className="chat-sidebar">
          <div className="sidebar-header">
            <div className="logo-section">
              <img src="/Q-bot/images/logos/Q-bot_logo.png" alt="Q-bot Logo" className="sidebar-logo" />
              <span className="sidebar-brand">Q-bot</span>
            </div>
          </div>
          <div className="sidebar-content">
            <div className="quick-actions">

              <button className="quick-action-btn" onClick={handleFileUpload}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"/>
                </svg>
                Upload File
              </button>
              <button className="quick-action-btn" onClick={handleTestClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14,2 14,8 20,8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10,9 9,9 8,9"></polyline>
                </svg>
                Test
              </button>
              <button
                className={`quick-action-btn ${isTestingConnection ? 'loading' : ''} ${backendStatus?.isHealthy === true ? 'success' : backendStatus?.isHealthy === false ? 'error' : ''}`}
                onClick={testBackendConnection}
                disabled={isTestingConnection}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22,4 12,14.01 9,11.01"></polyline>
                </svg>
                {isTestingConnection ? 'Testing...' : backendStatus?.isHealthy === true ? 'AI Connected' : backendStatus?.isHealthy === false ? 'AI Offline' : 'Test AI'}
              </button>
              <button className="quick-action-btn" onClick={handleShowSettings}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                Settings
              </button>
              <button className="quick-action-btn" onClick={handleShowNotifications}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                Notifications
              </button>
            </div>

            <div className="sidebar-section">
              <button className="quick-action-btn history-btn" onClick={handleShowHistory}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v5h5"></path>
                  <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"></path>
                  <path d="M12 7v5l4 2"></path>
                </svg>
                History
              </button>
            </div>
          </div>
          <div className="sidebar-footer">
            <button className="theme-toggle" onClick={toggleTheme}>
              {isDark ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
            <button className="logout-btn-animated" onClick={handleLogout}>
              <div className="logout-icon-container">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 1024 1024"
                  height="20px"
                  width="20px"
                >
                  <path
                    d="M224 480h640a32 32 0 1 1 0 64H224a32 32 0 0 1 0-64z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="m237.248 512 265.408 265.344a32 32 0 0 1-45.312 45.312l-288-288a32 32 0 0 1 0-45.312l288-288a32 32 0 1 1 45.312 45.312L237.248 512z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <p className="logout-text">Logout</p>
            </button>
          </div>
        </div>

        <div className="chat-main">
          <div className="chat-messages">
            {messages.map((message) => (
              <div key={message.id} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.type === 'bot' && (
                    <div className="bot-avatar">
                      <img src="/Q-bot/images/logos/Q-bot_logo.png" alt="Q-bot" />
                    </div>
                  )}
                  <div className={`message-bubble ${message.isTyping ? 'typing' : ''}`}>
                    <p>{message.content}</p>
                    {!message.isTyping && (
                      <span className="message-time">
                        {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-area">
            {/* Connection Status */}
            {backendStatus && (
              <div className={`connection-status ${backendStatus.isHealthy ? 'connected' : 'disconnected'}`}>
                <div className="status-indicator">
                  <div className={`status-dot ${backendStatus.isHealthy ? 'online' : 'offline'}`}></div>
                  <span className="status-text">
                    {backendStatus.isHealthy ? 'AI Connected' : 'AI Offline'}
                  </span>
                </div>
                <span className="status-message">{backendStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSendMessage} className="message-form">
              <div className="messageBox">
                <div className="fileUploadWrapper">
                  <button type="button" onClick={handleFileUpload} className="file-upload-trigger">
                    <svg viewBox="0 0 337 337" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle
                        cx="168.5"
                        cy="168.5"
                        r="158.5"
                        fill="none"
                        stroke="#6c6c6c"
                        strokeWidth="20"
                      />
                      <path
                        d="M167.759 79V259"
                        stroke="#6c6c6c"
                        strokeWidth="25"
                        strokeLinecap="round"
                      />
                      <path
                        d="M79 167.138H259"
                        stroke="#6c6c6c"
                        strokeWidth="25"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="tooltip">Upload files</span>
                  </button>
                </div>
                <input
                  id="messageInput"
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Message..."
                  required
                />
                <button id="sendButton" type="submit">
                  <svg viewBox="0 0 664 663" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M646.293 331.888L17.7538 17.6187L155.245 331.888M646.293 331.888L17.753 646.157L155.245 331.888M646.293 331.888L318.735 330.228L155.245 331.888"
                      fill="none"
                    />
                    <path
                      d="M646.293 331.888L17.7538 17.6187L155.245 331.888M646.293 331.888L17.753 646.157L155.245 331.888M646.293 331.888L318.735 330.228L155.245 331.888"
                      stroke="#6c6c6c"
                      strokeWidth="33.67"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <ConversationHistory
        isOpen={showHistory}
        onClose={handleCloseHistory}
        onSelectConversation={handleSelectConversation}
      />

      <Settings
        isOpen={showSettings}
        onClose={handleCloseSettings}
      />

      <Notifications
        isOpen={showNotifications}
        onClose={handleCloseNotifications}
      />
    </div>
  )
}

export default Dashboard
