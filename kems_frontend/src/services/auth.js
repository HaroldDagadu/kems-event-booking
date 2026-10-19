import { apiMethods } from './api'

// Authentication Service
export const authService = {
  // Insider Registration
  register: async (userData) => {
    return await apiMethods.post('/auth/register/', userData)
  },

  // Insider Login
  login: async (credentials) => {
    return await apiMethods.post('/auth/login/', credentials)
  },

  // Outsider Temporary Login
  outsiderLogin: async (credentials) => {
    return await apiMethods.post('/auth/outsider-login/', credentials)
  },

  // Logout
  logout: async () => {
    return await apiMethods.post('/auth/logout/')
  },

  // Check Authentication Status
  checkAuth: async () => {
    return await apiMethods.get('/auth/check-auth/')
  },

  // Get User Profile
  getProfile: async () => {
    return await apiMethods.get('/auth/me/')
  },

  // Update User Profile
  updateProfile: async (profileData) => {
    return await apiMethods.put('/auth/me/', profileData)
  },

  // Change Password
  changePassword: async (passwordData) => {
    return await apiMethods.post('/auth/change-password/', passwordData)
  },

  // Token Refresh (handled automatically by interceptors)
  refreshToken: async () => {
    return await apiMethods.post('/auth/token/refresh/')
  }
}

export default authService 