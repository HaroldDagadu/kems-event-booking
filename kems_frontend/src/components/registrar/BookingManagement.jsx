import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { useApi } from '../../hooks/useApi'
import { registrarService } from '../../services/registrar'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Calendar,
  MapPin,
  User,
  Building,
  DollarSign,
  Users,
  UserCheck,
  Crown,
  AlertTriangle
} from 'lucide-react'

function BookingManagement() {
  const [bookings, setBookings] = useState([])
  const [filteredBookings, setFilteredBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [userTypeFilter, setUserTypeFilter] = useState('all')
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [denialReason, setDenialReason] = useState('')

  // API hooks
  const { execute: fetchBookings, loading: bookingsLoading } = useApi(registrarService.getAllBookings)
  const { execute: fetchBookingDetails, loading: detailsLoading } = useApi(registrarService.getBookingDetails)
  const { execute: updateBookingStatus, loading: updateLoading } = useApi(registrarService.updateBookingStatus)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await fetchBookings()
      if (response.success) {
        const bookingsData = Array.isArray(response.data) ? response.data : [...bookings, ...response.data]
        setBookings(bookingsData)
        setFilteredBookings(bookingsData)
      }
    } catch (error) {
      console.error('Error loading bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter bookings based on search, status, and user type
  useEffect(() => {
    let filtered = bookings

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.event_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.requester_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.venue_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Apply user type filter
    if (userTypeFilter !== 'all') {
      if (userTypeFilter === 'insiders') {
        filtered = filtered.filter(booking => 
          booking.requester_details?.role === 'student' ||
          booking.requester_details?.role === 'lecturer' ||
          booking.requester_details?.role === 'registrar'
        )
      } else if (userTypeFilter === 'outsiders') {
        filtered = filtered.filter(booking => 
          booking.requester_details?.role === 'outsider'
        )
      }
    }

    // Sort bookings: Pending insiders first, then pending outsiders, then others by date
    filtered = filtered.sort((a, b) => {
      // Helper function to determine if booking is from insider
      const isInsider = (booking) => {
        const role = booking.requester_details?.role
        return role === 'student' || role === 'lecturer' || role === 'registrar'
      }
      
      // Helper function to get priority score (lower is higher priority)
      const getPriority = (booking) => {
        if (booking.status === 'pending' && isInsider(booking)) return 1
        if (booking.status === 'pending' && !isInsider(booking)) return 2
        if (booking.status === 'approved') return 3
        if (booking.status === 'paid') return 4
        if (booking.status === 'denied') return 5
        return 6
      }
      
      const priorityDiff = getPriority(a) - getPriority(b)
      if (priorityDiff !== 0) return priorityDiff
      
      // If same priority, sort by created date (newest first)
      return new Date(b.created_at) - new Date(a.created_at)
    })

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, statusFilter, userTypeFilter])

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100'
      case 'denied': return 'text-red-600 bg-red-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'paid': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'denied': return <XCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'paid': return <DollarSign className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  // Helper function to determine if booking is from insider
  const isInsiderBooking = (booking) => {
    const role = booking.requester_details?.role
    return role === 'student' || role === 'lecturer' || role === 'registrar'
  }

  // Get user type badge styling
  const getUserTypeBadge = (booking) => {
    if (isInsiderBooking(booking)) {
      return {
        text: 'Insider',
        className: 'bg-blue-100 text-blue-800 border border-blue-200',
        icon: <UserCheck className="w-3 h-3" />
      }
    } else {
      return {
        text: 'Outsider',
        className: 'bg-orange-100 text-orange-800 border border-orange-200',
        icon: <Building className="w-3 h-3" />
      }
    }
  }

  // Get priority indicator
  const getPriorityIndicator = (booking) => {
    if (booking.status === 'pending' && isInsiderBooking(booking)) {
      return {
        show: true,
        className: 'bg-green-100 text-green-800 border border-green-200',
        text: 'High Priority',
        icon: <Crown className="w-3 h-3" />
      }
    } else if (booking.status === 'pending' && !isInsiderBooking(booking)) {
      return {
        show: true,
        className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        text: 'Standard Priority',
        icon: <AlertTriangle className="w-3 h-3" />
      }
    }
    return { show: false }
  }

  const handleViewDetails = async (booking) => {
    try {
      setLoading(true)
      setShowModal(true)
      
      // Fetch full booking details using the detail endpoint
      const response = await fetchBookingDetails(booking.id)
      if (response.success) {
        setSelectedBooking(response.data)
      } else {
        // Fallback to the list data if detail fetch fails
        setSelectedBooking(booking)
        console.error('Failed to fetch booking details:', response.error)
      }
    } catch (error) {
      // Fallback to the list data if there's an error
      setSelectedBooking(booking)
      console.error('Error fetching booking details:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!selectedBooking) return

    setUpdating(true)
    try {
      const response = await updateBookingStatus(selectedBooking.id, { status: 'approved' })
      if (response.success) {
        setShowModal(false)
        setSelectedBooking(null)
        loadBookings() // Refresh the list
      }
    } catch (error) {
      console.error('Error approving booking:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeny = async () => {
    if (!selectedBooking) return

    setUpdating(true)
    try {
      const response = await updateBookingStatus(selectedBooking.id, {
        status: 'denied',
        denial_reason: denialReason
      })
      if (response.success) {
        setShowModal(false)
        setSelectedBooking(null)
        setDenialReason('')
        loadBookings() // Refresh the list
      }
    } catch (error) {
      console.error('Error denying booking:', error)
    } finally {
      setUpdating(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedBooking(null)
    setDenialReason('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search bookings by event, requester, venue, or organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Status Filter */}
          <div className="flex gap-2">
            <Button
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              All Status
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('pending')}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pending
            </Button>
            <Button
              variant={statusFilter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('approved')}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approved
            </Button>
            <Button
              variant={statusFilter === 'denied' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatusFilter('denied')}
            >
              <XCircle className="w-4 h-4 mr-1" />
              Denied
            </Button>
          </div>
          
          {/* User Type Filter */}
          <div className="flex gap-2 border-l pl-2">
            <Button
              variant={userTypeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('all')}
            >
              <Users className="w-4 h-4 mr-1" />
              All Users
            </Button>
            <Button
              variant={userTypeFilter === 'insiders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('insiders')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <UserCheck className="w-4 h-4 mr-1" />
              Insiders
            </Button>
            <Button
              variant={userTypeFilter === 'outsiders' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setUserTypeFilter('outsiders')}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <Building className="w-4 h-4 mr-1" />
              Outsiders
            </Button>
          </div>
        </div>
      </div>
      {/* Results Summary */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground space-y-1">
          <p>Showing {filteredBookings.length} of {bookings.length} bookings</p>
          {filteredBookings.length > 0 && (
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="text-blue-600">
                Insiders: {filteredBookings.filter(b => isInsiderBooking(b)).length}
              </span>
              <span className="text-orange-600">
                Outsiders: {filteredBookings.filter(b => !isInsiderBooking(b)).length}
              </span>
              <span className="text-green-600">
                High Priority: {filteredBookings.filter(b => b.status === 'pending' && isInsiderBooking(b)).length}
              </span>
              <span className="text-yellow-600">
                Standard Priority: {filteredBookings.filter(b => b.status === 'pending' && !isInsiderBooking(b)).length}
              </span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={loadBookings}>
          Refresh
        </Button>
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
                : 'No booking requests available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <Card key={booking.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold">{booking.event_name}</h3>
                      
                      {/* Status Badge */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                      {getStatusIcon(booking.status)}
                      
                      {/* User Type Badge */}
                      {(() => {
                        const userBadge = getUserTypeBadge(booking)
                        return (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${userBadge.className}`}>
                            {userBadge.icon}
                            {userBadge.text}
                          </span>
                        )
                      })()}
                      
                      {/* Priority Indicator */}
                      {(() => {
                        const priority = getPriorityIndicator(booking)
                        return priority.show ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${priority.className}`}>
                            {priority.icon}
                            {priority.text}
                          </span>
                        ) : null
                      })()}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.venue_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{new Date(booking.desired_date).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.requester_name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <span>₵{booking.total_amount}</span>
                      </div>
                    </div>
                    
                    {booking.organization_name && (
                      <div className="mt-2 flex items-center gap-2">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {booking.organization_name}
                        </span>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-muted-foreground space-y-1">
                      <p>Requested on: {new Date(booking.created_at).toLocaleDateString()}</p>
                      {booking.requester_details?.role && (
                        <p className="text-gray-500">
                          Requester role: <span className="capitalize">{booking.requester_details.role}</span>
                          {booking.requester_details.department && (
                            <span> • {booking.requester_details.department}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(booking)}
                  >
                    <Eye className="w-4 h-4 mr-2" /> View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {/* Booking Details Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span className="ml-2">Loading booking details...</span>
                </div>
              ) : selectedBooking ? (
                <>
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{selectedBooking.event_name}</h2>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCloseModal}
                  aria-label="Close modal"
                >
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
                      <p className="text-sm text-muted-foreground">{selectedBooking.purpose || 'No description provided'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Venue</h4>
                      <p className="text-sm">{selectedBooking.venue_name || 'N/A'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Date & Time</h4>
                      <p className="text-sm">
                        {selectedBooking.desired_date ? new Date(selectedBooking.desired_date).toLocaleDateString() : 'N/A'}<br />
                        {selectedBooking.start_time || 'N/A'} - {selectedBooking.calculated_end_time || 'N/A'}<br />
                        Duration: {selectedBooking.duration_hours || 'N/A'} hours
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Event Type</h4>
                      <p className="text-sm capitalize">{selectedBooking.event_type || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold">Cost</h4>
                      <p className="text-lg font-bold text-green-600">₵{selectedBooking.total_amount || '0.00'}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">Requested On</h4>
                      <p className="text-sm">{selectedBooking.created_at ? new Date(selectedBooking.created_at).toLocaleDateString() : 'N/A'}</p>
                    </div>

                    <div>
                      <h4 className="font-semibold">Requester Details</h4>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Name:</span> {selectedBooking.requester_details?.full_name || 'N/A'}</p>
                        <p><span className="font-medium">Email:</span> {selectedBooking.requester_details?.email || 'N/A'}</p>
                        <p><span className="font-medium">Contact:</span> {selectedBooking.requester_details?.contact_number || 'N/A'}</p>
                        <p><span className="font-medium">Position:</span> {selectedBooking.requester_details?.position || 'N/A'}</p>
                        <p><span className="font-medium">Role:</span> {selectedBooking.requester_details?.role || 'N/A'}</p>
                        <p><span className="font-medium">Program:</span> {selectedBooking.requester_details?.program || 'N/A'}</p>
                        <p><span className="font-medium">Department:</span> {selectedBooking.requester_details?.department || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded">
                  <h4 className="font-semibold mb-2">Organization Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Name:</span> {selectedBooking.organization?.name || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Address:</span> {selectedBooking.organization?.address || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Email:</span> {selectedBooking.organization?.email || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Contact:</span> {selectedBooking.organization?.contact_number || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Website:</span> 
                      {selectedBooking.organization?.website ? (
                        <a href={selectedBooking.organization.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {selectedBooking.organization.website}
                        </a>
                      ) : (
                        <span className="ml-1">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedBooking.status === 'denied' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <h4 className="font-semibold text-red-800">Denial Reason</h4>
                    <p className="text-sm text-red-700">{selectedBooking.denial_reason || 'No reason provided'}</p>
                  </div>
                )}
                
                {selectedBooking.status === 'pending' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h4 className="font-semibold text-blue-800 mb-3">Action Required</h4>
                    <div className="flex gap-3">
                      <Button 
                        onClick={handleApprove}
                        disabled={updating}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updating ? 'Approving...' : 'Approve'}
                      </Button>
                      <div className="flex-1">
                        <Input
                          placeholder="Reason for denial (required)"
                          value={denialReason}
                          onChange={(e) => setDenialReason(e.target.value)}
                          className="mb-2"
                          required
                          minLength={10}
                        />
                        <Button 
                          onClick={handleDeny}
                          disabled={updating}
                          variant="destructive"
                          className="w-full"
                        >
                          {updating ? 'Denying...' : 'Deny'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <p>No booking data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingManagement 