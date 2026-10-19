import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/Select'
import { Checkbox } from '../../components/ui/Checkbox'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import { useToast } from '../../contexts/ToastContext'
import { 
  Search,
  Filter,
  Edit,
  Trash2,
  Image as ImageIcon,
  Calendar,
  Clock,
  MapPin,
  Tag,
  Eye,
  Plus,
  Upload,
  X,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  DollarSign
} from 'lucide-react'

function ManageEvents() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [bookingRequests, setBookingRequests] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [editingEvent, setEditingEvent] = useState(null)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [venues, setVenues] = useState([])
  const [tags, setTags] = useState([])
  const [activeTab, setActiveTab] = useState('events') // 'events' or 'bookings'
  
  // Form states
  const [eventData, setEventData] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    start_time: '',
    end_time: '',
    is_public: true,
    tag_ids: [],
    is_paid_event: false,
    images: []
  })

  const [imageFiles, setImageFiles] = useState([])

  // API hooks
  const { execute: fetchEvents } = useApi(registrarService.getAllPublicEvents)
  const { execute: fetchBookings } = useApi(registrarService.getAllBookings)
  const { execute: updateBookingStatus } = useApi(registrarService.updateBookingStatus)
  const { execute: fetchVenues } = useApi(registrarService.getAllVenues)
  const { execute: fetchTags } = useApi(registrarService.getAllTags)
  const { execute: updateEvent } = useApi(registrarService.updatePublicEvent)
  const { execute: deleteEvent } = useApi(registrarService.deletePublicEvent)
  const { execute: addEventImage } = useApi(registrarService.addEventImage)
  const { execute: deleteEventImage } = useApi(registrarService.deleteEventImage)
  
  const { showToast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    if (activeTab === 'events') {
      filterEvents()
    } else {
      filterBookings()
    }
  }, [events, bookingRequests, searchTerm, filterType, activeTab])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
      // Fetch events
      const eventsResponse = await fetchEvents()
      if (eventsResponse.success) {
        // Handle paginated response structure from /registrar/events/public/
        let eventsData = []
        if (eventsResponse.data?.events) {
          // Paginated response from registrar endpoint
          eventsData = eventsResponse.data.events
        } else if (Array.isArray(eventsResponse.data)) {
          // Direct array response
          eventsData = eventsResponse.data
        }
        console.log('ManageEvents - Raw API response:', eventsResponse.data)
        console.log('ManageEvents - Processed events data:', eventsData)
        setEvents(Array.isArray(eventsData) ? eventsData : [])
      }

      // Fetch booking requests
      const bookingsResponse = await fetchBookings()
      if (bookingsResponse.success) {
        setBookingRequests(bookingsResponse.data || [])
      }

      // Fetch venues
      const venuesResponse = await fetchVenues()
      if (venuesResponse.success) {
        setVenues(venuesResponse.data || [])
      }

      // Fetch tags
      const tagsResponse = await fetchTags()
      if (tagsResponse.success) {
        setTags(tagsResponse.data || [])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Error loading data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const filterEvents = () => {
    let filtered = events

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply type filter
    if (filterType !== 'all') {
      const now = new Date()
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date)
        const eventEnd = new Date(event.date + 'T' + event.end_time)
        
        switch (filterType) {
          case 'upcoming':
            return now < eventDate
          case 'ongoing':
            return now >= eventDate && now <= eventEnd
          case 'past':
            return now > eventEnd
          default:
            return true
        }
      })
    }

    setFilteredEvents(filtered)
  }

  const filterBookings = () => {
    let filtered = bookingRequests

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter for bookings
    if (filterType !== 'all') {
      filtered = filtered.filter(booking => booking.status === filterType)
    }

    setFilteredBookings(filtered)
  }

  const handleInputChange = (field, value) => {
    setEventData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleTagToggle = (tagId) => {
    setEventData(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter(id => id !== tagId)
        : [...prev.tag_ids, tagId]
    }))
  }

  const resetForm = () => {
    setEventData({
      name: '',
      description: '',
      venue: '',
      date: '',
      start_time: '',
      end_time: '',
      is_public: true,
      tag_ids: [],
      is_paid_event: false,
      images: []
    })
    setImageFiles([])
    setEditingEvent(null)
  }

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventData({
      name: event.name,
      description: event.description,
      venue: event.venue?.toString() || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time,
      is_public: event.is_public,
      tag_ids: event.tags?.map(tag => tag.id) || [],
      is_paid_event: event.is_paid_event,
      images: []
    })
    setImageFiles([])
  }

  const handleUpdateEvent = async () => {
    if (!editingEvent) return

    try {
      setLoading(true)
      
      // First update the event details (without images)
      const eventUpdateData = { ...eventData }
      delete eventUpdateData.images // Remove images from event update
      
      const response = await updateEvent(editingEvent.id, eventUpdateData)
      if (response.success) {
        // If there are new images to add, add them separately
        if (imageFiles.length > 0) {
          await handleAddEventImage(editingEvent.id)
        }
        showToast('Event updated successfully!', 'success')
        resetForm()
        loadInitialData()
      } else {
        showToast(response.error?.message || 'Failed to update event', 'error')
      }
    } catch (error) {
      console.error('Error updating event:', error)
      showToast('Error updating event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) return

    try {
      setLoading(true)
      const response = await deleteEvent(eventId)
      if (response.success) {
        showToast('Event deleted successfully!', 'success')
        loadInitialData()
      } else {
        showToast(response.error?.message || 'Failed to delete event', 'error')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      showToast('Error deleting event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map(file => ({
      file,
      caption: '',
      is_primary: false  // Default to false, user can manually set primary if needed
    }))
    setImageFiles(prev => [...prev, ...newImages])
  }

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index))
  }

  const updateImageCaption = (index, caption) => {
    setImageFiles(prev => prev.map((img, i) => 
      i === index ? { ...img, caption } : img
    ))
  }

  const setPrimaryImage = (index) => {
    setImageFiles(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index
    })))
  }

  const togglePrimaryImage = (index) => {
    setImageFiles(prev => prev.map((img, i) => ({
      ...img,
      is_primary: i === index ? !img.is_primary : img.is_primary
    })))
  }

  const handleAddEventImage = async (eventId) => {
    try {
      setLoading(true)
      
      // Add images one by one using the same format as PostEvent
      for (let i = 0; i < imageFiles.length; i++) {
        const image = imageFiles[i]
        const formData = new FormData()
        
        formData.append('image', image.file)
        formData.append('caption', image.caption || '')
        formData.append('is_primary', image.is_primary || false)
        
        console.log(`ManageEvents - Adding image ${i + 1}/${imageFiles.length}:`, {
          file: image.file.name,
          caption: image.caption,
          is_primary: image.is_primary
        })
        
        const response = await addEventImage(eventId, formData)
        if (!response.success) {
          console.error(`Failed to add image ${i + 1}:`, response.error)
          showToast(`Failed to add image ${i + 1}: ${response.error?.message}`, 'error')
          return // Stop adding more images if one fails
        }
      }
      
      showToast('Images added successfully!', 'success')
      setImageFiles([])
      setShowImageModal(false)
      loadInitialData()
    } catch (error) {
      console.error('Error adding event images:', error)
      showToast('Error adding images', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEventImage = async (eventId, imageId) => {
    if (!confirm('Are you sure you want to delete this image?')) return

    try {
      setLoading(true)
      const response = await deleteEventImage(eventId, imageId)
      if (response.success) {
        showToast('Image deleted successfully!', 'success')
        loadInitialData()
      } else {
        showToast(response.error?.message || 'Failed to delete image', 'error')
      }
    } catch (error) {
      console.error('Error deleting event image:', error)
      showToast('Error deleting image', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getEventStatus = (event) => {
    const now = new Date()
    const eventDate = new Date(event.date)
    const eventEnd = new Date(event.date + 'T' + event.end_time)

    if (now < eventDate) return { status: 'upcoming', color: 'text-blue-600 bg-blue-100' }
    if (now >= eventDate && now <= eventEnd) return { status: 'ongoing', color: 'text-green-600 bg-green-100' }
    return { status: 'past', color: 'text-gray-600 bg-gray-100' }
  }

  const getBookingStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'denied': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'paid': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking)
    setShowBookingModal(true)
  }

  const handleApproveBooking = async (bookingId) => {
    try {
      setLoading(true)
      const response = await updateBookingStatus(bookingId, { status: 'approved' })
      if (response.success) {
        showToast('Booking approved successfully!', 'success')
        setShowBookingModal(false)
        loadInitialData()
      } else {
        showToast(response.error?.message || 'Failed to approve booking', 'error')
      }
    } catch (error) {
      console.error('Error approving booking:', error)
      showToast('Error approving booking', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDenyBooking = async (bookingId, reason) => {
    try {
      setLoading(true)
      const response = await updateBookingStatus(bookingId, { 
        status: 'denied',
        denial_reason: reason 
      })
      if (response.success) {
        showToast('Booking denied successfully!', 'success')
        setShowBookingModal(false)
        loadInitialData()
      } else {
        showToast(response.error?.message || 'Failed to deny booking', 'error')
      }
    } catch (error) {
      console.error('Error denying booking:', error)
      showToast('Error denying booking', 'error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Events & Bookings</h1>
            <p className="text-muted-foreground">Edit and manage all public events and review booking requests</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'events'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Published Events ({events.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'bookings'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Booking Requests ({bookingRequests.length})
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {activeTab === 'events' ? (
                  <>
                    <SelectItem value="all">All Events</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="past">Past</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'events' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.isArray(filteredEvents) && filteredEvents.map((event) => {
            const status = getEventStatus(event)
            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{event.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.status}
                        </span>
                        {event.is_paid_event && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Paid Event
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event)
                          setShowImageModal(true)
                        }}
                      >
                        <ImageIcon className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditEvent(event)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">{event.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>{event.start_time} - {event.end_time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{event.venue_name}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {event.tags && event.tags.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Tags:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Event Images */}
                  {event.images && event.images.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 mb-2">Images:</p>
                      <div className="flex gap-2 overflow-x-auto">
                        {event.images.map((image) => (
                          <div key={image.id} className="relative">
                            <img
                              src={image.image}
                              alt={image.caption || 'Event image'}
                              className="w-16 h-16 object-cover rounded border"
                              onError={(e) => {
                                e.target.src = '/placeholder-image.jpg'
                                e.target.alt = 'Image not available'
                              }}
                            />
                            {image.is_primary && (
                              <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-1 rounded-bl">
                                Primary
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}

            {(!Array.isArray(filteredEvents) || filteredEvents.length === 0) && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No events found</p>
              </div>
            )}
          </div>
        ) : (
          /* Booking Requests */
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{booking.event_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getBookingStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{booking.venue_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(booking.desired_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{booking.requester_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">₵{booking.total_amount}</span>
                        </div>
                      </div>
                      
                      {booking.organization_name && (
                        <div className="mb-3 flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {booking.organization_name}
                          </span>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Requested on: {new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewBooking(booking)}
                    >
                      <Eye className="w-4 h-4 mr-2" /> View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredBookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No booking requests found</p>
              </div>
            )}
          </div>
        )}

        {/* Edit Event Modal */}
        {editingEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Edit Event</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetForm}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Name *
                    </label>
                    <Input
                      value={eventData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter event name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Venue *
                    </label>
                    <Select value={eventData.venue} onValueChange={(value) => handleInputChange('venue', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venues.map((venue) => (
                          <SelectItem key={venue.id} value={venue.id.toString()}>
                            {venue.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <Textarea
                    value={eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter event description"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date *
                    </label>
                    <Input
                      type="date"
                      value={eventData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <Input
                      type="time"
                      value={eventData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <Input
                      type="time"
                      value={eventData.end_time}
                      onChange={(e) => handleInputChange('end_time', e.target.value)}
                    />
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={eventData.tag_ids.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                        />
                        <span className="text-sm">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={eventData.is_public}
                      onChange={(e) => handleInputChange('is_public', e.target.checked)}
                    />
                    <span className="text-sm">Public Event</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <Checkbox
                      checked={eventData.is_paid_event}
                      onChange={(e) => handleInputChange('is_paid_event', e.target.checked)}
                    />
                    <span className="text-sm">Paid Event</span>
                  </label>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add New Images
                  </label>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {/* Image Preview */}
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {imageFiles.map((image, index) => (
                          <div key={index} className="relative border rounded-lg p-4">
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Image caption"
                                value={image.caption}
                                onChange={(e) => updateImageCaption(index, e.target.value)}
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={image.is_primary}
                                    onChange={() => togglePrimaryImage(index)}
                                  />
                                  <span className="text-xs">Primary Image</span>
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={handleUpdateEvent}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? 'Updating...' : 'Update Event'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Management Modal */}
        {showImageModal && selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Manage Images - {selectedEvent.name}</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowImageModal(false)
                    setSelectedEvent(null)
                    setImageFiles([])
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Add New Images */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Add New Images</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>

                    {/* New Image Preview */}
                    {imageFiles.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {imageFiles.map((image, index) => (
                          <div key={index} className="relative border rounded-lg p-4">
                            <img
                              src={URL.createObjectURL(image.file)}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded"
                            />
                            <div className="mt-2 space-y-2">
                              <Input
                                placeholder="Image caption"
                                value={image.caption}
                                onChange={(e) => updateImageCaption(index, e.target.value)}
                              />
                              <div className="flex items-center justify-between">
                                <label className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={image.is_primary}
                                    onChange={() => togglePrimaryImage(index)}
                                  />
                                  <span className="text-xs">Primary Image</span>
                                </label>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeImage(index)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {imageFiles.length > 0 && (
                      <Button
                        onClick={() => handleAddEventImage(selectedEvent.id)}
                        disabled={loading}
                      >
                        {loading ? 'Adding Images...' : 'Add Images'}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Existing Images */}
                {selectedEvent.images && selectedEvent.images.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Existing Images</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {selectedEvent.images.map((image) => (
                        <div key={image.id} className="relative border rounded-lg p-4">
                          <img
                            src={image.image}
                            alt={image.caption}
                            className="w-full h-32 object-cover rounded"
                          />
                          <div className="mt-2">
                            <p className="text-sm font-medium">{image.caption}</p>
                            {image.is_primary && (
                              <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded mt-1">
                                Primary
                              </span>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteEventImage(selectedEvent.id, image.id)}
                            className="absolute top-2 right-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Booking Details Modal */}
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold">{selectedBooking.event_name}</h2>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowBookingModal(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getBookingStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">Event Details</h4>
                        <p className="text-sm text-muted-foreground">{selectedBooking.purpose || 'No description provided'}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">Venue</h4>
                        <p className="text-sm">{selectedBooking.venue_name}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">Date & Time</h4>
                        <p className="text-sm">
                          {new Date(selectedBooking.desired_date).toLocaleDateString()}<br />
                          {selectedBooking.start_time} - {selectedBooking.calculated_end_time}<br />
                          Duration: {selectedBooking.duration_hours} hours
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold">Event Type</h4>
                        <p className="text-sm capitalize">{selectedBooking.event_type}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold">Cost</h4>
                        <p className="text-lg font-bold text-green-600">₵{selectedBooking.total_amount}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold">Requested On</h4>
                        <p className="text-sm">{new Date(selectedBooking.created_at).toLocaleDateString()}</p>
                      </div>

                      {selectedBooking.requester_details && (
                        <div>
                          <h4 className="font-semibold">Requester Details</h4>
                          <div className="text-sm space-y-1">
                            <p><span className="font-medium">Name:</span> {selectedBooking.requester_details.full_name}</p>
                            <p><span className="font-medium">Email:</span> {selectedBooking.requester_details.email}</p>
                            <p><span className="font-medium">Contact:</span> {selectedBooking.requester_details.contact_number}</p>
                            {selectedBooking.requester_details.position && (
                              <p><span className="font-medium">Position:</span> {selectedBooking.requester_details.position}</p>
                            )}
                            <p><span className="font-medium">Role:</span> {selectedBooking.requester_details.role}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedBooking.organization && (
                    <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                      <h4 className="font-semibold mb-2">Organization Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {selectedBooking.organization.name}
                        </div>
                        {selectedBooking.organization.address && (
                          <div>
                            <span className="font-medium">Address:</span> {selectedBooking.organization.address}
                          </div>
                        )}
                        {selectedBooking.organization.email && (
                          <div>
                            <span className="font-medium">Email:</span> {selectedBooking.organization.email}
                          </div>
                        )}
                        {selectedBooking.organization.contact_number && (
                          <div>
                            <span className="font-medium">Contact:</span> {selectedBooking.organization.contact_number}
                          </div>
                        )}
                        {selectedBooking.organization.website && (
                          <div>
                            <span className="font-medium">Website:</span> 
                            <a href={selectedBooking.organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                              {selectedBooking.organization.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {selectedBooking.denial_reason && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <h4 className="font-semibold text-red-800">Denial Reason</h4>
                      <p className="text-sm text-red-700">{selectedBooking.denial_reason}</p>
                    </div>
                  )}
                  
                  {selectedBooking.status === 'pending' && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                      <h4 className="font-semibold text-blue-800 mb-3">Action Required</h4>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleApproveBooking(selectedBooking.id)}
                          disabled={loading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {loading ? 'Approving...' : 'Approve'}
                        </Button>
                        <div className="flex-1 flex gap-2">
                          <Input
                            placeholder="Reason for denial (required)"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && e.target.value.trim()) {
                                handleDenyBooking(selectedBooking.id, e.target.value.trim())
                              }
                            }}
                          />
                          <Button 
                            onClick={(e) => {
                              const input = e.target.parentElement.querySelector('input')
                              if (input.value.trim()) {
                                handleDenyBooking(selectedBooking.id, input.value.trim())
                              }
                            }}
                            disabled={loading}
                            variant="destructive"
                          >
                            {loading ? 'Denying...' : 'Deny'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageEvents 