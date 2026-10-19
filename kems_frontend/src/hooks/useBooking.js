import { useState } from 'react'
import { bookingService } from '../services/booking'
import { useToast } from '../contexts/ToastContext'

/**
 * Custom Hook for Booking Management
 * Handles form submissions, loading states, and API calls for booking system
 */
export const useBooking = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [auditoriums, setAuditoriums] = useState([])
  const { showToast } = useToast()

  /**
   * Fetch available auditoriums
   */
  const fetchAuditoriums = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await bookingService.getAuditoriums()
      
      if (result.success) {
        setAuditoriums(result.data)
        return { success: true, data: result.data }
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch auditoriums'
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = 'Network error while fetching auditoriums'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Submit outsider booking request
   * @param {Object} formData - Form data from outsider booking form
   */
  const submitOutsiderBooking = async (formData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Transform form data to API payload structure
      const payload = {
        event_name: formData.event_name,
        purpose: formData.purpose,
        venue: parseInt(formData.venue), // Ensure venue ID is an integer
        desired_date: formData.desired_date,
        start_time: formData.start_time + ':00', // Add seconds
        end_time: formData.end_time + ':00', // Add seconds
        duration_hours: parseFloat(formData.duration_hours), // Ensure duration is a number
        event_type: formData.event_type,
        organization: {
          name: formData.organization_name,
          ...(formData.organization_address && { address: formData.organization_address }),
          ...(formData.organization_email && { email: formData.organization_email }),
          ...(formData.organization_contact && { contact_number: formData.organization_contact }),
          ...(formData.organization_website && { website: formData.organization_website })
        },
        requester_full_name: formData.requester_full_name,
        requester_position: formData.requester_position,
        requester_contact_number: formData.requester_contact,
        requester_email: formData.requester_email
      }

      console.log('Transformed payload:', payload)

      const result = await bookingService.createOutsiderBooking(payload)
      
      if (result.success) {
        showToast('Booking request submitted successfully! You will receive an email notification once reviewed.', 'success')
        return { success: true, data: result.data }
      } else {
        const errorMessage = result.error?.message || 'Failed to submit booking request'
        console.error('Booking submission failed:', result.error)
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Network error while submitting booking request'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Submit insider booking request
   * @param {Object} formData - Form data from insider booking form
   */
  const submitInsiderBooking = async (formData) => {
    try {
      setIsLoading(true)
      setError(null)

      // Transform form data to API payload structure
      const payload = {
        event_name: formData.event_name,
        purpose: formData.purpose,
        venue: formData.venue,
        desired_date: formData.desired_date,
        start_time: formData.start_time + ':00', // Add seconds
        end_time: formData.end_time + ':00', // Add seconds
        duration_hours: formData.duration_hours,
        event_type: formData.event_type
      }

      // Add invitees if it's a private event and invitees exist
      if (formData.event_type === 'private' && formData.invitees && formData.invitees.length > 0) {
        payload.invitees = formData.invitees
      }

      const result = await bookingService.createInsiderBooking(payload)
      
      if (result.success) {
        showToast('Booking request submitted successfully! Check your booking status for updates.', 'success')
        return { success: true, data: result.data }
      } else {
        const errorMessage = result.error?.message || 'Failed to submit booking request'
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMessage = 'Network error while submitting booking request'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return { success: false, error: { message: errorMessage } }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Get insider booking status
   */
  const fetchBookingStatus = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await bookingService.getInsiderBookingStatus()
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch booking status'
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = 'Network error while fetching booking status'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Get booking details by ID
   * @param {number} bookingId - Booking request ID
   */
  const fetchBookingDetails = async (bookingId) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await bookingService.getBookingDetails(bookingId)
      
      if (result.success) {
        return { success: true, data: result.data }
      } else {
        const errorMessage = result.error?.message || 'Failed to fetch booking details'
        setError(errorMessage)
        showToast(errorMessage, 'error')
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      const errorMessage = 'Network error while fetching booking details'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      return { success: false, error: errorMessage }
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    setError(null)
  }

  /**
   * Get selected auditorium from list
   * @param {number} venueId - Auditorium ID
   */
  const getSelectedAuditorium = (venueId) => {
    if (!Array.isArray(auditoriums) || !venueId) {
      return null
    }
    return auditoriums.find(aud => aud.id === venueId) || null
  }

  return {
    // State
    isLoading,
    error,
    auditoriums,
    
    // Actions
    fetchAuditoriums,
    submitOutsiderBooking,
    submitInsiderBooking,
    fetchBookingStatus,
    fetchBookingDetails,
    clearError,
    getSelectedAuditorium
  }
}

export default useBooking 