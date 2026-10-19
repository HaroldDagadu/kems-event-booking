import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import CreateEventModal from '../../components/student/CreateEventModal'
import EventCard from '../../components/student/EventCard'
import EventDetailsModal from '../../components/student/EventDetailsModal'
import SearchBar from '../../components/student/SearchBar'
import Sidebar from '../../components/student/Sidebar'
import Evette from '../../components/student/Evette'
import TagSelection from '../../components/student/TagSelection'
import { ROUTES, USER_ROLES } from '../../utils/constants'
import { eventsService } from '../../services/events'
import { evetteService } from '../../services/evette'

const StudentDashboard = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { showToast } = useToast()
  
  // State management
  const [events, setEvents] = useState([])
  const [aiRecommendedEvents, setAiRecommendedEvents] = useState([])
  const [invitedEvents, setInvitedEvents] = useState([])
  const [savedEvents, setSavedEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [savedEventIds, setSavedEventIds] = useState(new Set())
  const [userPreferences, setUserPreferences] = useState(null)
  const [preferencesLoading, setPreferencesLoading] = useState(true)
  const [isEditingPreferences, setIsEditingPreferences] = useState(false)

  // No more dummy data - will fetch real events from API

  useEffect(() => {
    loadUserPreferences()
    loadEvents()
    loadInvitedEvents()
    loadSavedEvents()
  }, [])

  // Load AI recommendations only after we have user preferences
  useEffect(() => {
    if (userPreferences !== null) {
      loadAiRecommendations()
    }
  }, [userPreferences])

  useEffect(() => {
    filterEvents()
  }, [events, aiRecommendedEvents, invitedEvents, savedEvents, activeCategory, searchQuery])

  const loadEvents = async () => {
    try {
      setLoading(true)
      
      // Fetch real published events from API
      const response = await eventsService.getAllPublicEvents()
      console.log('StudentDashboard - Full API Response:', response)
      if (response.success && response.data) {
        console.log('StudentDashboard - Raw events data:', response.data)
        // Transform the events data to match expected format
        const transformedEvents = response.data.map(event => {
          console.log('StudentDashboard - Processing event:', event.name, 'Images:', event.images)
          // Get primary image from either primary_image field or first image in images array
          let primaryImageUrl = null
          if (event.primary_image?.image) {
            primaryImageUrl = event.primary_image.image
          } else if (event.images && event.images.length > 0) {
            // Find primary image in images array or use first image
            const primaryImg = event.images.find(img => img.is_primary) || event.images[0]
            primaryImageUrl = primaryImg?.image
          }
          
          return {
            ...event,
            category: event.is_public ? 'public' : 'invited',
            // Add fallback image if no primary image exists
            image: primaryImageUrl || `https://placehold.co/400x225/059669/ffffff?text=${encodeURIComponent(event.name || 'Event')}`,
            // Ensure venue has the expected structure
            venue: event.venue_name ? { name: event.venue_name } : { name: 'TBA' }
          }
        })
        setEvents(transformedEvents)
        console.log('Loaded events from API:', response.data)
        console.log('Transformed events:', transformedEvents)
      } else {
        setEvents([])
        console.warn('No events data received from API')
      }
      
    } catch (error) {
      console.error('Error loading events:', error)
      showToast('Failed to load events from server', 'error')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const loadInvitedEvents = async () => {
    try {
      // Fetch invited events from API
      const response = await eventsService.getInvitedEvents()
      if (response.success && response.data) {
        // Transform the invited events data to match expected format
        const transformedInvitedEvents = response.data.map(event => {
          // Get primary image from either primary_image field or first image in images array
          let primaryImageUrl = null
          if (event.primary_image?.image) {
            primaryImageUrl = event.primary_image.image
          } else if (event.images && event.images.length > 0) {
            // Find primary image in images array or use first image
            const primaryImg = event.images.find(img => img.is_primary) || event.images[0]
            primaryImageUrl = primaryImg?.image
          }
          
          return {
            ...event,
            category: 'invited',
            // Add fallback image if no primary image exists
            image: primaryImageUrl || `https://placehold.co/400x225/059669/ffffff?text=${encodeURIComponent(event.name || 'Event')}`,
            // Ensure venue has the expected structure
            venue: event.venue_name ? { name: event.venue_name } : { name: 'TBA' }
          }
        })
        setInvitedEvents(transformedInvitedEvents)
        console.log('Loaded invited events from API:', response.data)
        console.log('Transformed invited events:', transformedInvitedEvents)
      } else {
        setInvitedEvents([])
        console.warn('No invited events data received from API')
      }
      
    } catch (error) {
      console.error('Error loading invited events:', error)
      showToast('Failed to load invited events from server', 'error')
      setInvitedEvents([])
    }
  }

  const loadSavedEvents = async () => {
    try {
      // Fetch saved events from API
      const response = await eventsService.getSavedEvents()
      if (response.success && response.data) {
        // Transform the saved events data to match expected format
        const transformedSavedEvents = response.data.map(event => {
          // Get primary image from either primary_image field or first image in images array
          let primaryImageUrl = null
          if (event.primary_image?.image) {
            primaryImageUrl = event.primary_image.image
          } else if (event.images && event.images.length > 0) {
            // Find primary image in images array or use first image
            const primaryImg = event.images.find(img => img.is_primary) || event.images[0]
            primaryImageUrl = primaryImg?.image
          }
          
          return {
            ...event,
            category: 'saved',
            // Add fallback image if no primary image exists
            image: primaryImageUrl || `https://placehold.co/400x225/059669/ffffff?text=${encodeURIComponent(event.name || 'Event')}`,
            // Ensure venue has the expected structure
            venue: event.venue_name ? { name: event.venue_name } : { name: 'TBA' }
          }
        })
        setSavedEvents(transformedSavedEvents)
        // Update saved event IDs set for quick lookup
        setSavedEventIds(new Set(transformedSavedEvents.map(event => event.id)))
        console.log('Loaded saved events from API:', response.data)
        console.log('Transformed saved events:', transformedSavedEvents)
      } else {
        setSavedEvents([])
        setSavedEventIds(new Set())
        console.warn('No saved events data received from API')
      }
      
    } catch (error) {
      console.error('Error loading saved events:', error)
      showToast('Failed to load saved events from server', 'error')
      setSavedEvents([])
      setSavedEventIds(new Set())
    }
  }

  const loadAiRecommendations = async () => {
    try {
      // Fetch AI-powered personalized recommendations from Evette
      const response = await evetteService.getPersonalizedEvents()
      if (response.success && response.data?.events) {
        // Transform the AI recommended events data to match expected format
        const transformedAiEvents = response.data.events.map(event => {
          // Get primary image from either primary_image field or first image in images array
          let primaryImageUrl = null
          if (event.primary_image?.image) {
            primaryImageUrl = event.primary_image.image
          } else if (event.images && event.images.length > 0) {
            // Find primary image in images array or use first image
            const primaryImg = event.images.find(img => img.is_primary) || event.images[0]
            primaryImageUrl = primaryImg?.image
          }
          
          return {
            ...event,
            category: 'ai_recommended',
            // Add fallback image if no primary image exists
            image: primaryImageUrl || `https://placehold.co/400x225/e11d48/ffffff?text=${encodeURIComponent(event.name || 'Event')}`,
            // Ensure venue has the expected structure
            venue: event.venue_name ? { name: event.venue_name } : { name: 'TBA' }
          }
        })
        setAiRecommendedEvents(transformedAiEvents)
        console.log('Loaded AI recommendations from Evette:', response.data)
        console.log('Transformed AI events:', transformedAiEvents)
      } else {
        setAiRecommendedEvents([])
        console.warn('No AI recommendations received from Evette')
      }
      
    } catch (error) {
      console.error('Error loading AI recommendations:', error)
      // Fallback to regular events if AI recommendations fail
      setAiRecommendedEvents([])
    }
  }

  const loadUserPreferences = async () => {
    try {
      setPreferencesLoading(true)
      // Fetch user preferences to check if they have set their interests
      const response = await evetteService.getUserPreferences()
      if (response.success) {
        setUserPreferences(response.data)
        console.log('User preferences:', response.data)
      } else {
        setUserPreferences({ onboarding_completed: false, preferred_tags: [] })
      }
    } catch (error) {
      console.error('Error loading user preferences:', error)
      setUserPreferences({ onboarding_completed: false, preferred_tags: [] })
    } finally {
      setPreferencesLoading(false)
    }
  }

  const handlePreferencesSet = async (preferredTags) => {
    console.log('Preferences updated, reloading data...', preferredTags)
    // Reload user preferences and AI recommendations
    await loadUserPreferences()
    setIsEditingPreferences(false) // Exit edit mode
    showToast('Your event recommendations have been updated!', 'success')
  }

  const handleEditPreferences = () => {
    setIsEditingPreferences(true)
  }

  const handleCancelEditPreferences = () => {
    setIsEditingPreferences(false)
  }

  const filterEvents = () => {
    let filtered = []

    // Filter by category
    if (activeCategory === 'public') {
      filtered = [...events.filter(event => event.is_public)]
    } else if (activeCategory === 'invited') {
      filtered = [...invitedEvents]
    } else if (activeCategory === 'saved') {
      filtered = [...savedEvents]
    } else if (activeCategory === 'all') {
      // Check if user has set their preferences
      if (userPreferences && userPreferences.preferred_tags && userPreferences.preferred_tags.length > 0) {
        // User has preferences - use AI-powered recommendations if available
        if (aiRecommendedEvents.length > 0) {
          filtered = [...aiRecommendedEvents, ...invitedEvents]
        } else {
          // Fallback to regular events if AI recommendations are not available
          filtered = [...events, ...invitedEvents]
        }
      } else {
        // User doesn't have preferences - this will show TagSelection component
        filtered = []
      }
    } else if (activeCategory === 'evette') {
      // This will be handled separately - don't set filtered events
      filtered = []
    }
    // 'bookvenue' and 'bookings' will be handled separately

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.venue?.name || event.venue_name || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }


  const handleCategoryChange = (category) => {
    setActiveCategory(category)
    
    // Handle special navigation categories
    if (category === 'bookvenue') {
      navigate('/academic/book-venue')
      return
    }
    if (category === 'bookings') {
      navigate('/academic/my-bookings')
      return
    }
  }

  const handleSearch = (query) => {
    setSearchQuery(query)
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
    setShowDetailsModal(true)
  }

  const handleSaveEvent = async (eventId, shouldSave) => {
    try {
      if (shouldSave) {
        const response = await eventsService.saveEvent(eventId)
        if (response.success) {
          setSavedEventIds(prev => new Set([...prev, eventId]))
          showToast('Event saved to favorites!', 'success')
          // Reload saved events to get the full data
          loadSavedEvents()
        } else {
          showToast('Failed to save event', 'error')
        }
      } else {
        const response = await eventsService.unsaveEvent(eventId)
        if (response.success) {
          setSavedEventIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(eventId)
            return newSet
          })
          setSavedEvents(prev => prev.filter(event => event.id !== eventId))
          showToast('Event removed from favorites', 'success')
        } else {
          showToast('Failed to remove event from favorites', 'error')
        }
      }
    } catch (error) {
      console.error('Error toggling save status:', error)
      showToast('Error updating favorites', 'error')
    }
  }

  const handleCreateEvent = async (eventData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.post('/events/', eventData)
      // const newEvent = response.data
      
      // Mock event creation
      const newEvent = {
        id: String(events.length + 1),
        ...eventData,
        image: 'https://placehold.co/400x225/4ade80/0e1a13?text=New+Event',
        date: new Date().toISOString().split('T')[0],
        venue: { name: 'TBD' }
      }

      setEvents(prev => [newEvent, ...prev])
      setShowCreateModal(false)
      setActiveCategory('all') // Show all events to display the new one
      showToast('Event created successfully!', 'success')
    } catch (error) {
      console.error('Error creating event:', error)
      showToast('Failed to create event', 'error')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
      showToast('Logged out successfully', 'success')
    } catch (error) {
      console.error('Logout error:', error)
      showToast('Logout failed', 'error')
    }
  }

  const renderContent = () => {
    // Show Evette chatbot interface
    if (activeCategory === 'evette') {
      return <Evette />
    }

    // Show tag selection for Events for You when user hasn't set preferences OR is editing
    if (activeCategory === 'all' && userPreferences && 
        ((!userPreferences.preferred_tags || userPreferences.preferred_tags.length === 0) || isEditingPreferences)) {
      return (
        <TagSelection 
          onPreferencesSet={handlePreferencesSet} 
          onCancel={userPreferences.preferred_tags && userPreferences.preferred_tags.length > 0 ? handleCancelEditPreferences : null}
          isEditing={isEditingPreferences}
        />
      )
    }

    if (activeCategory === 'bookvenue') {
      return (
        <div className="p-4">
          <p className="text-center text-gray-500">Redirecting to venue booking...</p>
        </div>
      )
    }

    if (activeCategory === 'bookings') {
      return (
        <div className="p-4">
          <p className="text-center text-gray-500">Redirecting to your bookings...</p>
        </div>
      )
    }

    if (loading || preferencesLoading) {
      return (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <span className="ml-2 text-gray-600">
            {preferencesLoading ? 'Loading your preferences...' : 'Loading events...'}
          </span>
        </div>
      )
    }

    if (filteredEvents.length === 0) {
      return (
        <div className="p-4">
          <p className="text-center text-gray-500 w-full">No events found.</p>
        </div>
      )
    }

    return (
      <div className="p-4">
        {/* Header with Edit Preferences button for Events for You */}
        {activeCategory === 'all' && userPreferences && userPreferences.preferred_tags && userPreferences.preferred_tags.length > 0 && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Events for You</h2>
                <p className="text-sm text-gray-600 mt-0.5">
                  Events picked for you by Evette based on your preferences
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {userPreferences.preferred_tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                    {tag.name}
                  </span>
                ))}
                {userPreferences.preferred_tags.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                    +{userPreferences.preferred_tags.length - 3} more
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleEditPreferences}
              className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Preferences
            </button>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEventClick={handleEventClick}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col bg-[#f8fbfa] overflow-x-hidden" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="layout-container flex h-full grow flex-col">
        <div className="gap-1 px-6 flex flex-1 justify-center py-5">
          {/* Sidebar Navigation */}
          <Sidebar
            user={user}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            onCreateEvent={() => setShowCreateModal(true)}
            onLogout={handleLogout}
          />
          
          {/* Main Content Area */}
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Search Bar - Hidden when using Evette */}
            {activeCategory !== 'evette' && (
              <SearchBar onSearch={handleSearch} />
            )}
            
            {/* Event Listings Container */}
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateEvent}
        />
      )}

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedEvent(null)
        }}
        onSaveEvent={handleSaveEvent}
        isSaved={selectedEvent ? savedEventIds.has(selectedEvent.id) : false}
      />
    </div>
  )
}

export default StudentDashboard