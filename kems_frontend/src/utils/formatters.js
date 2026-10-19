/**
 * Utility functions for formatting data display
 */

/**
 * Format currency amount
 * @param {number|string} amount - Amount to format
 * @param {string} currency - Currency code (default: GHS)
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currency = 'GHS') {
  if (!amount || amount === 0) return `${currency} 0.00`
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numAmount)
}

/**
 * Format date string
 * @param {string} dateString - ISO date string
 * @param {string} format - Date format (default: 'short')
 * @returns {string} Formatted date string
 */
export function formatDate(dateString, format = 'short') {
  if (!dateString) return 'N/A'
  
  const date = new Date(dateString)
  
  if (isNaN(date.getTime())) return 'Invalid Date'
  
  switch (format) {
    case 'full':
      return date.toLocaleDateString('en-GH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'long':
      return date.toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    case 'medium':
      return date.toLocaleDateString('en-GH', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    case 'short':
    default:
      return date.toLocaleDateString('en-GH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
  }
}

/**
 * Format time string
 * @param {string} timeString - Time string in HH:MM:SS format
 * @returns {string} Formatted time string
 */
export function formatTime(timeString) {
  if (!timeString) return 'N/A'
  
  try {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  } catch (error) {
    return timeString
  }
}

/**
 * Format duration in hours
 * @param {number} hours - Duration in hours
 * @returns {string} Formatted duration string
 */
export function formatDuration(hours) {
  if (!hours || hours === 0) return '0hrs'
  
  if (hours === 1) return '1 hour'
  if (hours < 24) return `${hours} hours`
  
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  
  if (remainingHours === 0) {
    return days === 1 ? '1 day' : `${days} days`
  }
  
  return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
}

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Capitalize first letter of each word
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalizeWords(str) {
  if (!str) return ''
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  )
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

/**
 * Format phone number
 * @param {string} phone - Phone number string
 * @returns {string} Formatted phone number
 */
export function formatPhoneNumber(phone) {
  if (!phone) return ''
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  // Format Ghana phone number
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return `+233 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7)}`
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('233')) {
    return `+233 ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)} ${cleaned.substring(9)}`
  }
  
  return phone
}

/**
 * Format status for display
 * @param {string} status - Status string
 * @returns {string} Formatted status
 */
export function formatStatus(status) {
  if (!status) return 'Unknown'
  
  return status
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
} 