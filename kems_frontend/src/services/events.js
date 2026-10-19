import { apiMethods } from './api'

// Events Service
export const eventsService = {
  // Get Personalized Events (For You)
  getPersonalizedEvents: async () => {
    return await apiMethods.get('/events/for-you/')
  },

  // Alias for backwards compatibility
  getEventsForYou: async () => {
    return await apiMethods.get('/events/for-you/')
  },

  // Get All Public Events
  getAllPublicEvents: async () => {
    return await apiMethods.get('/events/all-public/')
  },

  // Get Invited Events
  getInvitedEvents: async () => {
    return await apiMethods.get('/events/invited/')
  },

  // Respond to Invitation (alias for invitationsService.respondToInvitation)
  respondToInvitation: async (invitationId, response) => {
    return await apiMethods.put(`/invitations/${invitationId}/response/`, response)
  },

  // Get Event Details
  getEventDetails: async (eventId) => {
    return await apiMethods.get(`/events/${eventId}/`)
  },

  // Create Event (for users with permission)
  createEvent: async (eventData) => {
    return await apiMethods.post('/events/', eventData)
  },

  // Update Event
  updateEvent: async (eventId, eventData) => {
    return await apiMethods.put(`/events/${eventId}/`, eventData)
  },

  // Delete Event
  deleteEvent: async (eventId) => {
    return await apiMethods.delete(`/events/${eventId}/`)
  },

  // Save Event to Favorites
  saveEvent: async (eventId) => {
    return await apiMethods.post(`/events/${eventId}/save/`)
  },

  // Remove Event from Favorites
  unsaveEvent: async (eventId) => {
    return await apiMethods.delete(`/events/${eventId}/save/`)
  },

  // Get Saved Events
  getSavedEvents: async () => {
    return await apiMethods.get('/events/saved/')
  },

  // Check if Event is Saved
  checkEventSaved: async (eventId) => {
    return await apiMethods.get(`/events/${eventId}/saved-status/`)
  }
}

// Registrar Events Service
export const registrarEventsService = {
  // Create Public Event
  createPublicEvent: async (eventData) => {
    return await apiMethods.post('/registrar/events/public/', eventData)
  },

  // Get All Events (registrar view)
  getAllEvents: async (page = 1, pageSize = 10, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
      ...filters
    })
    return await apiMethods.get(`/registrar/events/?${params}`)
  },

  // Update Event (registrar)
  updateEvent: async (eventId, eventData) => {
    return await apiMethods.put(`/registrar/events/${eventId}/`, eventData)
  },

  // Delete Event (registrar)
  deleteEvent: async (eventId) => {
    return await apiMethods.delete(`/registrar/events/${eventId}/`)
  }
}

// Invitations Service
export const invitationsService = {
  // Create Invitations
  createInvitations: async (invitationData) => {
    return await apiMethods.post('/invitations/', invitationData)
  },

  // Get User's Invitations
  getUserInvitations: async () => {
    return await apiMethods.get('/invitations/')
  },

  // Respond to Invitation
  respondToInvitation: async (invitationId, response) => {
    return await apiMethods.put(`/invitations/${invitationId}/response/`, response)
  },

  // Get Invitation Details
  getInvitationDetails: async (invitationId) => {
    return await apiMethods.get(`/invitations/${invitationId}/`)
  },

  // Get Event Invitations (for event organizers)
  getEventInvitations: async (eventId) => {
    return await apiMethods.get(`/events/${eventId}/invitations/`)
  }
}

export default eventsService 