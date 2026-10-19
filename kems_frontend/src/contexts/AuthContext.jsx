import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react'
import { authService } from '../services/auth'
import { STORAGE_KEYS, USER_ROLES } from '../utils/constants'

// Initial auth state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
}

// Auth action types
const AUTH_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERROR: 'CLEAR_ERROR'
}

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.LOGIN_ERROR:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      }
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      }
    
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: action.payload
      }
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      }
    
    default:
      return state
  }
}

// Create auth context
const AuthContext = createContext(null)

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check authentication status (can be called manually)
  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const result = await authService.checkAuth()
      
      if (result.success && result.data.authenticated) {
        const userData = result.data.user
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData })
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER_DATA)
        dispatch({ type: AUTH_ACTIONS.LOGOUT })
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      // Don't crash the app, just set as not authenticated
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    } finally {
      // Ensure loading is set to false even if there's an error
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
    }
  }, [])

  // Initialize auth state without auto-checking
  useEffect(() => {
    // Just set loading to false initially, let components decide when to check auth
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
  }, [])

  // Login function
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const result = await authService.login(credentials)
      
      if (result.success) {
        const userData = result.data.user
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData })
        return { success: true, data: userData }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: result.error.message })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Login failed. Please try again.'
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage })
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  // Register function
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const result = await authService.register(userData)
      
      if (result.success) {
        // After successful registration, user might need to login
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false })
        return { success: true, data: result.data }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: result.error.message })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Registration failed. Please try again.'
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage })
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  // Outsider login function
  const outsiderLogin = useCallback(async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true })
      
      const result = await authService.outsiderLogin(credentials)
      
      if (result.success) {
        // For outsiders, we might get booking request data instead of user data
        const userData = {
          id: null,
          email: credentials.username,
          full_name: 'Temporary User',
          role: USER_ROLES.OUTSIDER,
          booking_request: result.data.booking_request
        }
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
        dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: userData })
        return { success: true, data: result.data }
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: result.error.message })
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Outsider login failed. Please check your credentials.'
      dispatch({ type: AUTH_ACTIONS.LOGIN_ERROR, payload: errorMessage })
      return { success: false, error: { message: errorMessage } }
    }
  }, [])

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem(STORAGE_KEYS.USER_DATA)
      dispatch({ type: AUTH_ACTIONS.LOGOUT })
    }
  }, [])

  // Update user profile
  const updateUser = useCallback(async (userData) => {
    try {
      const result = await authService.updateProfile(userData)
      
      if (result.success) {
        const updatedUser = { ...state.user, ...result.data }
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(updatedUser))
        dispatch({ type: AUTH_ACTIONS.UPDATE_USER, payload: updatedUser })
        return { success: true, data: updatedUser }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: { message: 'Profile update failed' } }
    }
  }, [state.user])

  // Change password
  const changePassword = useCallback(async (passwordData) => {
    try {
      const result = await authService.changePassword(passwordData)
      return result
    } catch (error) {
      return { success: false, error: { message: 'Password change failed' } }
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR })
  }, [])

  // Helper functions for role checking
  const isStudent = useCallback(() => state.user?.role === USER_ROLES.STUDENT, [state.user?.role])
  const isLecturer = useCallback(() => state.user?.role === USER_ROLES.LECTURER, [state.user?.role])
  const isRegistrar = useCallback(() => state.user?.role === USER_ROLES.REGISTRAR, [state.user?.role])
  const isOutsider = useCallback(() => state.user?.role === USER_ROLES.OUTSIDER, [state.user?.role])
  const isInsider = useCallback(() => [USER_ROLES.STUDENT, USER_ROLES.LECTURER, USER_ROLES.REGISTRAR].includes(state.user?.role), [state.user?.role])

  // Context value - memoized to prevent unnecessary re-renders
  const value = useMemo(() => ({
    ...state,
    login,
    register,
    outsiderLogin,
    logout,
    updateUser,
    changePassword,
    clearError,
    checkAuthStatus,
    isStudent,
    isLecturer,
    isRegistrar,
    isOutsider,
    isInsider
  }), [
    state,
    login,
    register,
    outsiderLogin,
    logout,
    updateUser,
    changePassword,
    clearError,
    checkAuthStatus,
    isStudent,
    isLecturer,
    isRegistrar,
    isOutsider,
    isInsider
  ])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

export default AuthContext 