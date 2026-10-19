import { apiMethods } from './api'

/**
 * Booking Service
 * Handles all booking-related API calls for KEMS system
 */
export const bookingService = {
  /**
   * Get Available Auditoriums
   * Returns list of auditoriums with pricing information
   */
  getAuditoriums: async () => {
    try {
      const result = await apiMethods.get('/auditoriums/')
      return result
    } catch (error) {
      console.error('Error fetching auditoriums:', error)
      return { success: false, error: { message: 'Failed to fetch auditoriums' } }
    }
  },

  /**
   * Create Outsider Booking Request
   * @param {Object} bookingData - Complete outsider booking payload
   * @param {string} bookingData.event_name - Name of the event
   * @param {string} bookingData.purpose - Event purpose/description
   * @param {number} bookingData.venue - Auditorium ID
   * @param {string} bookingData.desired_date - Date in YYYY-MM-DD format
   * @param {string} bookingData.start_time - Time in HH:MM:SS format
   * @param {string} bookingData.duration_hours - Duration as decimal string
   * @param {string} bookingData.event_type - 'public' or 'private'
   * @param {Object} bookingData.organization - Organization details
   * @param {string} bookingData.requester_full_name - Requester's full name
   * @param {string} bookingData.requester_position - Requester's position
   * @param {string} bookingData.requester_contact_number - Requester's contact
   * @param {string} bookingData.requester_email - Requester's email
   */
  createOutsiderBooking: async (bookingData) => {
    try {
      console.log('Creating outsider booking with data:', bookingData)
      
      // Validate required fields
      const requiredFields = [
        'event_name', 'purpose', 'venue', 'desired_date', 'start_time', 'end_time',
        'duration_hours', 'event_type', 'organization', 'requester_full_name', 
        'requester_position', 'requester_contact_number', 'requester_email'
      ]
      
      for (const field of requiredFields) {
        if (!bookingData[field]) {
          console.error(`Missing required field: ${field}`)
          return { success: false, error: { message: `${field} is required` } }
        }
      }

      // Additional validation for organization.name
      if (!bookingData.organization?.name) {
        console.error('Missing required field: organization.name')
        return { success: false, error: { message: 'Organization name is required' } }
      }

      console.log('All required fields present, sending request...')
      const result = await apiMethods.post('/bookings/outsider/', bookingData)
      console.log('Booking creation result:', result)
      
      if (!result.success && result.error?.errors) {
        console.error('Validation errors breakdown:', JSON.stringify(result.error.errors, null, 2))
      }
      
      return result
    } catch (error) {
      console.error('Error creating outsider booking:', error)
      return { success: false, error: { message: 'Failed to create booking request' } }
    }
  },

  /**
   * Create Insider Booking Request
   * @param {Object} bookingData - Insider booking payload
   * @param {string} bookingData.event_name - Name of the event
   * @param {string} bookingData.purpose - Event purpose/description
   * @param {number} bookingData.venue - Auditorium ID
   * @param {string} bookingData.desired_date - Date in YYYY-MM-DD format
   * @param {string} bookingData.start_time - Time in HH:MM:SS format
   * @param {string} bookingData.duration_hours - Duration as decimal string
   * @param {string} bookingData.event_type - 'public' or 'private'
   */
  createInsiderBooking: async (bookingData) => {
    try {
      // Validate required fields
      const requiredFields = [
        'event_name', 'purpose', 'venue', 'desired_date', 
        'start_time', 'duration_hours', 'event_type'
      ]
      
      for (const field of requiredFields) {
        if (!bookingData[field]) {
          return { success: false, error: { message: `${field} is required` } }
        }
      }

      const result = await apiMethods.post('/bookings/insider/', bookingData)
      return result
    } catch (error) {
      console.error('Error creating insider booking:', error)
      return { success: false, error: { message: 'Failed to create booking request' } }
    }
  },

  /**
   * Get Insider Booking Status
   * Returns all booking requests for the authenticated user
   */
  getInsiderBookingStatus: async () => {
    try {
      const result = await apiMethods.get('/bookings/insider/status/')
      return result
    } catch (error) {
      console.error('Error fetching booking status:', error)
      return { success: false, error: { message: 'Failed to fetch booking status' } }
    }
  },

  /**
   * Get specific booking details
   * @param {number} bookingId - Booking request ID
   */
  getBookingDetails: async (bookingId) => {
    try {
      const result = await apiMethods.get(`/bookings/${bookingId}/`)
      return result
    } catch (error) {
      console.error('Error fetching booking details:', error)
      return { success: false, error: { message: 'Failed to fetch booking details' } }
    }
  }
}

/**
 * Registrar Booking Management Service
 * Handles registrar-specific booking operations
 */
export const registrarBookingService = {
  // Get Dashboard Statistics
  getDashboardStats: async () => {
    try {
      const result = await apiMethods.get('/registrar/dashboard/stats/')
      return result
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      return { success: false, error: { message: 'Failed to fetch dashboard statistics' } }
    }
  },

  // Get All Booking Requests (with pagination)
  getAllBookings: async (page = 1, pageSize = 10, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...filters
      })
      const result = await apiMethods.get(`/registrar/bookings/?${params}`)
      return result
    } catch (error) {
      console.error('Error fetching all bookings:', error)
      return { success: false, error: { message: 'Failed to fetch bookings' } }
    }
  },

  // Get Booking Request Details
  getBookingDetails: async (bookingId) => {
    try {
      const result = await apiMethods.get(`/registrar/bookings/${bookingId}/`)
      return result
    } catch (error) {
      console.error('Error fetching booking details:', error)
      return { success: false, error: { message: 'Failed to fetch booking details' } }
    }
  },

  // Update Booking Request (Approve/Deny)
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      const result = await apiMethods.put(`/registrar/bookings/${bookingId}/`, statusData)
      return result
    } catch (error) {
      console.error('Error updating booking status:', error)
      return { success: false, error: { message: 'Failed to update booking status' } }
    }
  },

  // Update Auditorium Prices
  updateAuditoriumPrices: async (auditoriumId, priceData) => {
    try {
      const result = await apiMethods.put(`/registrar/auditoriums/${auditoriumId}/prices/`, priceData)
      return result
    } catch (error) {
      console.error('Error updating auditorium prices:', error)
      return { success: false, error: { message: 'Failed to update auditorium prices' } }
    }
  },

  // Get All Payments
  getAllPayments: async (page = 1, pageSize = 10) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      const result = await apiMethods.get(`/registrar/payments/?${params}`)
      return result
    } catch (error) {
      console.error('Error fetching payments:', error)
      return { success: false, error: { message: 'Failed to fetch payments' } }
    }
  },

  // Get Calendar Events
  getCalendarEvents: async () => {
    try {
      const result = await apiMethods.get('/registrar/calendar-events/')
      return result
    } catch (error) {
      console.error('Error fetching calendar events:', error)
      return { success: false, error: { message: 'Failed to fetch calendar events' } }
    }
  }
}

export default bookingService 