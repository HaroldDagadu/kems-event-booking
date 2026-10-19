import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with clsx and merges Tailwind classes with tailwind-merge
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Format currency for display
 */
export function formatCurrency(amount, currency = 'GHS') {
  const num = parseFloat(amount)
  if (isNaN(num)) return `${currency} 0.00`
  
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(num)
}

/**
 * Format date for display
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date))
}

/**
 * Format time for display
 */
export function formatTime(time) {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(`2000-01-01T${time}`))
}

/**
 * Calculate duration between two times
 */
export function calculateDuration(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  const diffMs = end - start
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours.toFixed(1)
}

/**
 * Generate a unique payment reference
 */
export function generatePaymentReference(bookingId) {
  const timestamp = Math.floor(Date.now() / 1000)
  return `booking_${bookingId}_${timestamp}`
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (Ghana)
 */
export function isValidGhanaPhone(phone) {
  const phoneRegex = /^(\+233|0)[2-9]\d{8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Get user initials from full name
 */
export function getUserInitials(fullName) {
  if (!fullName) return '??'
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .substring(0, 2)
}

/**
 * Capitalize first letter of each word
 */
export function capitalizeWords(str) {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Get role badge color
 */
export function getRoleBadgeColor(role) {
  switch (role?.toLowerCase()) {
    case 'student':
      return 'bg-blue-100 text-blue-800'
    case 'lecturer':
      return 'bg-green-100 text-green-800'
    case 'registrar':
      return 'bg-purple-100 text-purple-800'
    case 'outsider':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Get booking status badge color
 */
export function getStatusBadgeColor(status) {
  switch (status?.toLowerCase()) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'approved':
      return 'bg-green-100 text-green-800'
    case 'denied':
      return 'bg-red-100 text-red-800'
    case 'paid':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Check if user has permission for certain actions
 */
export function checkPermission(userRole, requiredRoles) {
  if (!userRole || !Array.isArray(requiredRoles)) return false
  return requiredRoles.includes(userRole.toLowerCase())
}

/**
 * Debounce function for search inputs
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
} 