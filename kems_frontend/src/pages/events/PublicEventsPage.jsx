import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useApi } from '../../hooks/useApi'
import { eventsService } from '../../services/events'
import { Search, Calendar, Clock, MapPin, Users, ExternalLink, Filter } from 'lucide-react'

function PublicEventsPage() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, upcoming, ongoing, past

  // Fetch public events
  const { execute: fetchEvents, loading: eventsLoading } = useApi(eventsService.getAllPublicEvents)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true)
        const response = await fetchEvents()
        if (response.success) {
          setEvents(response.data)
          setFilteredEvents(response.data)
        }
      } catch (error) {
        console.error('Error loading events:', error)
      } finally {
        setLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Filter events based on search term and filter type
  useEffect(() => {
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
    const now = new Date()
    switch (filterType) {
      case 'upcoming':
        filtered = filtered.filter(event => new Date(event.date) > now)
        break
      case 'ongoing':
        filtered = filtered.filter(event => {
          const eventDate = new Date(event.date)
          const eventEnd = new Date(event.date + 'T' + event.end_time)
          return now >= eventDate && now <= eventEnd
        })
        break
      case 'past':
        filtered = filtered.filter(event => {
          const eventEnd = new Date(event.date + 'T' + event.end_time)
          return now > eventEnd
        })
        break
      default:
        // 'all' - no additional filtering
        break
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, filterType])

  const getEventStatus = (event) => {
    const now = new Date()
    const eventDate = new Date(event.date)
    const eventEnd = new Date(event.date + 'T' + event.end_time)

    if (now < eventDate) return { status: 'upcoming', color: 'text-blue-600 bg-blue-100' }
    if (now >= eventDate && now <= eventEnd) return { status: 'ongoing', color: 'text-green-600 bg-green-100' }
    return { status: 'past', color: 'text-gray-600 bg-gray-100' }
  }

  const getEventIcon = (event) => {
    const status = getEventStatus(event)
    switch (status.status) {
      case 'upcoming':
        return <Calendar className="w-4 h-4" />
      case 'ongoing':
        return <Clock className="w-4 h-4" />
      case 'past':
        return <Calendar className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Public Events</h1>
          <p className="text-muted-foreground">Browse all public events at the university</p>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All Events
            </Button>
            <Button
              variant={filterType === 'upcoming' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('upcoming')}
            >
              Upcoming
            </Button>
            <Button
              variant={filterType === 'ongoing' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('ongoing')}
            >
              Ongoing
            </Button>
            <Button
              variant={filterType === 'past' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('past')}
            >
              Past
            </Button>
          </div>
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No events found</h3>
              <p className="text-muted-foreground">
                {searchTerm || filterType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No public events are currently available'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => {
              const status = getEventStatus(event)
              return (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{event.name}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          {getEventIcon(event)}
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

                    {/* Event Images */}
                    {event.images && event.images.length > 0 && (
                      <div className="space-y-2">
                        {/* Primary image */}
                        {(() => {
                          const primaryImage = event.images.find(img => img.is_primary) || event.images[0];
                          return (
                            <div className="relative w-full">
                              <img
                                src={primaryImage.image}
                                alt={primaryImage.caption || event.name}
                                className="w-full h-40 object-cover rounded-lg"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                              {primaryImage.caption && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg">
                                  {primaryImage.caption}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Additional images thumbnails */}
                        {event.images.length > 1 && (
                          <div className="flex gap-2 overflow-x-auto">
                            {event.images.slice(0, 4).map((image, index) => (
                              <img
                                key={image.id}
                                src={image.image}
                                alt={image.caption || `Event image ${index + 1}`}
                                className="w-16 h-16 object-cover rounded border flex-shrink-0"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                }}
                              />
                            ))}
                            {event.images.length > 4 && (
                              <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                                +{event.images.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{event.date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {event.start_time} - {event.end_time}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{event.venue_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>Organized by {event.organizer_name}</span>
                      </div>
                    </div>

                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {event.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="px-2 bg-blue-100 text-blue-800 text-xs rounded-full"
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
                      {event.ticket_info_url && (
                        <Button size="sm" className="flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          Tickets
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Results Summary */}
        {filteredEvents.length > 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Showing {filteredEvents.length} of {events.length} events
          </div>
        )}
      </div>
    </div>
  )
}

export default PublicEventsPage 