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
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

function PostEvent() {
  const [activeTab, setActiveTab] = useState('create')
  const [loading, setLoading] = useState(false)
  const [venues, setVenues] = useState([])
  const [tags, setTags] = useState([])
  const [approvedBookings, setApprovedBookings] = useState([])
  const [selectedBooking, setSelectedBooking] = useState(null)
  
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
  const { execute: fetchVenues } = useApi(registrarService.getAllVenues)
  const { execute: fetchTags } = useApi(registrarService.getAllTags)
  const { execute: fetchApprovedBookings } = useApi(registrarService.getAllBookings)
  const { execute: createPublicEvent } = useApi(registrarService.createPublicEvent)
  const { execute: postBookingAsEvent } = useApi(registrarService.postBookingAsEvent)
  
  const { showToast } = useToast()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      
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

      // Fetch approved bookings
      const bookingsResponse = await fetchApprovedBookings({ status: 'approved' })
      if (bookingsResponse.success) {
        setApprovedBookings(bookingsResponse.data || [])
      }
    } catch (error) {
      console.error('Error loading initial data:', error)
      showToast('Error loading data', 'error')
    } finally {
      setLoading(false)
    }
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

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files)
    const newImages = files.map(file => ({
      file,
      caption: '',
      is_primary: imageFiles.length === 0 // First image is primary
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

  const handleCreateEvent = async () => {
    try {
      setLoading(true)
      
      // Prepare form data with images
      const formData = new FormData()
      Object.keys(eventData).forEach(key => {
        if (key === 'tag_ids') {
          // Don't append tag_ids here, handle them separately
          return
        } else if (key === 'end_time') {
          // Ensure end_time is in correct format (HH:MM:SS)
          const timeValue = eventData[key]
          if (timeValue && timeValue.length === 5) { // HH:MM format
            formData.append(key, timeValue + ':00') // Add seconds
          } else {
            formData.append(key, timeValue || '')
          }
        } else if (key === 'images') {
          // Skip images field as we handle them separately
          return
        } else if (key === 'is_paid_event' || key === 'is_public') {
          // Convert boolean to string for FormData
          formData.append(key, eventData[key] ? 'true' : 'false')
        } else {
          formData.append(key, eventData[key] || '')
        }
      })

      // Add tag_ids using multiple fields with same name (DRF standard approach)
      if (eventData.tag_ids && eventData.tag_ids.length > 0) {
        console.log('Adding tag_ids using multiple fields:', eventData.tag_ids)
        eventData.tag_ids.forEach((tagId) => {
          formData.append('tag_ids', tagId.toString())
        })
      }

      // Handle images - send all images
      if (imageFiles.length > 0) {
        console.log('PostEvent(Create) - Processing images:', imageFiles.map(img => ({ is_primary: img.is_primary, caption: img.caption, fileName: img.file?.name })))
        
        let hasPrimary = imageFiles.some(img => img.is_primary)
        console.log('PostEvent(Create) - Has primary image:', hasPrimary)
        
        // If no primary image was set, make the first image primary
        if (!hasPrimary && imageFiles.length > 0) {
          console.log('PostEvent(Create) - Setting first image as primary')
          imageFiles[0].is_primary = true
          hasPrimary = true
        }
        
        imageFiles.forEach((imageFile, index) => {
          console.log(`PostEvent(Create) - Processing image ${index}:`, { is_primary: imageFile.is_primary, file: imageFile.file?.name })
          
          // Send primary image as 'primary_image'
          if (imageFile.is_primary) {
            formData.append('primary_image', imageFile.file)
            formData.append('primary_image_caption', imageFile.caption || '')
            console.log('PostEvent(Create) - Added primary image:', imageFile.file.name)
          } else {
            // Send additional images with index
            formData.append(`additional_image_${index}`, imageFile.file)
            formData.append(`additional_image_${index}_caption`, imageFile.caption || '')
            console.log('PostEvent(Create) - Added additional image:', imageFile.file.name)
          }
        })
      } else {
        console.log('PostEvent(Create) - No images to process')
      }

      // Debug: Log all FormData entries
      console.log('PostEvent(Create) - Final FormData entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value instanceof File ? `File: ${value.name}` : value)
      }

      const response = await createPublicEvent(formData)
      console.log('Event creation response:', response)
      if (response.success) {
        console.log('Created event data:', response.data)
        showToast('Event created successfully!', 'success')
        // Reset form
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
      } else {
        showToast(response.error?.message || 'Failed to create event', 'error')
      }
    } catch (error) {
      console.error('Error creating event:', error)
      showToast('Error creating event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePostBookingAsEvent = async () => {
    if (!selectedBooking) {
      showToast('Please select a booking to post as event', 'error')
      return
    }

    try {
      setLoading(true)
      
      const formData = new FormData()
      Object.keys(eventData).forEach(key => {
        if (key === 'tag_ids') {
          // Don't append tag_ids here, handle them separately
          return
        } else if (key === 'end_time') {
          // Ensure end_time is in correct format (HH:MM:SS)
          const timeValue = eventData[key]
          if (timeValue && timeValue.length === 5) { // HH:MM format
            formData.append(key, timeValue + ':00') // Add seconds
          } else {
            formData.append(key, timeValue || '')
          }
        } else if (key === 'images') {
          // Skip images field as we handle them separately
          return
        } else if (key === 'is_paid_event' || key === 'is_public') {
          // Convert boolean to string for FormData
          formData.append(key, eventData[key] ? 'true' : 'false')
        } else {
          formData.append(key, eventData[key] || '')
        }
      })

      // Add tag_ids using multiple fields with same name (DRF standard approach)
      if (eventData.tag_ids && eventData.tag_ids.length > 0) {
        console.log('Adding tag_ids using multiple fields:', eventData.tag_ids)
        eventData.tag_ids.forEach((tagId) => {
          formData.append('tag_ids', tagId.toString())
        })
      }

      // Debug: Log all FormData entries
      console.log('FormData entries:')
      for (let [key, value] of formData.entries()) {
        console.log(key, ':', value)
      }

      // Handle images - send all images
      if (imageFiles.length > 0) {
        imageFiles.forEach((imageFile, index) => {
          // Send primary image as 'primary_image'
          if (imageFile.is_primary) {
            formData.append('primary_image', imageFile.file)
            formData.append('primary_image_caption', imageFile.caption || '')
          } else {
            // Send additional images with index
            formData.append(`additional_image_${index}`, imageFile.file)
            formData.append(`additional_image_${index}_caption`, imageFile.caption || '')
          }
        })
        
        // If no primary image was set, use the first image as primary
        if (!imageFiles.some(img => img.is_primary) && imageFiles.length > 0) {
          formData.delete('primary_image')
          formData.delete('primary_image_caption')
          formData.append('primary_image', imageFiles[0].file)
          formData.append('primary_image_caption', imageFiles[0].caption || '')
        }
      }

      const response = await postBookingAsEvent(selectedBooking.id, formData)
      console.log('Booking post as event response:', response)
      if (response.success) {
        console.log('Posted event data:', response.data)
        showToast('Booking posted as event successfully!', 'success')
        // Reset form and remove booking from list
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
        setSelectedBooking(null)
        setApprovedBookings(prev => prev.filter(b => b.id !== selectedBooking.id))
      } else {
        showToast(response.error?.message || 'Failed to post booking as event', 'error')
      }
    } catch (error) {
      console.error('Error posting booking as event:', error)
      showToast('Error posting booking as event', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleBookingSelect = (booking) => {
    setSelectedBooking(booking)
    setEventData({
      name: booking.event_name || '',
      description: booking.description || '',
      venue: booking.venue_id || '',
      date: booking.desired_date || '',
      start_time: booking.start_time || '',
      end_time: booking.end_time || '',
      is_public: true,
      tag_ids: [],
      is_paid_event: false,
      images: []
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Event</h1>
            <p className="text-muted-foreground">Create new public events or post approved bookings as events</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'create'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Create New Event
          </button>
          <button
            onClick={() => setActiveTab('booking')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'booking'
                ? 'bg-white text-green-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Post Booking as Event
          </button>
        </div>

        {/* Create New Event Tab */}
        {activeTab === 'create' && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Public Event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
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

              {/* Date and Time */}
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
                  Event Images
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
                                  onChange={() => setPrimaryImage(index)}
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

              <Button
                onClick={handleCreateEvent}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Event...' : 'Create Event'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Post Booking as Event Tab */}
        {activeTab === 'booking' && (
          <div className="space-y-6">
            {/* Approved Bookings List */}
            <Card>
              <CardHeader>
                <CardTitle>Approved Bookings</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedBookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No approved bookings available to post as events
                  </p>
                ) : (
                  <div className="space-y-4">
                    {approvedBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedBooking?.id === booking.id
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handleBookingSelect(booking)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{booking.event_name}</h3>
                            <p className="text-sm text-gray-600">
                              {booking.requester_name} • {booking.venue_name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(booking.desired_date).toLocaleDateString()}
                            </p>
                          </div>
                          {selectedBooking?.id === booking.id && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Form for Selected Booking */}
            {selectedBooking && (
              <Card>
                <CardHeader>
                  <CardTitle>Post Booking as Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
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

                  {/* Images */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Images
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
                                      onChange={() => setPrimaryImage(index)}
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

                  <Button
                    onClick={handlePostBookingAsEvent}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Posting Event...' : 'Post Booking as Event'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default PostEvent 