import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import DateRangeFilter from '../../components/ui/DateRangeFilter'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import BookingManagement from '../../components/registrar/BookingManagement'
import PaymentOverview from '../../components/registrar/PaymentOverview'
import PostEvent from './PostEvent'
import ManageEvents from './ManageEvents'
import ManageVenues from './ManageVenues'
import EventCalendar from '../../components/registrar/EventCalendar'

import { 
  BarChart3, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  TrendingUp,
  Building,
  FileText,
  Settings,
  Calendar,
  Plus,
  Edit,
  MapPin
} from 'lucide-react'

function RegistrarDashboard() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [dateFilters, setDateFilters] = useState({ period: 'all_time' })

  // API hooks
  const { execute: fetchStats, loading: statsLoading } = useApi(registrarService.getDashboardStats)
  const { execute: fetchBookings, loading: bookingsLoading } = useApi(registrarService.getAllBookings)

  // Load dashboard data
  const loadDashboardData = async (filters = dateFilters) => {
    try {
      console.log('🔄 RegistrarDashboard: Loading dashboard data...', filters)
      setLoading(true)
      
      // Fetch dashboard statistics with filters
      console.log('📊 RegistrarDashboard: Fetching stats...')
      const statsResponse = await fetchStats(filters)
      console.log('📊 RegistrarDashboard: Stats response:', statsResponse)
      if (statsResponse.success) {
        setStats(statsResponse.data)
      }

      // Fetch recent bookings
      console.log('📋 RegistrarDashboard: Fetching bookings...')
      const bookingsResponse = await fetchBookings()
      console.log('📋 RegistrarDashboard: Bookings response:', bookingsResponse)
      if (bookingsResponse.success) {
        const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : []
        setBookings(bookingsData)
      }
    } catch (error) {
      console.error('❌ RegistrarDashboard: Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('🚀 RegistrarDashboard: Component mounted')
    loadDashboardData()
  }, [])

  // Handle date filter changes
  const handleDateFilterChange = (filters) => {
    console.log('📅 RegistrarDashboard: Date filters changed:', filters)
    setDateFilters(filters)
    loadDashboardData(filters)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-black bg-green-100'
      case 'denied': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'paid': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4 text-black" />
      case 'denied': return <XCircle className="w-4 h-4 text-red-600" />
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'paid': return <DollarSign className="w-4 h-4 text-blue-600" />
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />
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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Registrar Dashboard</h1>
            <p className="text-muted-foreground">Manage all aspects of the KEMS booking system</p>
            {stats?.period_info && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {stats.period_info.period === 'custom' && stats.period_info.start_date && stats.period_info.end_date 
                    ? `${stats.period_info.start_date} to ${stats.period_info.end_date}`
                    : stats.period_info.period.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
                  }
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <DateRangeFilter 
              onFilterChange={handleDateFilterChange}
              initialFilters={dateFilters}
              className="mr-2"
            />
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-lg shadow-sm border overflow-x-auto">
          <Button
            variant={selectedTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('overview')}
          >
            Overview
          </Button>
          <Button
            variant={selectedTab === 'bookings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('bookings')}
          >
            Bookings
          </Button>
          <Button
            variant={selectedTab === 'post-event' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('post-event')}
          >
            <Plus className="w-4 h-4 mr-1" />
            Post Event
          </Button>
          <Button
            variant={selectedTab === 'manage-events' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('manage-events')}
          >
            <Edit className="w-4 h-4 mr-1" />
            Manage Events
          </Button>
          <Button
            variant={selectedTab === 'venues' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('venues')}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Manage Venues
          </Button>
          <Button
            variant={selectedTab === 'payments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('payments')}
          >
            Payments
          </Button>
          <Button
            variant={selectedTab === 'event-calendar' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSelectedTab('event-calendar')}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Event Calendar
          </Button>
        </div>

        {/* Dashboard Content */}
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Bookings</span>
                  </div>
                  <div className="text-2xl font-bold">{stats?.total_bookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    All time bookings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Pending Approvals</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-600">{stats?.pending_bookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Require immediate attention
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {dateFilters.period === 'all_time' ? 'Total Revenue' : 'Period Revenue'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    ₵{(dateFilters.period === 'all_time' 
                        ? stats?.total_revenue 
                        : stats?.period_revenue || 0
                      ).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dateFilters.period === 'all_time' 
                      ? 'All time revenue' 
                      : `Revenue for selected period`
                    }
                  </p>
                  {dateFilters.period !== 'all_time' && stats?.total_revenue > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Total: ₵{stats.total_revenue.toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Upcoming Events</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{stats?.upcoming_events || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Scheduled events
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Approved Bookings</span>
                  </div>
                  <div className="text-2xl font-bold text-black">{stats?.approved_bookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully approved
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Paid Bookings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{stats?.paid_bookings || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Successfully paid
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">This Month Revenue</span>
                  </div>
                  <div className="text-2xl font-bold text-green-700">
                    ₵{(stats?.this_month_revenue || 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Current month total
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
                {bookings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent bookings
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.slice(0, 5).map((booking) => (
                      <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-semibold">{booking.event_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {booking.requester_name} • {booking.venue_name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.desired_date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {getStatusIcon(booking.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === 'bookings' && (
          <BookingManagement />
        )}

        {selectedTab === 'post-event' && (
          <PostEvent />
        )}

        {selectedTab === 'manage-events' && (
          <ManageEvents />
        )}

        {selectedTab === 'venues' && (
          <ManageVenues />
        )}

        {selectedTab === 'payments' && (
          <PaymentOverview />
        )}

        {selectedTab === 'event-calendar' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Calendar</CardTitle>
                <p className="text-muted-foreground">View all approved and paid events scheduled in the calendar</p>
              </CardHeader>
              <CardContent>
                <EventCalendar />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default RegistrarDashboard 