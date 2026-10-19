import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { useApi } from '../../hooks/useApi'
import { bookingService } from '../../services/booking'
import { Calendar, Users, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, Eye, Plus } from 'lucide-react'

function RegistrarDashboard() {
  const [stats, setStats] = useState({
    total_bookings: 0,
    pending_bookings: 0,
    approved_bookings: 0,
    denied_bookings: 0,
    total_revenue: 0,
    this_month_revenue: 0,
    upcoming_events: 0,
    today_events: 0
  })

  const [recentBookings, setRecentBookings] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch dashboard statistics
  const { execute: fetchStats, loading: statsLoading } = useApi(bookingService.getDashboardStats)
  const { execute: fetchRecentBookings, loading: bookingsLoading } = useApi(bookingService.getRegistrarBookings)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Fetch statistics
        const statsData = await fetchStats()
        if (statsData.success) {
          setStats(statsData.data)
        }

        // Fetch recent bookings
        const bookingsData = await fetchRecentBookings({ limit: 5 })
        if (bookingsData.success) {
          setRecentBookings(bookingsData.data.slice(0, 5))
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'denied': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'denied': return <XCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
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
          <h1 className="text-3xl font-bold">Registrar Dashboard</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Eye className="w-4 h-4 mr-2" />
            View All Bookings
          </Button>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>
      </div>
      
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_bookings}</div>
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
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_bookings}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting review
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_revenue}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.this_month_revenue} this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming_events}</div>
            <p className="text-xs text-muted-foreground">
              {stats.today_events} today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Booking Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentBookings.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No recent bookings</p>
          ) : (
            <div className="space-y-4">
              {recentBookings.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold">{booking.event_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {booking.requester_name} • {booking.venue_name} • {booking.desired_date}
                    </p>
                    {booking.organization_name && (
                      <p className="text-xs text-muted-foreground">
                        Organization: {booking.organization_name}
                      </p>
                    )}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Revenue Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">This Month</span>
                <span className="font-semibold">{stats.this_month_revenue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Revenue</span>
                <span className="font-semibold">{stats.total_revenue}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Approval Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Approved</span>
                <span className="font-semibold text-green-600">{stats.approved_bookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="font-semibold text-yellow-600">{stats.pending_bookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Denied</span>
                <span className="font-semibold text-red-600">{stats.denied_bookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Event Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Upcoming</span>
                <span className="font-semibold">{stats.upcoming_events}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Today</span>
                <span className="font-semibold">{stats.today_events}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default RegistrarDashboard 