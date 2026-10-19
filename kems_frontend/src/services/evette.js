/**
 * Evette AI Chatbot Service
 * Handles API calls for the Evette chatbot functionality
 */

import { apiMethods } from './api'

export const evetteService = {
  /**
   * Send message to Evette chatbot
   * @param {Object} messageData - { message: string }
   */
  sendMessage: async (messageData) => {
    return await apiMethods.post('/evette/chat/', messageData)
  },

  /**
   * Get conversation history with Evette
   */
  getConversationHistory: async () => {
    return await apiMethods.get('/evette/history/')
  },

  /**
   * Get AI-powered personalized event recommendations
   */
  getPersonalizedEvents: async () => {
    return await apiMethods.get('/evette/recommendations/')
  },

  /**
   * Get user's event preferences
   */
  getUserPreferences: async () => {
    return await apiMethods.get('/evette/preferences/')
  },

  /**
   * Update user's event preferences
   * @param {Object} preferencesData - { tag_ids: number[] }
   */
  updateUserPreferences: async (preferencesData) => {
    return await apiMethods.put('/evette/preferences/update/', preferencesData)
  }
}