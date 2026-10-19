import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useApi } from '../../hooks/useApi'
import { eventsService } from '../../services/events'
import { Search, Calendar, Clock, MapPin, Users, ExternalLink, Filter, Settings, Eye, Edit, Trash2 } from 'lucide-react'

function RegistrarAllEvents() {
  const [events, setEvents] = useState([])
  const [filteredEvents, setFilteredEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all') // all, upcoming, ongoing, past

  // Fetch all events for registrar
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

  const handleManageEvent = (event) => {
    // Navigate to event management page
    console.log('Manage event:', event)
  }

  const handleEditEvent = (event) => {
    // Navigate to event edit page
    console.log('Edit event:', event)
  }

  const handleDeleteEvent = (event) => {
    // Show confirmation dialog and delete event
    console.log('Delete event:', event)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">All Events</h1>
        <p className="text-muted-foreground">Manage and view all events at the university</p>
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
                : 'No events are currently available'
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

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleManageEvent(event)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditEvent(event)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteEvent(event)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default RegistrarAllEvents 