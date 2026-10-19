// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173'

// Paystack Configuration
export const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || 'your-paystack-public-key'

// User Roles
export const USER_ROLES = {
  STUDENT: 'student',
  LECTURER: 'lecturer',
  REGISTRAR: 'registrar',
  OUTSIDER: 'outsider'
}

// Booking Statuses
export const BOOKING_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  DENIED: 'denied',
  PAID: 'paid'
}

// Event Types
export const EVENT_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

// Invitation Statuses
export const INVITATION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined'
}

// Payment Statuses
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  SUCCESSFUL: 'successful',
  FAILED: 'failed'
}

// Navigation Routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  BOOKING: {
    CREATE: '/booking/create',
    STATUS: '/booking/status',
    OUTSIDER: '/booking/outsider'
  },
  EVENTS: {
    FOR_YOU: '/events/for-you',
    PUBLIC: '/events/public',
    INVITED: '/events/invited',
    CREATE: '/events/create'
  },
  ACADEMIC: {
    DASHBOARD: '/academic/dashboard',
    BOOK_VENUE: '/academic/book-venue',
    BOOKINGS: '/academic/my-bookings',
    BOOKING: {
      CREATE: '/academic/booking/create',
      STATUS: '/academic/booking/status'
    }
  },
  REGISTRAR: {
    DASHBOARD: '/registrar/dashboard',
    BOOKINGS: '/registrar/bookings',
    PAYMENTS: '/registrar/payments',
    EVENTS: '/registrar/events',
    CALENDAR: '/registrar/calendar',
    VENUES: '/auditoriums',
    EVENTS_FOR_YOU: '/registrar/events/for-you',
    INVITED_EVENTS: '/registrar/events/invited',
    ALL_EVENTS: '/registrar/events/all'
  }
}

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language'
}

// Validation Rules
export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 8,
  SCHOOL_ID_LENGTH: 11,
  PHONE_MIN_LENGTH: 10,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  SUPPORTED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
}

// Time Constants
export const TIME_CONSTANTS = {
  DEBOUNCE_DELAY: 300,
  API_TIMEOUT: 30000,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes
  NOTIFICATION_DURATION: 5000
}

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied. You do not have permission to view this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  LOGIN_REQUIRED: 'Please login to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logout successful!',
  REGISTRATION_SUCCESS: 'Registration successful!',
  BOOKING_CREATED: 'Booking request submitted successfully!',
  BOOKING_APPROVED: 'Booking approved successfully!',
  BOOKING_DENIED: 'Booking denied successfully!',
  PAYMENT_SUCCESS: 'Payment completed successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
  EVENT_CREATED: 'Event created successfully!',
  INVITATION_SENT: 'Invitation sent successfully!'
}

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

// Date/Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMMM dd, yyyy',
  INPUT: 'yyyy-MM-dd',
  SHORT: 'MMM dd',
  LONG: 'EEEE, MMMM dd, yyyy'
}

export const TIME_FORMATS = {
  DISPLAY: 'h:mm a',
  INPUT: 'HH:mm',
  FULL: 'h:mm:ss a'
}

// Breakpoints (for responsive design)
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px'
}

// Default Pagination
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
}

// Email Domains (for validation)
export const UNIVERSITY_EMAIL_DOMAINS = [
  'university.edu.gh',
  'st.university.edu.gh',
  'staff.university.edu.gh'
]

// Event Tags (categories)
export const EVENT_TAGS = [
  { id: 1, name: 'Academic', color: 'blue' },
  { id: 2, name: 'Sports', color: 'green' },
  { id: 3, name: 'Cultural', color: 'purple' },
  { id: 4, name: 'Technology', color: 'indigo' },
  { id: 5, name: 'Health', color: 'pink' },
  { id: 6, name: 'Environment', color: 'emerald' },
  { id: 7, name: 'Business', color: 'orange' },
  { id: 8, name: 'Arts', color: 'rose' }
] 