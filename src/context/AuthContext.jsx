import { createContext, useContext, useReducer, useEffect } from 'react';
import { firebaseAuthService } from '../services/firebaseAuth';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  LOAD_USER: 'LOAD_USER',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING'
};

// Reducer function
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOAD_USER:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: !!action.payload.token,
        isLoading: false
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    default:
      return state;
  }
}

// Create context
const AuthContext = createContext();

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Firebase auth state listener
  useEffect(() => {
    console.log('🔥 Setting up Firebase auth state listener');
    const unsubscribe = firebaseAuthService.onAuthStateChanged(async (user) => {
      console.log('🔥 Auth state changed:', user ? `User: ${user.email} (UID: ${user.uid})` : 'No user');

      if (user) {
        // User is signed in
        try {
          console.log('🔥 User object details:', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
            providerData: user.providerData
          });

          const userData = {
            uid: user.uid,
            email: user.email,
            firstName: user.displayName ? user.displayName.split(' ')[0] : '',
            lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
            displayName: user.displayName || ''
          };

          console.log('🔑 Getting ID token...');
          const token = await user.getIdToken();
          console.log('✅ Loading user data:', userData);
          console.log('🔑 Token generated:', token ? `Token exists (${token.substring(0, 20)}...)` : 'No token');

          dispatch({
            type: AUTH_ACTIONS.LOAD_USER,
            payload: {
              user: userData,
              token: token
            }
          });
          console.log('✅ User loaded successfully, isAuthenticated should be true');
        } catch (error) {
          console.error('❌ Error loading user data:', error);
          console.error('❌ Error details:', error.message);
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } else {
        // User is signed out
        console.log('🚪 User signed out, dispatching logout');
        console.log('🚪 Current auth state before logout:', state.isAuthenticated);
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    });

    return () => {
      console.log('🔥 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await firebaseAuthService.login(credentials.email, credentials.password);

      if (response.success) {
        // Don't dispatch LOGIN_SUCCESS here - let the onAuthStateChanged listener handle it
        // This prevents race conditions and duplicate state updates
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });

    try {
      const response = await firebaseAuthService.register(
        userData.email,
        userData.password,
        userData.firstName || 'John',
        userData.lastName || ''
      );

      if (response.success) {
        // Don't dispatch REGISTER_SUCCESS here - let the onAuthStateChanged listener handle it
        // This prevents race conditions and duplicate state updates
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await firebaseAuthService.logout();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    } catch (error) {
      console.error('Logout error:', error);
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Google login function
  const googleLogin = async () => {
    console.log('🔵 Starting Google login...');
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await firebaseAuthService.googleLogin();
      console.log('🔵 Google login response:', response);

      if (response.success) {
        console.log('✅ Google login successful, waiting for auth state change...');
        // Don't dispatch LOGIN_SUCCESS here - let the onAuthStateChanged listener handle it
        // This prevents race conditions and duplicate state updates
        return response;
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Google login error:', error);
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: error.message
      });
      throw error;
    }
  };

  // Password reset function
  const resetPassword = async (email) => {
    try {
      const response = await firebaseAuthService.resetPassword(email);
      return response;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  };

  // Context value
  const value = {
    ...state,
    login,
    register,
    logout,
    clearError,
    googleLogin,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
