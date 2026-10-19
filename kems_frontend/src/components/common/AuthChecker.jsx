import { useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

/**
 * AuthChecker Component
 * 
 * This component handles automatic authentication checking based on the current route.
 * It runs inside the Router context and skips auth checks on authentication-related pages.
 */
function AuthChecker() {
  const location = useLocation()
  const { checkAuthStatus, isAuthenticated, loading } = useAuth()
  
  // Define routes where we shouldn't auto-check authentication
  const authRoutes = ['/login', '/register', '/outsider-login', '/outsider-dashboard', '/booking/outsider', '/events/public', '/payment']
  
  // Memoize the auth check function to prevent unnecessary re-renders
  const performAuthCheck = useCallback(async () => {
    // Check if current route should skip auth check
    const shouldSkipAuth = authRoutes.includes(location.pathname) || 
                          location.pathname.startsWith('/payment') || 
                          location.pathname.startsWith('/outsider')
    
    if (!shouldSkipAuth && !isAuthenticated && !loading) {
      try {
        // Add a small delay to ensure the app is fully loaded
        setTimeout(() => {
          checkAuthStatus()
        }, 100)
      } catch (error) {
        console.error('AuthChecker error:', error)
        // Don't let the error crash the app
      }
    }
  }, [location.pathname, isAuthenticated, loading, checkAuthStatus, authRoutes])
  
  useEffect(() => {
    performAuthCheck()
  }, [performAuthCheck])
  
  // This component doesn't render anything
  return null
}

export default AuthChecker 