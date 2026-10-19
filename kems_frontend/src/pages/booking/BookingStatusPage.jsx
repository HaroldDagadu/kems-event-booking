import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Typography, Button as MTButton } from '@material-tailwind/react'
import { useApi } from '../../hooks/useApi'
import { bookingService } from '../../services/booking'
import { Search, Calendar, Clock, MapPin, DollarSign, CheckCircle, XCircle, AlertCircle, Eye, Download, ArrowLeft, Plus } from 'lucide-react'

function BookingStatusPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState()
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)

  // Fetch booking status
  const { execute: fetchBookings, loading: bookingsLoading } = useApi(bookingService.getInsiderBookingStatus)

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true)
        const response = await fetchBookings()
        console.log('BookingStatusPage - API Response:', response)
        console.log('BookingStatusPage - Response data:', response.data)
        console.log('BookingStatusPage - Is array?', Array.isArray(response.data))
        
        if (response.success) {
          // Ensure bookings is always an array
          const bookingsData = Array.isArray(response.data) ? response.data : []
          console.log('BookingStatusPage - Final bookings data:', bookingsData)
          setBookings(bookingsData)
          setFilteredBookings(bookingsData)
        } else {
          // If API call failed, set empty arrays
          console.log('BookingStatusPage - API call failed:', response.error)
          setBookings([])
          setFilteredBookings([])
        }
      } catch (error) {
        console.error('Error loading bookings:', error)
        // On error, set empty arrays
        setBookings([])
        setFilteredBookings([])
      } finally {
        setLoading(false)
      }
    }

    loadBookings()
  }, [])

  // Filter bookings based on search term and status
  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.requester_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter])

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

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking)
  }

  const handleCloseModal = () => {
    setSelectedBooking(null)
  }

  const exportBookings = () => {
    // Implementation for exporting bookings to CSV/PDF
    console.log('Exporting bookings...')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <MTButton
              variant="text"
              className="flex items-center gap-2 text-[#0e1a13]"
              onClick={() => navigate('/academic/dashboard')}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </MTButton>
          </div>
          
          <MTButton
            onClick={() => navigate('/academic/booking/create')}
            className="flex items-center gap-2 bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
          >
            <Plus size={16} />
            New Booking
          </MTButton>
        </div>

        <div className="mb-8">
          <Typography variant="h2" color="blue-gray" className="mb-2">
            Booking Status
          </Typography>
          <Typography color="gray">
            Track your venue booking requests
          </Typography>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportBookings}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            New Booking
          </Button>
        </div>

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search bookings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            variant={statusFilter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            variant={statusFilter === 'approved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('approved')}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === 'denied' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('denied')}
          >
            Denied
          </Button>
        </div>
        </div>

        {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bookings found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'You haven\'t made any booking requests yet'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleBookingClick(booking)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{booking.event_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      {getStatusIcon(booking.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.venue_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.desired_date}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.start_time} - {booking.end_time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.total_amount}</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      <p>Requested on: {booking.created_at}</p>
                      {booking.organization_name && (
                        <p>Organization: {booking.organization_name}</p>
                      )}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Results Summary */}
      {filteredBookings.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </div>
      )}

        {/* Booking Details Modal */}
        {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedBooking.event_name}</h2>
                <Button variant="outline" size="sm" onClick={handleCloseModal}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status}
                  </span>
                  {getStatusIcon(selectedBooking.status)}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Event Details</h4>
                      <p className="text-sm text-muted-foreground">{selectedBooking.purpose}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Venue</h4>
                      <p className="text-sm">{selectedBooking.venue_name}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Date & Time</h4>
                      <p className="text-sm">
                        {selectedBooking.desired_date}<br />
                        {selectedBooking.start_time} - {selectedBooking.end_time}<br />
                        Duration: {selectedBooking.duration_hours} hours
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Cost</h4>
                      <p className="text-lg font-bold text-green-600">{selectedBooking.total_amount}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Event Type</h4>
                      <p className="text-sm capitalize">{selectedBooking.event_type}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Requested On</h4>
                      <p className="text-sm">{selectedBooking.created_at}</p>
                    </div>
                    
                    {selectedBooking.organization_name && (
                      <div>
                        <h4 className="font-semibold">Organization</h4>
                        <p className="text-sm">{selectedBooking.organization_name}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedBooking.denial_reason && (
                  <div className="p-4 bg-red-50 border border-red-200">
                    <h4 className="font-semibold text-red-800">Denial Reason</h4>
                    <p className="text-sm text-red-700">{selectedBooking.denial_reason}</p>
                  </div>
                )}
                
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1">
                    Download Receipt
                  </Button>
                  {selectedBooking.status === 'approved' && (
                    <Button className="flex-1">
                      View Event Details
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default BookingStatusPage 