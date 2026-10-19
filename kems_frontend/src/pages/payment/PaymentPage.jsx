import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardBody, CardHeader, Typography, Button, Input, Spinner, Alert } from '@material-tailwind/react';
import { Calendar, Clock, MapPin, User, Building, CreditCard } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '../../utils/formatters';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';
// Remove PaystackPayment import as we'll use the NPM package
// import { PaystackPayment } from '../../services/payment';

const PaymentPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [inputBookingId, setInputBookingId] = useState(bookingId || '');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails(bookingId);
    } else {
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async (id) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/payment-lookup/${id}/`);
      setBooking(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Booking not found');
      setBooking(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    if (!inputBookingId.trim()) {
      showToast('Please enter a booking ID', 'error');
      return;
    }
    navigate(`/payment/${inputBookingId.trim()}`);
  };

  const handlePayment = async () => {
    if (!booking) return;

    setProcessing(true);

    try {
      // Initialize payment with backend
      const response = await api.post(`/payment-initialize/${booking.booking_id}/`);
      const { access_code } = response.data;

      // Check if PaystackPop is available (loaded via CDN)
      if (!window.PaystackPop) {
        throw new Error('Paystack script not loaded');
      }

      // Use Paystack Popup with access_code from backend
      const popup = new window.PaystackPop();
      popup.resumeTransaction(access_code, {
        onSuccess: (transaction) => {
          showToast('Payment successful! Your booking is confirmed.', 'success');
          // The webhook will handle the backend update
          setTimeout(() => navigate('/'), 2000);
        },
        onCancel: () => {
          showToast('Payment was cancelled', 'info');
          setProcessing(false);
        }
      });

    } catch (error) {
      console.error('Payment error:', error);
      showToast(
        error.response?.data?.error || 'Payment initialization failed. Please try again.', 
        'error'
      );
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-12 w-12 mx-auto mb-4" />
          <Typography>Loading booking details...</Typography>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Typography variant="h3" className="text-blue-900 mb-2">
            Payment Portal
          </Typography>
          <Typography color="gray" className="text-lg">
            Complete your venue booking payment
          </Typography>
        </div>

        {/* Booking ID Input Section */}
        {!booking && !error && (
          <Card className="mb-8">
            <CardHeader floated={false} shadow={false} className="text-center">
              <Typography variant="h5" color="blue-gray">
                Enter Booking ID
              </Typography>
              <Typography color="gray" className="mt-1">
                Enter your booking ID to view details and make payment
              </Typography>
            </CardHeader>
            <CardBody>
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Input
                    label="Booking ID"
                    value={inputBookingId}
                    onChange={(e) => setInputBookingId(e.target.value.toUpperCase())}
                    placeholder="Enter your 8-character booking ID"
                    maxLength={8}
                  />
                </div>
                <Button onClick={handleLookup} className="sm:w-auto w-full">
                  Look Up Booking
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert color="red" className="mb-8">
            <Typography className="font-medium">Booking Not Found</Typography>
            <Typography className="text-sm mt-1">
              {error}. Please check your booking ID and try again.
            </Typography>
          </Alert>
        )}

        {/* Booking Details and Payment */}
        {booking && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Booking Details */}
            <Card>
              <CardHeader floated={false} shadow={false}>
                <Typography variant="h5" color="blue-gray">
                  Booking Details
                </Typography>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  <div>
                    <Typography className="font-medium">{booking.event_name}</Typography>
                    <Typography color="gray" className="text-sm">Event Name</Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-500" />
                  <div>
                    <Typography className="font-medium">{booking.venue_name}</Typography>
                    <Typography color="gray" className="text-sm">Venue</Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div>
                    <Typography className="font-medium">{formatDate(booking.date)}</Typography>
                    <Typography color="gray" className="text-sm">Date</Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-orange-500" />
                  <div>
                    <Typography className="font-medium">
                      {formatTime(booking.start_time)} - {formatTime(booking.calculated_end_time)}
                    </Typography>
                    <Typography color="gray" className="text-sm">
                      Time ({booking.duration_hours} hours)
                    </Typography>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-indigo-500" />
                  <div>
                    <Typography className="font-medium">{booking.requester_name}</Typography>
                    <Typography color="gray" className="text-sm">Organizer</Typography>
                  </div>
                </div>

                {booking.organization && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-teal-500" />
                    <div>
                      <Typography className="font-medium">{booking.organization}</Typography>
                      <Typography color="gray" className="text-sm">Organization</Typography>
                    </div>
                  </div>
                )}

                <div className="border-t pt-4">
                  <Typography variant="h6" color="blue-gray" className="mb-2">
                    Booking ID: {booking.booking_id}
                  </Typography>
                  <Typography color="gray" className="text-sm">
                    Keep this ID for your records
                  </Typography>
                </div>
              </CardBody>
            </Card>

            {/* Payment Section */}
            <Card>
              <CardHeader floated={false} shadow={false}>
                <Typography variant="h5" color="blue-gray">
                  Payment Information
                </Typography>
              </CardHeader>
              <CardBody>
                {booking.is_paid ? (
                  <Alert color="green">
                    <Typography className="font-medium">Payment Completed</Typography>
                    <Typography className="text-sm mt-1">
                      This booking has already been paid for.
                    </Typography>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <Typography color="gray">Venue Booking Fee:</Typography>
                        <Typography className="font-medium">
                          {formatCurrency(booking.total_amount)}
                        </Typography>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold">
                        <Typography>Total Amount:</Typography>
                        <Typography color="green" className="text-2xl">
                          {formatCurrency(booking.total_amount)}
                        </Typography>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Typography variant="h6" color="blue-gray">
                        Payment Method
                      </Typography>
                      <div className="flex items-center gap-2 p-3 border rounded-lg">
                        <CreditCard className="h-5 w-5 text-blue-500" />
                        <Typography>Secure payment via Paystack</Typography>
                      </div>
                      <Typography color="gray" className="text-sm">
                        You can pay with card, mobile money, or bank transfer
                      </Typography>
                    </div>

                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handlePayment}
                      disabled={processing}
                    >
                      {processing ? (
                        <>
                          <Spinner className="h-4 w-4 mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5 mr-2" />
                          Pay {formatCurrency(booking.total_amount)}
                        </>
                      )}
                    </Button>

                    <Typography color="gray" className="text-xs text-center">
                      Your payment is secured by Paystack with 256-bit SSL encryption
                    </Typography>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;