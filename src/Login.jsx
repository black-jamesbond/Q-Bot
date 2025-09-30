import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import { handleApiError, validateForm } from './utils/errorHandler'
import './App.css'
import './DarkTheme.css'

function Login() {
  const { login, isLoading, error, clearError, isAuthenticated, googleLogin, resetPassword } = useAuth()
  const { theme, isDark } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resetMessage, setResetMessage] = useState('')

  // Ensure theme is applied on component mount
  useEffect(() => {
    // Force theme application to document root
    document.documentElement.setAttribute('data-theme', theme)
    // Also set it on the body for extra coverage
    document.body.setAttribute('data-theme', theme)
    // Force a style recalculation
    document.documentElement.style.setProperty('--force-recalc', Math.random().toString())
  }, [theme])

  // Additional effect to ensure theme is applied immediately
  useEffect(() => {
    const savedTheme = localStorage.getItem('qbot-theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    document.body.setAttribute('data-theme', savedTheme)
  }, [])

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  // Clear errors when auth error changes
  useEffect(() => {
    if (error) {
      setErrors({ general: handleApiError(error) })
    }
  }, [error])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateLoginForm = () => {
    return validateForm(formData, {
      email: { required: true, email: true, label: 'Email' },
      password: { required: true, minLength: 6, label: 'Password' }
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Clear any previous errors
    clearError()
    setErrors({})
    setResetMessage('')

    const newErrors = validateLoginForm()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      await login(formData)
      // Navigation will be handled by useEffect when isAuthenticated changes
    } catch (error) {
      // Error is handled by the auth context and useEffect
      console.error('Login failed:', error)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      clearError()
      setErrors({})
      setResetMessage('')
      await googleLogin()
    } catch (error) {
      console.error('Google login error:', error)
      setErrors({
        general: 'Google login failed. Please try again.'
      })
    }
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email address first' })
      return
    }

    try {
      const response = await resetPassword(formData.email)
      if (response.success) {
        setResetMessage('Password reset email sent! Check your inbox.')
        setShowResetPassword(false)
      } else {
        setErrors({ general: response.message })
      }
    } catch (error) {
      console.error('Password reset error:', error)
      setErrors({ general: 'Failed to send password reset email' })
    }
  }

  return (
    <div className={`login-container ${theme === 'dark' ? 'dark-theme' : ''}`} data-theme={theme}>
      <div
        className={`login-card ${theme === 'dark' ? 'dark-theme' : ''}`}
        data-theme={theme}
        style={theme === 'dark' ? {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#ffffff'
        } : {}}
      >
        <div className="logo-container">
          <img src="/Q-bot/images/logos/Q-bot_logo.png" alt="Q-bot Logo" className="login-logo" />
        </div>
        <h1 style={theme === 'dark' ? { color: '#ffffff' } : {}}>Q-bot</h1>
        <p className="login-subtitle" style={theme === 'dark' ? { color: '#b3b3b3' } : {}}>Please sign in to your account</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
            </div>
          )}

          {resetMessage && (
            <div className="success-message">
              {resetMessage}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>
          
          <div className="form-group form-group-last">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
            />
            {errors.password && (
              <div className="error-message">{errors.password}</div>
            )}
          </div>
          
          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div style={{margin: '1.5rem 0'}}></div>

        <button
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
        
        <div className="login-footer">
          <button
            type="button"
            className="forgot-password"
            onClick={handleForgotPassword}
            disabled={isLoading}
          >
            Forgot your password?
          </button>
          <div className="create-account-section">
            <span className="create-account-text">Don't have an account? </span>
            <Link to="/register" className="create-account-link">Create account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
