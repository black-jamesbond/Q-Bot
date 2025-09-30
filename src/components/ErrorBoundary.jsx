import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-content">
            <h1>🔥 Firebase Setup Required</h1>
            <p>The application needs Firebase services to be configured.</p>
            
            <div className="error-details">
              <h3>Required Steps:</h3>
              <ol>
                <li>
                  <strong>Enable Authentication:</strong>
                  <br />
                  <a 
                    href="https://console.firebase.google.com/project/king-58c2a/authentication" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Go to Firebase Authentication
                  </a>
                  <br />
                  Enable Email/Password and Google Sign-In
                </li>
                <li>
                  <strong>Create Firestore Database:</strong>
                  <br />
                  <a 
                    href="https://console.firebase.google.com/project/king-58c2a/firestore" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Go to Firestore Database
                  </a>
                  <br />
                  Create database in test mode
                </li>
              </ol>
            </div>

            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              Retry After Setup
            </button>

            {process.env.NODE_ENV === 'development' && (
              <details className="error-technical">
                <summary>Technical Details</summary>
                <pre>{this.state.error && this.state.error.toString()}</pre>
                <pre>{this.state.errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
