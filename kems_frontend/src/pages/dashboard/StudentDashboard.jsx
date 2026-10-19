import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { bookingService } from '../../services/booking'
import { eventsService } from '../../services/events'
import { useAuth } from '../../contexts/AuthContext'
import { Calendar, Clock, MapPin, Users, BookOpen, Plus, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

function StudentDashboard() {
  const [bookings, setBookings] = useState([])
  const [events, setEvents] = useState([])
  const [invitedEvents, setInvitedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  // Fetch student data
  const { execute: fetchBookings, loading: bookingsLoading } = useApi(bookingService.getInsiderBookingStatus)
  const { execute: fetchEvents, loading: eventsLoading } = useApi(eventsService.getEventsForYou)
  const { execute: fetchInvitedEvents, loading: invitedEventsLoading } = useApi(eventsService.getInvitedEvents)
  const { execute: respondToInvitation, loading: responseLoading } = useApi(eventsService.respondToInvitation)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch booking status
        const bookingsResponse = await fetchBookings()
        if (bookingsResponse.success) {
          setBookings(Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [])
        } else {
          setBookings([])
        }

        // Fetch personalized events
        const eventsResponse = await fetchEvents()
        if (eventsResponse.success) {
          setEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : [])
        } else {
          setEvents([])
        }

        // Fetch invited events
        const invitedResponse = await fetchInvitedEvents()
        if (invitedResponse.success) {
          setInvitedEvents(Array.isArray(invitedResponse.data) ? invitedResponse.data : [])
        } else {
          setInvitedEvents([])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setBookings([])
        setEvents([])
        setInvitedEvents([])
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'denied': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'denied': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getUpcomingEvents = () => {
    const now = new Date()
    return events.filter(event => new Date(event.date) > now).slice(0, 3)
  }

  const getPendingInvitations = () => {
    return invitedEvents.filter(invitation => invitation.status === 'pending').slice(0, 3)
  }

  const handleRespondToInvitation = async (invitationId, status) => {
    try {
      const response = await respondToInvitation(invitationId, { status })
      if (response.success) {
        setInvitedEvents(prev => 
          prev.map(inv => 
            inv.id === invitationId 
              ? { ...inv, status: status }
              : inv
          )
        )
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.full_name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All Events
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Book Venue
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">
              All time bookings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">             {bookings.filter(b => b.status === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">             {bookings.filter(b => b.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Confirmed bookings
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getUpcomingEvents().length}</div>
            <p className="text-xs text-muted-foreground">
              Events for you
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Invitations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{getPendingInvitations().length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Booking Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No booking requests yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">{booking.event_name}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {booking.venue_name} • {booking.desired_date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{booking.total_amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.created_at}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent>
            {getUpcomingEvents().length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming events</p>
            ) : (
              <div className="space-y-4">
                {getUpcomingEvents().map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {event.venue_name} • {event.date}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{event.start_time} - {event.end_time}</span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Invitations */}
        <Card>
          <CardHeader>
            <CardTitle>Event Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            {getPendingInvitations().length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No pending invitations</p>
            ) : (
              <div className="space-y-4">
                {getPendingInvitations().map((invitation) => (
                  <div key={invitation.id} className="p-4 border rounded-lg">
                    <div className="flex-1 mb-3">
                      <h3 className="font-semibold">{invitation.event.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {invitation.event.venue_name} • {invitation.event.date}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="w-3 h-3" />
                        <span>{invitation.event.start_time} - {invitation.event.end_time}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleRespondToInvitation(invitation.id, 'accepted')}
                        disabled={responseLoading}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Accept
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => handleRespondToInvitation(invitation.id, 'declined')}
                        disabled={responseLoading}
                      >
                        <XCircle className="w-3 h-3 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Book a Venue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Reserve an auditorium or conference room for your event
            </p>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              New Booking
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Browse Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Discover events happening at the university
            </p>
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Events
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Update your profile and view your information
            </p>
            <Button variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default StudentDashboard 