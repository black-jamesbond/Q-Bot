import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useTheme } from './context/ThemeContext'
import './App.css'
import './DarkTheme.css'

function Register() {
  const { register, isLoading: authLoading, error: authError, clearError, isAuthenticated, googleLogin } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '' // Optional field, will default to 'John' on backend if empty
  })
  const [errors, setErrors] = useState({})
  const [showPasswordStep, setShowPasswordStep] = useState(false)

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
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      if (authError.includes('already exists') || authError.includes('already registered')) {
        setErrors({
          email: 'An account with this email already exists. Please try logging in instead.'
        })
        setShowPasswordStep(false)
      } else if (authError.includes('password')) {
        setErrors({ password: authError })
      } else if (authError.includes('email')) {
        setErrors({ email: authError })
        setShowPasswordStep(false)
      } else {
        setErrors({ general: authError })
      }
    }
  }, [authError])

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
    // Clear auth error when user starts typing
    if (authError) {
      clearError()
    }
  }

  const validateEmail = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid'
    }

    return newErrors
  }

  const validatePassword = () => {
    const newErrors = {}

    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long'
    }

    return newErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Step 1: Email validation and show password field
    if (!showPasswordStep) {
      const emailErrors = validateEmail()
      if (Object.keys(emailErrors).length > 0) {
        setErrors(emailErrors)
        return
      }

      // Email is valid, show password step
      setErrors({})
      setShowPasswordStep(true)
      return
    }

    // Step 2: Password validation and registration
    const passwordErrors = validatePassword()
    if (Object.keys(passwordErrors).length > 0) {
      setErrors(passwordErrors)
      return
    }

    setErrors({})
    clearError()

    try {
      // Use the auth context register method
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined // Let backend handle default
      })

      // Registration successful - navigation will be handled by useEffect
      console.log('Registration successful')
    } catch (error) {
      console.error('Registration error:', error)
      // Error handling is done in useEffect for authError
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setErrors({})
      clearError()

      // Use the auth context Google login method
      await googleLogin()

    } catch (error) {
      console.error('Google login error:', error)
      setErrors({
        general: 'Google login failed. Please try again or use email registration.'
      })
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
        <h1 style={theme === 'dark' ? { color: '#ffffff' } : {}}>Create Account</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          {errors.general && (
            <div className="error-message general-error">
              {errors.general}
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
              onKeyPress={handleKeyPress}
              className={errors.email ? 'error' : ''}
              disabled={authLoading || showPasswordStep}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <div className="error-message">{errors.email}</div>
            )}
          </div>

          {showPasswordStep && (
            <div className="form-group form-group-last password-step">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                className={errors.password ? 'error' : ''}
                disabled={authLoading}
                placeholder="Enter your password"
                autoFocus
              />
              {errors.password && (
                <div className="error-message">{errors.password}</div>
              )}
            </div>
          )}
          
          <button
            type="submit"
            className="login-button"
            disabled={authLoading}
          >
            {authLoading
              ? (showPasswordStep ? 'Creating Account...' : 'Validating...')
              : (showPasswordStep ? 'Create Account' : 'Continue')
            }
          </button>
        </form>

        <div style={{margin: '2rem 0'}}></div>

        <button
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={authLoading}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Login with Google
        </button>
        
        <div className="login-footer">
          <div className="create-account-section">
            <span className="create-account-text">Already have an account? </span>
            <Link to="/" className="create-account-link">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
