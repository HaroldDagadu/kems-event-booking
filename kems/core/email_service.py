import os
import logging
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags

try:
    from sendgrid import SendGridAPIClient
    from sendgrid.helpers.mail import Mail
except ImportError as e:
    logging.error(f"SendGrid import error: {e}")
    SendGridAPIClient = None
    Mail = None

logger = logging.getLogger(__name__)


class EmailService:
    """
    SendGrid email service for KEMS application
    """
    
    def __init__(self):
        if SendGridAPIClient is None or Mail is None:
            logger.error("SendGrid modules not available")
            raise ImportError("SendGrid not installed or import failed")
            
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        # Use the email associated with the SendGrid account as fallback
        self.from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'dagaduharoldhkd@gmail.com')
        
        # Debug logging
        logger.info(f"SendGrid API Key configured: {'Yes' if self.api_key else 'No'}")
        logger.info(f"From email: {self.from_email}")
        
        if not self.api_key:
            logger.error("SendGrid API key not configured")
            raise ValueError("SendGrid API key is required")
    
    def send_email(self, to_email, subject, html_content, plain_text_content=None):
        """
        Send email using SendGrid
        
        Args:
            to_email (str): Recipient email address
            subject (str): Email subject
            html_content (str): HTML content of the email
            plain_text_content (str): Optional plain text content
        
        Returns:
            bool: True if sent successfully, False otherwise
        """
        try:
            if not plain_text_content:
                plain_text_content = strip_tags(html_content)
            
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_text_content
            )
            
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_booking_confirmation(self, booking_request):
        """
        Send booking confirmation email to outsiders
        
        Args:
            booking_request: BookingRequest instance
        """
        if booking_request.requester.role != 'outsider':
            logger.info(f"Skipping email for non-outsider: {booking_request.requester.email}")
            return False
        
        subject = f"Booking Request Submitted - {booking_request.event_name}"
        
        context = {
            'booking': booking_request,
            'user': booking_request.requester,
            'venue': booking_request.venue,
            'organization': booking_request.organization,
        }
        
        html_content = render_to_string('emails/booking_confirmation.html', context)
        
        return self.send_email(
            to_email=booking_request.requester.email,
            subject=subject,
            html_content=html_content
        )
    
    def send_booking_approval(self, booking_request):
        """
        Send booking approval email to outsiders
        
        Args:
            booking_request: BookingRequest instance
        """
        if booking_request.requester.role != 'outsider':
            logger.info(f"Skipping email for non-outsider: {booking_request.requester.email}")
            return False
        
        subject = f"Booking Request Approved - {booking_request.event_name}"
        
        context = {
            'booking': booking_request,
            'user': booking_request.requester,
            'venue': booking_request.venue,
            'organization': booking_request.organization,
            'amount': booking_request.total_amount,
            'booking_id': booking_request.booking_id,
            'payment_url': f"{settings.FRONTEND_URL}/outsider-login",
        }
        
        html_content = render_to_string('emails/booking_approval.html', context)
        
        return self.send_email(
            to_email=booking_request.requester.email,
            subject=subject,
            html_content=html_content
        )
    
    def send_booking_denial(self, booking_request):
        """
        Send booking denial email to outsiders
        
        Args:
            booking_request: BookingRequest instance
        """
        if booking_request.requester.role != 'outsider':
            logger.info(f"Skipping email for non-outsider: {booking_request.requester.email}")
            return False
        
        subject = f"Booking Request Update - {booking_request.event_name}"
        
        context = {
            'booking': booking_request,
            'user': booking_request.requester,
            'venue': booking_request.venue,
            'organization': booking_request.organization,
            'denial_reason': booking_request.denial_reason,
        }
        
        html_content = render_to_string('emails/booking_denial.html', context)
        
        return self.send_email(
            to_email=booking_request.requester.email,
            subject=subject,
            html_content=html_content
        )
    
    def send_payment_confirmation(self, booking_request):
        """
        Send payment confirmation email to outsiders
        
        Args:
            booking_request: BookingRequest instance
        """
        if booking_request.requester.role != 'outsider':
            logger.info(f"Skipping email for non-outsider: {booking_request.requester.email}")
            return False
        
        subject = f"Payment Confirmed - {booking_request.event_name}"
        
        context = {
            'booking': booking_request,
            'user': booking_request.requester,
            'venue': booking_request.venue,
            'organization': booking_request.organization,
            'amount': booking_request.total_amount,
        }
        
        html_content = render_to_string('emails/payment_confirmation.html', context)
        
        return self.send_email(
            to_email=booking_request.requester.email,
            subject=subject,
            html_content=html_content
        )


# Singleton instance with error handling
try:
    email_service = EmailService()
except (ImportError, ValueError) as e:
    logger.error(f"Failed to initialize EmailService: {e}")
    email_service = None