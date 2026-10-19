import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  LogOut,
  RefreshCw,
  FileText,
  Building
} from 'lucide-react'
import { useToast } from '../../contexts/ToastContext'
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters'
import api from '../../services/api'
import TermsAcceptance from '../../components/terms/TermsAcceptance'
import { PAYSTACK_PUBLIC_KEY } from '../../utils/constants';

const OutsiderDashboard = () => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [termsLoading, setTermsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBookingDetails()
  }, [])

  // Check for payment success message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment') === 'success') {
      showToast('Payment completed successfully! Your booking is now confirmed.', 'success')
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // Refresh booking details when returning from payment
  useEffect(() => {
    const handleFocus = () => {
      fetchBookingDetails()
    }
    
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const fetchBookingDetails = async () => {
    try {
      const response = await api.get('/auth/outsider-booking/')
      setBooking(response.data)
      
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to load booking details'
      setError(errorMessage)
      showToast(errorMessage, 'error')
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        navigate('/outsider-login')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptTerms = async () => {
    if (!booking || booking.terms_accepted) return

    setTermsLoading(true)
    
    try {
      await api.post('/auth/accept-terms/')
      
      setBooking(prevBooking => ({
        ...prevBooking,
        terms_accepted: true
      }))
      
      showToast('Terms and conditions accepted successfully', 'success')
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to accept terms'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setTermsLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!booking || booking.is_paid) return

    if (booking.venue.terms_and_conditions && !booking.terms_accepted) {
      showToast('Please accept the terms and conditions before proceeding with payment', 'warning')
      return
    }

    setPaymentLoading(true)
    
    try {
      const response = await api.post(`/payment-initialize/${booking.booking_id}/`)
      
      if (response.data.access_code) {
        if (!window.PaystackPop) {
          const script = document.createElement('script')
          script.src = 'https://js.paystack.co/v1/inline.js'
          script.onload = () => openPaystackPopup(response.data)
          document.head.appendChild(script)
        } else {
          openPaystackPopup(response.data)
        }
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to initialize payment'
      setError(errorMessage)
      showToast(errorMessage, 'error')
    } finally {
      setPaymentLoading(false)
    }
  }

  const openPaystackPopup = (paymentData) => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: booking.requester.email,
      amount: booking.total_amount * 100,
      currency: 'GHS',
      ref: paymentData.reference,
      metadata: {
        booking_id: booking.booking_id,
        event_name: booking.event_name,
        venue_name: booking.venue.name
      },
      callback: function(response) {
        showToast('Payment successful! Verifying...', 'success')
        window.location.href = `/payment/${booking.booking_id}/verify?reference=${response.reference}`
      },
      onClose: function() {
        showToast('Payment cancelled', 'info')
      }
    })
    
    handler.openIframe()
  }

  const handleRefresh = async () => {
    setLoading(true)
    await fetchBookingDetails()
    showToast('Booking details refreshed', 'success')
  }

  const handleLogout = () => {
    document.cookie = 'temp_access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax'
    showToast('Logged out successfully', 'success')
    navigate('/outsider-login')
  }

  const getStatusColor = (status, isPaid) => {
    if (isPaid) return 'text-black bg-green-100'
    
    switch (status) {
      case 'approved':
        return 'text-black bg-yellow-100'
      case 'pending':
        return 'text-black bg-gray-100'
      case 'denied':
        return 'text-black bg-red-100'
      default:
        return 'text-black bg-gray-100'
    }
  }

  const getStatusIcon = (status, isPaid) => {
    if (isPaid) return <CheckCircle className="w-4 h-4 text-black" />
    
    switch (status) {
      case 'approved': return <Clock className="w-4 h-4 text-black" />
      case 'pending': return <AlertCircle className="w-4 h-4 text-black" />
      case 'denied': return <XCircle className="w-4 h-4 text-black" />
      default: return <AlertCircle className="w-4 h-4 text-black" />
    }
  }

  const getStatusText = (status, isPaid) => {
    if (isPaid) return 'Paid'
    
    switch (status) {
      case 'approved': return 'Payment Pending'
      case 'pending': return 'Under Review'
      case 'denied': return 'Denied'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="mb-2">Error Loading Booking</CardTitle>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate('/outsider-login')}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Booking</h1>
            <p className="text-muted-foreground">Booking ID: {booking?.booking_id}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh} 
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {booking && (
          <>
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Booking Status</span>
                  </div>
                  <div className="flex items-center mt-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mr-2 ${getStatusColor(booking.status, booking.is_paid)}`}>
                      {getStatusText(booking.status, booking.is_paid)}
                    </span>
                    {getStatusIcon(booking.status, booking.is_paid)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Venue</span>
                  </div>
                  <div className="text-lg font-bold mt-1">{booking.venue.name}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Amount</span>
                  </div>
                  <div className="text-lg font-bold text-black mt-1">
                    {formatCurrency(booking.total_amount)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Alerts */}
            {booking.status === 'approved' && !booking.is_paid && (
              <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Your booking has been approved! Please complete payment to confirm your reservation.
              </div>
            )}
            
            {booking.is_paid && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Payment completed successfully! Your booking is confirmed.
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Event Details */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{booking.event_name}</h3>
                      <p className="text-muted-foreground mt-1">{booking.purpose}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.venue.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(booking.desired_date, 'long')}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTime(booking.start_time)} - {formatTime(booking.calculated_end_time)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.duration_hours} hours duration</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.requester.full_name}</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.requester.email}</span>
                    </div>
                    
                    {booking.requester.contact_number && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.requester.contact_number}</span>
                      </div>
                    )}
                    
                    {booking.organization && (
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{booking.organization.name}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Terms and Payment Section */}
              <div className="space-y-6">
                {/* Terms Acceptance */}
                {booking.venue.terms_and_conditions && (
                  <TermsAcceptance
                    terms={booking.venue.terms_and_conditions}
                    isAccepted={booking.terms_accepted}
                    onAccept={handleAcceptTerms}
                    loading={termsLoading}
                    venueName={booking.venue.name}
                  />
                )}
                
                {/* Payment Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <CreditCard className="h-5 w-5" />
                      <span>Payment</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Total Amount:</span>
                        <span className="text-xl font-bold">{formatCurrency(booking.total_amount)}</span>
                      </div>
                    </div>
                    
                    {booking.status === 'approved' && !booking.is_paid && (
                      <Button 
                        onClick={handlePayment}
                        disabled={paymentLoading || (booking.venue.terms_and_conditions && !booking.terms_accepted)}
                        className="w-full"
                        size="lg"
                      >
                        {paymentLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            {booking.venue.terms_and_conditions && !booking.terms_accepted ? 'Accept Terms to Pay' : 'Make Payment'}
                          </>
                        )}
                      </Button>
                    )}
                    
                    {booking.venue.terms_and_conditions && !booking.terms_accepted && booking.status === 'approved' && !booking.is_paid && (
                      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md text-sm">
                        Please accept the venue terms and conditions above before proceeding with payment.
                      </div>
                    )}
                    
                    {booking.is_paid && (
                      <div className="text-center py-4">
                        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                        <p className="text-green-600 font-medium">Payment Completed</p>
                      </div>
                    )}
                    
                    {booking.status !== 'approved' && (
                      <div className="text-center py-4">
                        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
                        <p className="text-yellow-600 font-medium">
                          Payment will be available once booking is approved
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Help Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Need Help?</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      If you have any questions about your booking or payment, please contact us.
                    </p>
                    <Button variant="outline" className="w-full">
                      Contact Support
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default OutsiderDashboard