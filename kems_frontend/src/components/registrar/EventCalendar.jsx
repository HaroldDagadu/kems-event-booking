import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import { ChevronLeft, ChevronRight, MapPin, Clock, Users } from 'lucide-react'

function EventCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)

  // API hook for fetching events
  const { execute: fetchEvents } = useApi(registrarService.getAllBookings)

  // Calendar navigation
  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Fetch events when component mounts or date changes
  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const response = await fetchEvents()
        if (response.success) {
          // Filter only approved and paid events
          const approvedEvents = (response.data || []).filter(
            event => event.status === 'approved' || event.status === 'paid'
          )
          setEvents(approvedEvents)
        }
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [currentDate, fetchEvents])

  // Calendar generation logic
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getEventsForDate = (date) => {
    return events.filter(event => {
      const eventDate = new Date(event.desired_date)
      return (
        eventDate.getDate() === date &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getFullYear() === currentDate.getFullYear()
      )
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getEventColor = (status) => {
    return status === 'paid' ? 'bg-green-500' : 'bg-blue-500'
  }

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="p-2 h-24"></div>)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getEventsForDate(day)
      const isToday = 
        new Date().getDate() === day &&
        new Date().getMonth() === currentDate.getMonth() &&
        new Date().getFullYear() === currentDate.getFullYear()

      days.push(
        <div 
          key={day} 
          className={`p-1 h-24 border border-gray-200 relative overflow-hidden ${
            isToday ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
          }`}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 2).map((event, index) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className={`text-xs p-1 rounded text-white cursor-pointer truncate ${getEventColor(event.status)}`}
                title={event.event_name}
              >
                {event.event_name}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {formatDate(currentDate)}
          </h2>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center space-x-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>Approved Events</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Paid Events</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg border">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7">
          {renderCalendarDays()}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold">{selectedEvent.event_name}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setSelectedEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedEvent.venue_name}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(selectedEvent.desired_date).toLocaleDateString()} 
                    {selectedEvent.start_time && ` at ${selectedEvent.start_time}`}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  <span>Organized by {selectedEvent.requester_name}</span>
                </div>

                {selectedEvent.expected_attendance && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>Expected attendance: {selectedEvent.expected_attendance}</span>
                  </div>
                )}

                <div className="pt-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    selectedEvent.status === 'paid' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selectedEvent.status.charAt(0).toUpperCase() + selectedEvent.status.slice(1)}
                  </span>
                </div>

                {selectedEvent.purpose && (
                  <div className="pt-2">
                    <p className="text-sm text-gray-600">
                      <strong>Purpose:</strong> {selectedEvent.purpose}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default EventCalendar