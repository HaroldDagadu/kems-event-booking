import { apiMethods } from './api'

/**
 * Registrar Service
 * Handles all registrar-specific API calls for KEMS system
 */
export const registrarService = {
  // Get Dashboard Statistics
  getDashboardStats: async (filters = {}) => {
    console.log('🔍 Registrar: Fetching dashboard stats...', filters)
    try {
      const params = new URLSearchParams()
      
      // Add filters to params if provided
      if (filters.period) {
        params.append('period', filters.period)
      }
      if (filters.start_date) {
        params.append('start_date', filters.start_date)
      }
      if (filters.end_date) {
        params.append('end_date', filters.end_date)
      }
      
      const url = `/registrar/dashboard/stats/${params.toString() ? '?' + params.toString() : ''}`
      const result = await apiMethods.get(url)
      console.log('✅ Registrar: Dashboard stats result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching dashboard stats:', error)
      return { success: false, error: { message: 'Failed to fetch dashboard statistics' } }
    }
  },

  // Get All Booking Requests
  getAllBookings: async (page = 1, pageSize = 10, filters = {}) => {
    console.log('🔍 Registrar: Fetching all bookings...', { page, pageSize, filters })
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...filters
      })
      const result = await apiMethods.get(`/registrar/bookings/?${params}`)
      console.log('✅ Registrar: All bookings result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching all bookings:', error)
      return { success: false, error: { message: 'Failed to fetch bookings' } }
    }
  },

  // Get Booking Request Details
  getBookingDetails: async (bookingId) => {
    console.log('🔍 Registrar: Fetching booking details for ID:', bookingId)
    try {
      const result = await apiMethods.get(`/registrar/bookings/${bookingId}/`)
      console.log('✅ Registrar: Booking details result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching booking details:', error)
      return { success: false, error: { message: 'Failed to fetch booking details' } }
    }
  },

  // Update Booking Request Status (Approve/Deny)
  updateBookingStatus: async (bookingId, statusData) => {
    console.log('🔍 Registrar: Updating booking status:', { bookingId, statusData })
    try {
      const result = await apiMethods.put(`/registrar/bookings/${bookingId}/`, statusData)
      console.log('✅ Registrar: Update booking status result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating booking status:', error)
      return { success: false, error: { message: 'Failed to update booking status' } }
    }
  },

  // Update Auditorium Prices
  updateAuditoriumPrices: async (auditoriumId, priceData) => {
    console.log('🔍 Registrar: Updating auditorium prices:', { auditoriumId, priceData })
    try {
      const result = await apiMethods.put(`/registrar/auditoriums/${auditoriumId}/prices/`, priceData)
      console.log('✅ Registrar: Update auditorium prices result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating auditorium prices:', error)
      return { success: false, error: { message: 'Failed to update auditorium prices' } }
    }
  },

  // Create Public Event
  createPublicEvent: async (eventData) => {
    console.log('🔍 Registrar: Creating public event:', eventData)
    try {
      const result = await apiMethods.post('/registrar/events/public/', eventData)
      console.log('✅ Registrar: Create public event result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error creating public event:', error)
      return { success: false, error: { message: 'Failed to create public event' } }
    }
  },

  // Get All Payments
  getAllPayments: async (page = 1, pageSize = 10) => {
    console.log('🔍 Registrar: Fetching all payments...', { page, pageSize })
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString()
      })
      const result = await apiMethods.get(`/registrar/payments/?${params}`)
      console.log('✅ Registrar: All payments result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching payments:', error)
      return { success: false, error: { message: 'Failed to fetch payments' } }
    }
  },

  // Get Calendar Events
  getCalendarEvents: async () => {
    console.log('🔍 Registrar: Fetching calendar events...')
    try {
      const result = await apiMethods.get('/registrar/calendar-events/')
      console.log('✅ Registrar: Calendar events result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching calendar events:', error)
      return { success: false, error: { message: 'Failed to fetch calendar events' } }
    }
  },

  // ===== NEW EVENT POSTING SYSTEM =====

  // Post Approved Booking as Event
  postBookingAsEvent: async (bookingId, eventData) => {
    console.log('🔍 Registrar: Posting booking as event:', { bookingId, eventData })
    try {
      const result = await apiMethods.post(`/registrar/bookings/${bookingId}/post-event/`, eventData)
      console.log('✅ Registrar: Post booking as event result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error posting booking as event:', error)
      return { success: false, error: { message: 'Failed to post booking as event' } }
    }
  },

  // Get All Public Events (Registrar View)
  getAllPublicEvents: async (page = 1, pageSize = 10, filters = {}) => {
    console.log('🔍 Registrar: Fetching all public events...', { page, pageSize, filters })
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
        ...filters
      })
      const result = await apiMethods.get(`/registrar/events/public/?${params}`)
      console.log('✅ Registrar: All public events result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching public events:', error)
      return { success: false, error: { message: 'Failed to fetch public events' } }
    }
  },

  // Update Public Event
  updatePublicEvent: async (eventId, eventData) => {
    console.log('🔍 Registrar: Updating public event:', { eventId, eventData })
    try {
      const result = await apiMethods.put(`/registrar/events/public/${eventId}/`, eventData)
      console.log('✅ Registrar: Update public event result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating public event:', error)
      return { success: false, error: { message: 'Failed to update public event' } }
    }
  },

  // Delete Public Event
  deletePublicEvent: async (eventId) => {
    console.log('🔍 Registrar: Deleting public event:', eventId)
    try {
      const result = await apiMethods.delete(`/registrar/events/public/${eventId}/`)
      console.log('✅ Registrar: Delete public event result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error deleting public event:', error)
      return { success: false, error: { message: 'Failed to delete public event' } }
    }
  },

  // ===== VENUE/FACILITY MANAGEMENT =====

  // Create Venue
  createVenue: async (venueData) => {
    console.log('🔍 Registrar: Creating venue:', venueData)
    try {
      const result = await apiMethods.post('/registrar/venues/', venueData)
      console.log('✅ Registrar: Create venue result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error creating venue:', error)
      return { success: false, error: { message: 'Failed to create venue' } }
    }
  },

  // Get Registrar's Assigned Venues
  getAllVenues: async (page = 1, pageSize = 10) => {
    console.log('🔍 Registrar: Fetching assigned venues...', { page, pageSize })
    try {
      const result = await apiMethods.get('/registrar/venues/')
      console.log('✅ Registrar: Assigned venues result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching assigned venues:', error)
      return { success: false, error: { message: 'Failed to fetch assigned venues' } }
    }
  },

  // Get Venue Details
  getVenueDetails: async (venueId) => {
    console.log('🔍 Registrar: Fetching venue details:', venueId)
    try {
      const result = await apiMethods.get(`/registrar/venues/${venueId}/`)
      console.log('✅ Registrar: Venue details result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching venue details:', error)
      return { success: false, error: { message: 'Failed to fetch venue details' } }
    }
  },

  // Update Venue
  updateVenue: async (venueId, venueData) => {
    console.log('🔍 Registrar: Updating venue:', { venueId, venueData })
    try {
      const result = await apiMethods.put(`/registrar/venues/${venueId}/`, venueData)
      console.log('✅ Registrar: Update venue result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating venue:', error)
      return { success: false, error: { message: 'Failed to update venue' } }
    }
  },

  // Delete Venue
  deleteVenue: async (venueId) => {
    console.log('🔍 Registrar: Deleting venue:', venueId)
    try {
      const result = await apiMethods.delete(`/registrar/venues/${venueId}/`)
      console.log('✅ Registrar: Delete venue result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error deleting venue:', error)
      return { success: false, error: { message: 'Failed to delete venue' } }
    }
  },

  // ===== VENUE IMAGES =====

  // Add Venue Image
  addVenueImage: async (venueId, imageData) => {
    console.log('🔍 Registrar: Adding venue image:', { venueId, imageData })
    try {
      const result = await apiMethods.post(`/registrar/venues/${venueId}/images/`, imageData)
      console.log('✅ Registrar: Add venue image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error adding venue image:', error)
      return { success: false, error: { message: 'Failed to add venue image' } }
    }
  },

  // Update Venue Image
  updateVenueImage: async (venueId, imageId, imageData) => {
    console.log('🔍 Registrar: Updating venue image:', { venueId, imageId, imageData })
    try {
      const result = await apiMethods.put(`/registrar/venues/${venueId}/images/${imageId}/`, imageData)
      console.log('✅ Registrar: Update venue image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating venue image:', error)
      return { success: false, error: { message: 'Failed to update venue image' } }
    }
  },

  // Delete Venue Image
  deleteVenueImage: async (venueId, imageId) => {
    console.log('🔍 Registrar: Deleting venue image:', { venueId, imageId })
    try {
      const result = await apiMethods.delete(`/registrar/venues/${venueId}/images/${imageId}/`)
      console.log('✅ Registrar: Delete venue image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error deleting venue image:', error)
      return { success: false, error: { message: 'Failed to delete venue image' } }
    }
  },

  // ===== EVENT IMAGES =====

  // Add Event Image
  addEventImage: async (eventId, imageData) => {
    console.log('🔍 Registrar: Adding event image:', { eventId, imageData })
    try {
      const result = await apiMethods.post(`/registrar/events/${eventId}/images/`, imageData)
      console.log('✅ Registrar: Add event image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error adding event image:', error)
      return { success: false, error: { message: 'Failed to add event image' } }
    }
  },

  // Update Event Image
  updateEventImage: async (eventId, imageId, imageData) => {
    console.log('🔍 Registrar: Updating event image:', { eventId, imageId, imageData })
    try {
      const result = await apiMethods.put(`/registrar/events/${eventId}/images/${imageId}/`, imageData)
      console.log('✅ Registrar: Update event image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error updating event image:', error)
      return { success: false, error: { message: 'Failed to update event image' } }
    }
  },

  // Delete Event Image
  deleteEventImage: async (eventId, imageId) => {
    console.log('🔍 Registrar: Deleting event image:', { eventId, imageId })
    try {
      const result = await apiMethods.delete(`/registrar/events/${eventId}/images/${imageId}/`)
      console.log('✅ Registrar: Delete event image result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error deleting event image:', error)
      return { success: false, error: { message: 'Failed to delete event image' } }
    }
  },

  // ===== TAGS =====

  // Get All Tags
  getAllTags: async () => {
    console.log('🔍 Registrar: Fetching all tags...')
    try {
      const result = await apiMethods.get('/tags/')
      console.log('✅ Registrar: All tags result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error fetching tags:', error)
      return { success: false, error: { message: 'Failed to fetch tags' } }
    }
  },

  // Create Tag
  createTag: async (tagData) => {
    console.log('🔍 Registrar: Creating tag:', tagData)
    try {
      const result = await apiMethods.post('/tags/', tagData)
      console.log('✅ Registrar: Create tag result:', result)
      return result
    } catch (error) {
      console.error('❌ Registrar: Error creating tag:', error)
      return { success: false, error: { message: 'Failed to create tag' } }
    }
  }
} 