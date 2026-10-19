import React, { useState } from 'react'
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Heart,
  HeartOff,
  DollarSign,
  Globe,
  Lock,
  Tag
} from 'lucide-react'
import { formatDate, formatTime } from '../../utils/formatters'

const EventDetailsModal = ({ event, isOpen, onClose, onSaveEvent, isSaved = false }) => {
  const [isLoading, setIsLoading] = useState(false)

  // Prepare images for slideshow: prefer full gallery, fallback to single image
  const galleryImages = (event?.images && event.images.length > 0
    ? event.images
        .sort((a, b) => (b.is_primary === true) - (a.is_primary === true))
        .map(img => ({ id: img.id ?? img.image, url: img.image, caption: img.caption || '' }))
    : (event?.image ? [{ id: 'primary', url: event.image, caption: event.name || '' }] : [])
  ).filter(img => !!img.url)

  const [currentIndex, setCurrentIndex] = useState(0)

  const goToPrev = () => {
    setCurrentIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)
  }

  const goToNext = () => {
    setCurrentIndex(prev => (prev + 1) % galleryImages.length)
  }

  if (!isOpen || !event) return null

  const handleSaveToggle = async () => {
    setIsLoading(true)
    try {
      await onSaveEvent(event.id, !isSaved)
    } catch (error) {
      console.error('Error toggling save status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
          <div className="flex items-center gap-2">
            {/* Save/Unsave Button */}
            <button
              onClick={handleSaveToggle}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors ${
                isSaved 
                  ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                  : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={isSaved ? 'Remove from saved events' : 'Save to favorites'}
            >
              {isSaved ? <Heart fill="currentColor" size={20} /> : <Heart size={20} />}
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Image Slideshow */}
          {galleryImages.length > 0 && (
            <div className="mb-6">
              <div className="relative w-full h-64">
                <img
                  src={galleryImages[currentIndex].url}
                  alt={galleryImages[currentIndex].caption || event.name}
                  className="w-full h-64 object-cover rounded-lg"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />

                {/* Controls */}
                {galleryImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      aria-label="Previous image"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                      onClick={goToPrev}
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      aria-label="Next image"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center"
                      onClick={goToNext}
                    >
                      ›
                    </button>
                  </>
                )}
              </div>

              {/* Dots */}
              {galleryImages.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={img.id + '-' + idx}
                      type="button"
                      aria-label={`Go to image ${idx + 1}`}
                      className={`h-2 w-2 rounded-full ${idx === currentIndex ? 'bg-gray-800' : 'bg-gray-300'}`}
                      onClick={() => setCurrentIndex(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Event Title and Type */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                event.is_public 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {event.is_public ? <Globe size={14} /> : <Lock size={14} />}
                {event.is_public ? 'Public Event' : 'Private Event'}
              </span>
            </div>
            
            {event.is_paid_event && (
              <div className="flex items-center gap-1 text-yellow-600">
                <DollarSign size={16} />
                <span className="text-sm font-medium">Paid Event</span>
              </div>
            )}
          </div>

          {/* Event Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {event.description}
            </p>
          </div>

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Date and Time */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Date & Time</h3>
              
              {event.date && (
                <div className="flex items-center gap-3">
                  <Calendar size={18} className="text-gray-500" />
                  <span className="text-gray-700">{formatDate(event.date, 'full')}</span>
                </div>
              )}
              
              {(event.start_time || event.end_time) && (
                <div className="flex items-center gap-3">
                  <Clock size={18} className="text-gray-500" />
                  <span className="text-gray-700">
                    {event.start_time && formatTime(event.start_time)}
                    {event.start_time && event.end_time && ' - '}
                    {event.end_time && formatTime(event.end_time)}
                  </span>
                </div>
              )}
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Location</h3>
              
              {(event.venue?.name || event.venue_name) && (
                <div className="flex items-center gap-3">
                  <MapPin size={18} className="text-gray-500" />
                  <span className="text-gray-700">{event.venue?.name || event.venue_name}</span>
                </div>
              )}
              
              {event.capacity && (
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-gray-500" />
                  <span className="text-gray-700">Capacity: {event.capacity} people</span>
                </div>
              )}
            </div>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={18} />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Removed separate Event Images grid; slideshow above handles images */}

          {/* Organizer Information */}
          {event.organizer_name && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Organized by</h3>
              <p className="text-gray-700">{event.organizer_name}</p>
            </div>
          )}

          {/* Ticket Information */}
          {event.ticket_info_url && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ticket Information</h3>
              <a
                href={event.ticket_info_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-800 underline"
              >
                Get Tickets
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              {event.is_upcoming ? 'Upcoming Event' : 
               event.is_ongoing ? 'Ongoing Event' : 'Past Event'}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDetailsModal