import axios from 'axios'
import { API_BASE_URL, ERROR_MESSAGES, TIME_CONSTANTS } from '../utils/constants'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIME_CONSTANTS.API_TIMEOUT,
  withCredentials: true, // Include HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // Cookies are automatically included with withCredentials: true
    
    // If we're sending FormData, remove the Content-Type header 
    // to let the browser set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    console.error('Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for handling token refresh and errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Skip token refresh for outsider routes - they use temp access tokens
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      if (currentPath.includes('outsider')) {
        console.log('Outsider route 401 - not attempting token refresh')
        return Promise.reject(error)
      }
      
      try {
        // Try to refresh the token
        await api.post('/auth/token/refresh/')
        
        // Retry the original request
        return api.request(originalRequest)
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError)
        
        // Clear any stored user data
        localStorage.removeItem('user_data')
        
        // Redirect to appropriate login page based on current location
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname
          if (currentPath.includes('outsider')) {
            window.location.href = '/outsider-login'
          } else {
            window.location.href = '/login'
          }
        }
        
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// API Error Handler
export const handleApiError = (error) => {
  console.error('API Error:', error)
  console.error('API Error Response:', error.response?.data)
  console.error('API Error Response Details:', JSON.stringify(error.response?.data, null, 2))
  
  if (!error.response) {
    // Network error
    return {
      message: ERROR_MESSAGES.NETWORK_ERROR,
      type: 'network'
    }
  }
  
  const { status, data } = error.response
  
  switch (status) {
    case 400:
      // Validation errors
      return {
        message: data.detail || ERROR_MESSAGES.VALIDATION_ERROR,
        errors: data,
        type: 'validation'
      }
    case 401:
      return {
        message: data.detail || ERROR_MESSAGES.UNAUTHORIZED,
        type: 'auth'
      }
    case 403:
      return {
        message: data.detail || ERROR_MESSAGES.FORBIDDEN,
        type: 'permission'
      }
    case 404:
      return {
        message: data.detail || ERROR_MESSAGES.NOT_FOUND,
        type: 'not_found'
      }
    case 500:
      return {
        message: data.detail || ERROR_MESSAGES.SERVER_ERROR,
        type: 'server'
      }
    default:
      return {
        message: data.detail || 'An unexpected error occurred',
        type: 'unknown'
      }
  }
}

// Generic API methods
export const apiMethods = {
  // GET request
  get: async (url, config = {}) => {
    try {
      const response = await api.get(url, config)
      return { data: response.data, success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { error: errorDetails, success: false }
    }
  },

  // POST request
  post: async (url, data = {}, config = {}) => {
    try {
      const response = await api.post(url, data, config)
      return { data: response.data, success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { error: errorDetails, success: false }
    }
  },

  // PUT request
  put: async (url, data = {}, config = {}) => {
    try {
      const response = await api.put(url, data, config)
      return { data: response.data, success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { error: errorDetails, success: false }
    }
  },

  // PATCH request
  patch: async (url, data = {}, config = {}) => {
    try {
      const response = await api.patch(url, data, config)
      return { data: response.data, success: true }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { error: errorDetails, success: false }
    }
  },

  // DELETE request
  delete: async (url, config = {}) => {
    try {
      const response = await api.delete(url, config)
      // Handle 204 No Content responses (successful deletion)
      return { 
        data: response.status === 204 ? { message: 'Deleted successfully' } : response.data, 
        success: true 
      }
    } catch (error) {
      const errorDetails = handleApiError(error)
      return { error: errorDetails, success: false }
    }
  }
}

export default api 