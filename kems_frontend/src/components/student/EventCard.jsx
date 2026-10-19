import React from 'react'
import { Calendar, MapPin, Users } from 'lucide-react'
import { formatDate } from '../../utils/formatters'

const EventCard = ({ event, onEventClick }) => {
  const handleEventClick = () => {
    if (onEventClick) {
      onEventClick(event)
    } else {
      console.log('Event clicked:', event.id)
    }
  }

  return (
    <div className="p-4">
      <div 
        className="flex flex-col items-stretch justify-start rounded-lg bg-white shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
        onClick={handleEventClick}
      >
        {/* Event Image */}
        <div 
          className="w-full bg-center bg-no-repeat aspect-video bg-cover rounded-t-lg"
          style={{ backgroundImage: `url("${event.image}")` }}
        >
          {/* Event Type Badge */}
          <div className="p-3 flex justify-end">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              event.is_public 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {event.is_public ? 'Public' : 'Private'}
            </span>
          </div>
        </div>
        
        {/* Event Content */}
        <div className="flex w-full flex-col gap-3 py-4 px-4">
          {/* Title */}
          <h3 className="text-[#0e1a13] text-lg font-bold leading-tight tracking-[-0.015em]">
            {event.name}
          </h3>
          
          {/* Description */}
          <p className="text-[#51946b] text-base font-normal leading-normal line-clamp-2">
            {event.description}
          </p>
          
          {/* Event Details */}
          <div className="flex flex-col gap-2 text-sm text-[#51946b]">
            {/* Date */}
            {event.date && (
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{formatDate(event.date, 'long')}</span>
              </div>
            )}
            
            {/* Venue */}
            {event.venue && (
              <div className="flex items-center gap-2">
                <MapPin size={16} />
                <span>{event.venue.name}</span>
              </div>
            )}
            
            {/* Attendees or Capacity (if available) */}
            {event.capacity && (
              <div className="flex items-center gap-2">
                <Users size={16} />
                <span>Capacity: {event.capacity}</span>
              </div>
            )}
          </div>
          
          {/* Action Button */}
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {event.is_paid_event ? 'Paid Event' : 'Free Event'}
            </span>
            <button 
              className="text-[#39e079] text-sm font-medium hover:text-[#2ed66b] transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Handle specific action (view details, register, etc.)
                console.log('Action button clicked for event:', event.id)
              }}
            >
              {event.is_public ? 'View Details' : 'Check Invitation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard