"""
Unit tests for email functionality
"""

import os
import sys
import django
from django.conf import settings
from django.test import TestCase
from django.contrib.auth import get_user_model
from unittest.mock import patch, MagicMock

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kems_backend.settings')
django.setup()

from booking.models import BookingRequest, Auditorium, Organization
from core.email_service import EmailService

User = get_user_model()


class EmailServiceTest(TestCase):
    """Test cases for EmailService"""
    
    def setUp(self):
        """Set up test data"""
        # Create test user
        self.user = User.objects.create_user(
            email='dagajnr3@gmail.com',
            full_name='Test User',
            contact_number='+233123456789',
            role='outsider'
        )
        
        # Create test registrar
        self.registrar = User.objects.create_user(
            email='reg1@university.edu.gh',
            full_name='Test Registrar',
            role='registrar'
        )
        
        # Create test organization
        self.organization = Organization.objects.create(
            name='Test Organization',
            email='org@test.com'
        )
        
        # Create test auditorium
        self.auditorium = Auditorium.objects.create(
            name='Test Hall',
            outsider_price=500.00,
            insider_price=300.00,
            assigned_registrar=self.registrar
        )
        
        # Create test booking request
        self.booking_request = BookingRequest.objects.create(
            requester=self.user,
            organization=self.organization,
            event_name='Test Event',
            purpose='Testing email functionality',
            venue=self.auditorium,
            desired_date='2024-12-25',
            start_time='10:00:00',
            duration_hours=2.0,
            event_type='public',
            status='pending'
        )
    
    @patch('core.email_service.SendGridAPIClient')
    def test_send_booking_confirmation_email(self, mock_sendgrid):
        """Test sending booking confirmation email"""
        # Mock SendGrid response
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sendgrid_instance = MagicMock()
        mock_sendgrid_instance.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sendgrid_instance
        
        # Create email service
        email_service = EmailService()
        
        # Test sending confirmation email
        result = email_service.send_booking_confirmation(self.booking_request)
        
        # Assertions
        self.assertTrue(result)
        mock_sendgrid.assert_called_once()
        mock_sendgrid_instance.send.assert_called_once()
    
    @patch('core.email_service.SendGridAPIClient')
    def test_send_booking_approval_email(self, mock_sendgrid):
        """Test sending booking approval email"""
        # Mock SendGrid response
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sendgrid_instance = MagicMock()
        mock_sendgrid_instance.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sendgrid_instance
        
        # Create email service and update booking status
        email_service = EmailService()
        self.booking_request.status = 'approved'
        self.booking_request.save()
        
        # Test sending approval email
        result = email_service.send_booking_approval(self.booking_request)
        
        # Assertions
        self.assertTrue(result)
        mock_sendgrid.assert_called_once()
        mock_sendgrid_instance.send.assert_called_once()
    
    @patch('core.email_service.SendGridAPIClient')
    def test_send_booking_denial_email(self, mock_sendgrid):
        """Test sending booking denial email"""
        # Mock SendGrid response
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sendgrid_instance = MagicMock()
        mock_sendgrid_instance.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sendgrid_instance
        
        # Create email service and update booking status
        email_service = EmailService()
        self.booking_request.status = 'denied'
        self.booking_request.denial_reason = 'Venue not available on requested date'
        self.booking_request.save()
        
        # Test sending denial email
        result = email_service.send_booking_denial(self.booking_request)
        
        # Assertions
        self.assertTrue(result)
        mock_sendgrid.assert_called_once()
        mock_sendgrid_instance.send.assert_called_once()
    
    @patch('core.email_service.SendGridAPIClient')
    def test_send_payment_confirmation_email(self, mock_sendgrid):
        """Test sending payment confirmation email"""
        # Mock SendGrid response
        mock_response = MagicMock()
        mock_response.status_code = 202
        mock_sendgrid_instance = MagicMock()
        mock_sendgrid_instance.send.return_value = mock_response
        mock_sendgrid.return_value = mock_sendgrid_instance
        
        # Create email service and update booking status
        email_service = EmailService()
        self.booking_request.status = 'paid'
        self.booking_request.is_paid = True
        self.booking_request.save()
        
        # Test sending payment confirmation email
        result = email_service.send_payment_confirmation(self.booking_request)
        
        # Assertions
        self.assertTrue(result)
        mock_sendgrid.assert_called_once()
        mock_sendgrid_instance.send.assert_called_once()
    
    def test_email_service_initialization_failure(self):
        """Test EmailService initialization with missing API key"""
        # Temporarily remove API key
        original_key = settings.SENDGRID_API_KEY
        settings.SENDGRID_API_KEY = None
        
        # Test initialization failure
        with self.assertRaises(ValueError):
            EmailService()
        
        # Restore API key
        settings.SENDGRID_API_KEY = original_key
    
    @patch('core.email_service.SendGridAPIClient')
    def test_email_sending_failure(self, mock_sendgrid):
        """Test email sending failure handling"""
        # Mock SendGrid to raise exception
        mock_sendgrid_instance = MagicMock()
        mock_sendgrid_instance.send.side_effect = Exception("API Error")
        mock_sendgrid.return_value = mock_sendgrid_instance
        
        # Create email service
        email_service = EmailService()
        
        # Test sending email with failure
        result = email_service.send_booking_confirmation(self.booking_request)
        
        # Assertions
        self.assertFalse(result)
        mock_sendgrid.assert_called_once()
        mock_sendgrid_instance.send.assert_called_once()


def run_email_tests():
    """Run the email tests manually"""
    print("Running email service tests...")
    
    # Import and run test
    from django.test.utils import get_runner
    from django.conf import settings
    
    test_runner = get_runner(settings)()
    failures = test_runner.run_tests(['core.test_email'])
    
    if failures:
        print(f"❌ {failures} test(s) failed")
    else:
        print("✅ All email tests passed!")
    
    return failures == 0


if __name__ == '__main__':
    run_email_tests()