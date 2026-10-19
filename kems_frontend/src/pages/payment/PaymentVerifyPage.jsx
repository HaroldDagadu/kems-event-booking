import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardBody, Typography, Button, Spinner, Alert } from '@material-tailwind/react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../services/api';

const PaymentVerifyPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  
  const [verifying, setVerifying] = useState(true);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setError('Payment reference not found');
      setVerifying(false);
      return;
    }

    verifyPayment(reference);
  }, [bookingId, searchParams]);

  const verifyPayment = async (reference) => {
    try {
      setVerifying(true);
      setError(null);
      
      const response = await api.get(`/payment-verify/${bookingId}/?reference=${reference}`);
      
      if (response.data.status === 'success') {
        setVerificationResult({
          success: true,
          message: response.data.message,
          bookingId: response.data.booking_id
        });
        showToast('Payment verified successfully!', 'success');
      } else {
        setError(response.data.error || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleContinue = () => {
    // Check if this is an outsider payment by checking the URL or current path
    const currentPath = window.location.pathname;
    if (currentPath.includes('/payment/') && document.cookie.includes('temp_access_token')) {
      // Redirect to outsider dashboard with success parameter
      if (verificationResult?.success) {
        navigate('/outsider-dashboard?payment=success');
      } else {
        navigate('/outsider-dashboard');
      }
    } else {
      navigate('/');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <Spinner className="h-12 w-12 mx-auto mb-4" />
            <Typography variant="h5" color="blue-gray" className="mb-2">
              Verifying Payment
            </Typography>
            <Typography color="gray">
              Please wait while we verify your payment...
            </Typography>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <Typography variant="h5" color="red" className="mb-2">
              Payment Verification Failed
            </Typography>
            <Typography color="gray" className="mb-6">
              {error}
            </Typography>
            <div className="space-y-3">
              <Button 
                onClick={() => navigate(`/payment/${bookingId}`)}
                variant="outlined"
                className="w-full"
              >
                Try Payment Again
              </Button>
              <Button 
                onClick={handleContinue}
                variant="filled"
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (verificationResult?.success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardBody className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <Typography variant="h5" color="green" className="mb-2">
              Payment Successful!
            </Typography>
            <Typography color="gray" className="mb-4">
              Your booking has been confirmed and paid for.
            </Typography>
            
            <Alert color="green" className="mb-6 text-left">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div>
                  <Typography className="font-medium text-sm">
                    What happens next?
                  </Typography>
                  <Typography className="text-xs mt-1">
                    • You'll receive a confirmation email shortly<br/>
                    • Your booking ID: <strong>{verificationResult.bookingId}</strong><br/>
                    • Keep this for your records
                  </Typography>
                </div>
              </div>
            </Alert>
            
            <Button 
              onClick={handleContinue}
              variant="filled"
              className="w-full"
            >
              Continue to Home
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return null;
};

export default PaymentVerifyPage;