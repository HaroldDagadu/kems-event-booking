import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardBody, CardHeader, Typography, Button, Chip, Dialog, DialogHeader, DialogBody, DialogFooter, Checkbox, Spinner } from '@material-tailwind/react'
import { ArrowLeft, Calendar, Clock, MapPin, Plus, Eye, CreditCard, User, Building, X } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { formatDate, formatTime, formatCurrency } from '../../utils/formatters'
import api from '../../services/api'
import { PAYSTACK_PUBLIC_KEY } from '../../utils/constants';

const StudentBookingsPage = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadBookings()
  }, [])

  const loadBookings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/bookings/insider/status/')
      setBookings(response.data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      showToast('Failed to load bookings', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusChip = (status, isPaid) => {
    if (isPaid) {
      return <Chip color="green" value="Paid" size="sm" />
    }
    
    switch (status) {
      case 'pending':
        return <Chip color="amber" value="Pending" size="sm" />
      case 'approved':
        return <Chip color="blue" value="Approved" size="sm" />
      case 'denied':
        return <Chip color="red" value="Denied" size="sm" />
      default:
        return <Chip color="gray" value={status} size="sm" />
    }
  }

  const handleViewBooking = (booking) => {
    setSelectedBooking(booking)
    setViewDetailsOpen(true)
  }

  const handleCloseViewDetails = () => {
    setViewDetailsOpen(false)
    setSelectedBooking(null)
  }

  const handleOpenPayment = (booking) => {
    setSelectedBooking(booking)
    setPaymentModalOpen(true)
    setTermsAccepted(false)
  }

  const handleClosePayment = () => {
    setPaymentModalOpen(false)
    setSelectedBooking(null)
    setTermsAccepted(false)
    setProcessing(false)
  }

  const handlePayment = async () => {
    if (!selectedBooking || !termsAccepted) {
      showToast('Please accept the terms and conditions', 'error')
      return
    }

    if (!selectedBooking.booking_id) {
      showToast('Booking ID not found. Please refresh the page and try again.', 'error')
      return
    }

    setProcessing(true)

    try {
      const response = await api.post(`/payment-initialize/${selectedBooking.booking_id}/`)
      
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
    } catch (error) {
      console.error('Payment error:', error)
      showToast(
        error.response?.data?.error || 'Payment initialization failed. Please try again.', 
        'error'
      )
      setProcessing(false)
    }
  }

  const openPaystackPopup = (paymentData) => {
    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user?.email || selectedBooking?.requester_email || 'user@example.com',
      amount: selectedBooking.total_amount * 100,
      currency: 'GHS',
      ref: paymentData.reference,
      metadata: {
        booking_id: selectedBooking.booking_id,
        event_name: selectedBooking.event_name,
        venue_name: selectedBooking.venue_name
      },
      callback: function(response) {
        showToast('Payment successful! Verifying...', 'success')
        // Verify payment with backend
        verifyPayment(response.reference)
      },
      onClose: function() {
        showToast('Payment cancelled', 'info')
        setProcessing(false)
      }
    })
    
    handler.openIframe()
  }

  const verifyPayment = async (reference) => {
    try {
      const response = await api.get(`/payment-verify/${selectedBooking.booking_id}/?reference=${reference}`)
      
      if (response.data.status === 'success') {
        showToast('Payment verified successfully! Your booking is now confirmed.', 'success')
        // Reload bookings to reflect payment status
        await loadBookings()
        handleClosePayment()
      } else {
        showToast('Payment verification failed. Please contact support.', 'error')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      showToast('Error verifying payment. Your payment may still be processing.', 'error')
      // Still reload bookings in case webhook already processed
      await loadBookings()
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fbfa] flex items-center justify-center" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-2 text-gray-600">Loading bookings...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f8fbfa] p-6" style={{ fontFamily: '"Spline Sans", "Noto Sans", sans-serif' }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="text"
              className="flex items-center gap-2 text-[#0e1a13]"
              onClick={() => navigate('/academic/dashboard')}
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Button>
          </div>
          
          <Button
            onClick={() => navigate('/booking/create')}
            className="flex items-center gap-2 bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
          >
            <Plus size={16} />
            New Booking
          </Button>
        </div>

        <div className="mb-8">
          <Typography variant="h2" color="blue-gray" className="mb-2">
            My Bookings
          </Typography>
          <Typography color="gray">
            View and manage your venue bookings
          </Typography>
        </div>

        {/* Bookings List */}
        {bookings.length === 0 ? (
          <Card>
            <CardBody className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <Typography variant="h5" color="blue-gray" className="mb-2">
                No bookings found
              </Typography>
              <Typography color="gray" className="mb-4">
                You haven't made any venue bookings yet.
              </Typography>
              <Button
                onClick={() => navigate('/academic/book-venue')}
                className="bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
              >
                Book Your First Venue
              </Button>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Typography variant="h6" color="blue-gray">
                            {booking.event_name}
                          </Typography>
                          <Typography color="gray" className="text-sm">
                            Booking ID: {booking.booking_id || 'Generating...'}
                          </Typography>
                        </div>
                        {getStatusChip(booking.status, booking.is_paid)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin size={16} className="text-gray-500" />
                          <span>{booking.venue_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-500" />
                          <span>{formatDate(booking.desired_date, 'medium')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock size={16} className="text-gray-500" />
                          <span>
                            {formatTime(booking.start_time)} ({booking.duration_hours}h)
                          </span>
                        </div>
                      </div>

                      {booking.purpose && (
                        <Typography color="gray" className="text-sm mt-2 line-clamp-2">
                          {booking.purpose}
                        </Typography>
                      )}

                      {booking.total_amount && (
                        <Typography color="blue-gray" className="text-sm font-medium mt-2">
                          Amount: ₵{booking.total_amount}
                        </Typography>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:w-auto w-full">
                      <Button
                        size="sm"
                        variant="outlined"
                        onClick={() => handleViewBooking(booking)}
                        className="w-full lg:w-auto"
                      >
                        View Details
                      </Button>
                      
                      {booking.status === 'approved' && !booking.is_paid && (
                        <Button
                          size="sm"
                          className="bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13] w-full lg:w-auto"
                          onClick={() => handleOpenPayment(booking)}
                          disabled={!booking.booking_id}
                        >
                          {booking.booking_id ? 'Make Payment' : 'Generating ID...'}
                        </Button>
                      )}

                      {booking.denial_reason && (
                        <Typography color="red" className="text-xs">
                          Reason: {booking.denial_reason}
                        </Typography>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}

        {/* View Details Modal */}
        <Dialog open={viewDetailsOpen} handler={handleCloseViewDetails} size="lg">
          <DialogHeader className="flex justify-between items-center">
            <Typography variant="h4" color="blue-gray">
              Booking Details
            </Typography>
            <Button variant="text" color="blue-gray" onClick={handleCloseViewDetails}>
              <X size={24} />
            </Button>
          </DialogHeader>
          <DialogBody className="space-y-4 max-h-96 overflow-y-auto">
            {selectedBooking && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Event Name</Typography>
                    <Typography color="gray">{selectedBooking.event_name}</Typography>
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Booking ID</Typography>
                    <Typography color="gray">{selectedBooking.booking_id || 'Generating...'}</Typography>
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Venue</Typography>
                    <Typography color="gray">{selectedBooking.venue_name}</Typography>
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Status</Typography>
                    {getStatusChip(selectedBooking.status, selectedBooking.is_paid)}
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Date</Typography>
                    <Typography color="gray">{formatDate(selectedBooking.desired_date, 'full')}</Typography>
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Time</Typography>
                    <Typography color="gray">
                      {formatTime(selectedBooking.start_time)} ({selectedBooking.duration_hours} hours)
                    </Typography>
                  </div>
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Event Type</Typography>
                    <Typography color="gray" className="capitalize">{selectedBooking.event_type}</Typography>
                  </div>
                  {selectedBooking.total_amount && (
                    <div>
                      <Typography color="blue-gray" className="font-medium mb-1">Total Amount</Typography>
                      <Typography color="gray">{formatCurrency(selectedBooking.total_amount)}</Typography>
                    </div>
                  )}
                </div>
                
                {selectedBooking.purpose && (
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Purpose/Description</Typography>
                    <Typography color="gray">{selectedBooking.purpose}</Typography>
                  </div>
                )}
                
                
                {selectedBooking.denial_reason && (
                  <div>
                    <Typography color="red" className="font-medium mb-1">Denial Reason</Typography>
                    <Typography color="red">{selectedBooking.denial_reason}</Typography>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <Typography color="blue-gray" className="font-medium mb-1">Created Date</Typography>
                    <Typography color="gray">{formatDate(selectedBooking.created_at, 'medium')}</Typography>
                  </div>
                  {selectedBooking.updated_at !== selectedBooking.created_at && (
                    <div>
                      <Typography color="blue-gray" className="font-medium mb-1">Last Updated</Typography>
                      <Typography color="gray">{formatDate(selectedBooking.updated_at, 'medium')}</Typography>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outlined" onClick={handleCloseViewDetails}>
              Close
            </Button>
            {selectedBooking && selectedBooking.status === 'approved' && !selectedBooking.is_paid && (
              <Button
                className="ml-2 bg-[#39e079] hover:bg-[#2ed66b] text-[#0e1a13]"
                onClick={() => {
                  handleCloseViewDetails()
                  handleOpenPayment(selectedBooking)
                }}
                disabled={!selectedBooking.booking_id}
              >
                {selectedBooking.booking_id ? 'Make Payment' : 'Generating ID...'}
              </Button>
            )}
          </DialogFooter>
        </Dialog>

        {/* Payment Modal with Terms and Conditions */}
        <Dialog open={paymentModalOpen} handler={handleClosePayment} size="lg">
          <DialogHeader className="flex justify-between items-center">
            <Typography variant="h4" color="blue-gray">
              Payment Confirmation
            </Typography>
            <Button variant="text" color="blue-gray" onClick={handleClosePayment}>
              <X size={24} />
            </Button>
          </DialogHeader>
          <DialogBody className="space-y-4 max-h-96 overflow-y-auto">
            {selectedBooking && (
              <div className="space-y-6">
                {/* Booking Summary */}
                <Card>
                  <CardHeader floated={false} shadow={false}>
                    <Typography variant="h6" color="blue-gray">
                      Booking Summary
                    </Typography>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-blue-500" />
                      <div>
                        <Typography className="font-medium">{selectedBooking.event_name}</Typography>
                        <Typography color="gray" className="text-sm">Event Name</Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-green-500" />
                      <div>
                        <Typography className="font-medium">{selectedBooking.venue_name}</Typography>
                        <Typography color="gray" className="text-sm">Venue</Typography>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <div>
                        <Typography className="font-medium">
                          {formatDate(selectedBooking.desired_date, 'medium')} at {formatTime(selectedBooking.start_time)}
                        </Typography>
                        <Typography color="gray" className="text-sm">
                          Duration: {selectedBooking.duration_hours} hours
                        </Typography>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <Typography variant="h6" color="green" className="text-2xl">
                        Total Amount: {formatCurrency(selectedBooking.total_amount)}
                      </Typography>
                    </div>
                  </CardBody>
                </Card>

                {/* Terms and Conditions */}
                <Card>
                  <CardHeader floated={false} shadow={false}>
                    <Typography variant="h6" color="blue-gray">
                      Terms and Conditions
                    </Typography>
                  </CardHeader>
                  <CardBody>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-48 overflow-y-auto text-sm space-y-3">
                      <Typography color="gray" className="font-medium">
                        KNUST Auditorium Booking Terms and Conditions:
                      </Typography>
                      <div className="space-y-2 text-gray-600">
                        <p>1. Payment must be completed to confirm your booking reservation.</p>
                        <p>2. Cancellations must be made at least 48 hours before the event date for a partial refund (70% of payment).</p>
                        <p>3. The venue must be used for the purpose specified in your booking request.</p>
                        <p>4. You are responsible for any damage to the auditorium or its equipment during your event.</p>
                        <p>5. The university reserves the right to cancel bookings due to unforeseen circumstances.</p>
                        <p>6. No smoking, alcohol, or illegal substances are permitted in the auditorium.</p>
                        <p>7. All events must comply with university policies and local regulations.</p>
                        <p>8. Setup and cleanup must be completed within the booked time period.</p>
                        <p>9. Additional charges may apply for overtime, damages, or extra services.</p>
                        <p>10. By proceeding with payment, you acknowledge that you have read and agree to these terms.</p>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <Checkbox
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          color="green"
                        />
                        <Typography color="gray" className="text-sm">
                          I have read and agree to the university's auditorium booking terms and conditions.
                          By checking this box, I acknowledge that I understand and accept all the terms stated above.
                        </Typography>
                      </label>
                    </div>
                  </CardBody>
                </Card>

                {/* Payment Method */}
                <Card>
                  <CardHeader floated={false} shadow={false}>
                    <Typography variant="h6" color="blue-gray">
                      Payment Method
                    </Typography>
                  </CardHeader>
                  <CardBody>
                    <div className="flex items-center gap-2 p-3 border rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-500" />
                      <Typography>Secure payment via Paystack</Typography>
                    </div>
                    <Typography color="gray" className="text-sm mt-2">
                      You can pay with card, mobile money, or bank transfer
                    </Typography>
                  </CardBody>
                </Card>
              </div>
            )}
          </DialogBody>
          <DialogFooter className="space-x-2">
            <Button variant="outlined" onClick={handleClosePayment}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={handlePayment}
              disabled={!termsAccepted || processing}
            >
              {processing ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5 mr-2" />
                  Pay {selectedBooking && formatCurrency(selectedBooking.total_amount)}
                </>
              )}
            </Button>
          </DialogFooter>
        </Dialog>
      </div>
    </div>
  )
}

export default StudentBookingsPage