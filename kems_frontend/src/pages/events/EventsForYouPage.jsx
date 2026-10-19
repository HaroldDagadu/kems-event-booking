import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { eventsService } from '../../services/events'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Clock, MapPin, Users, ExternalLink, Heart, Star, Bookmark } from 'lucide-react'

function EventsForYouPage() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const { user } = useAuth()

  // Fetch personalized events
  const { execute: fetchEvents, loading: eventsLoading } = useApi(eventsService.getEventsForYou)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const response = await fetchEvents()
        if (response.success) {
          setEvents(response.data)
        }
      } catch (error) {
        console.error('Error loading personalized events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  const getEventStatus = (event) => {
    const now = new Date()
    const eventDate = new Date(event.date)
    const eventEnd = new Date(event.date + 'T' + event.end_time)

    if (now < eventDate) return { status: 'upcoming', color: 'text-blue-600 bg-blue-100' }
    if (now >= eventDate && now <= eventEnd) return { status: 'ongoing', color: 'text-green-600 bg-green-100' }
    return { status: 'past', color: 'text-gray-600 bg-gray-100' }
  }

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  const handleCloseModal = () => {
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Events For You</h1>
          <p className="text-muted-foreground">
            Personalized events based on your interests and role as {user?.role}
          </p>
        </div>

        {events.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Personalized Events</h3>
              <p className="text-muted-foreground mb-4">
                We're working on finding events that match your interests.
              </p>
              <Button variant="outline">
                Browse Public Events
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Featured Event */}
        {events.length > 0 && (
          <Card className="bg-gradient-to-r from-purple-500 to-pink-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Featured Event</CardTitle>
                  <p className="text-purple-100">Recommended for you</p>
                </div>
                <Star className="w-6 h-6" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{events[0].name}</h3>
                  <p className="text-purple-100 mb-4">
                    {events[0].description}
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{events[0].date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {events[0].start_time} - {events[0].end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{events[0].venue_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <Button
                    className="mb-2"
                    onClick={() => handleEventClick(events[0])}
                  >
                    View Details
                  </Button>
                  <Button variant="outline" className="text-white border-white hover:bg-white hover:text-purple-500">
                    <Bookmark className="w-4 h-4 mr-2" /> Save Event
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.slice(1).map((event) => {
            const status = getEventStatus(event)
            return (
              <Card key={event.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleEventClick(event)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4" />
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.status}
                        </span>
                      </div>
                    </div>
                    {event.is_paid_event && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                        Paid Event
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {event.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{event.date}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>
                        {event.start_time} - {event.end_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>{event.venue_name}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span>Organized by {event.organizer_name}</span>
                    </div>
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Heart className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedEvent.name}</h2>
                <Button variant="outline" size="sm" onClick={handleCloseModal}>
                  ×
                </Button>
              </div>

              <div className="space-y-4">
                <p className="text-muted-foreground">{selectedEvent.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedEvent.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {selectedEvent.start_time} - {selectedEvent.end_time}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.venue_name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Organized by {selectedEvent.organizer_name}</span>
                    </div>
                  </div>

                  {selectedEvent.tags && selectedEvent.tags.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Tags</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedEvent.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button className="flex-1">
                    Register for Event
                  </Button>
                  {selectedEvent.ticket_info_url && (
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" /> Get Tickets
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventsForYouPage 