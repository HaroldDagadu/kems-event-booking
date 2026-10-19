"""
Utility functions for KEMS system
Handles external API integrations and common functionality
"""

import secrets
import string
import requests
import logging
import base64

from django.conf import settings

logger = logging.getLogger(__name__)


def send_booking_confirmation_email(booking_request):
    """
    Send booking confirmation email to outsiders when they submit a booking request
    
    Args:
        booking_request: BookingRequest instance
    
    Returns:
        bool: True if email sent successfully
    """
    # Only send confirmation emails to outsiders
    if booking_request.requester.role == 'outsider':
        try:
            from .email_service import email_service
            if email_service is None:
                logger.error("EmailService not available")
                return False
            return email_service.send_booking_confirmation(booking_request)
        except Exception as e:
            logger.error(f"Failed to send booking confirmation email: {e}")
            return False
    else:
        logger.info(f"Skipping confirmation email for insider: {booking_request.requester.email}")
        return True




# DEPRECATED: Gmail API function - replaced with SendGrid
# def send_email_gmail_api(recipient_email, subject, body, html_content=None):
#     """
#     Send email using Gmail API - DEPRECATED
#     Use SendGrid email service instead
#     """
#     pass


def send_sms_hubtel(recipient_number, message):
    """
    Send SMS using Hubtel API
    
    Args:
        recipient_number (str): Recipient's phone number
        message (str): SMS message content
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    try:
        # Hubtel SMS API endpoint
        url = "https://devapi.hubtel.com/v1/messages/send"
        
        # Prepare headers
        headers = {
            'Authorization': f'Basic {base64.b64encode(f"{settings.HUBTEL_API_KEY}:{settings.HUBTEL_API_SECRET}".encode()).decode()}',
            'Content-Type': 'application/json'
        }
        
        # Prepare payload
        payload = {
            'From': settings.HUBTEL_SENDER_ID,
            'To': recipient_number,
            'Content': message,
            'Type': 0,  # Flash SMS = 1, Text SMS = 0
            'RegisteredDelivery': 1  # Request delivery report
        }
        
        # Send the request
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        
        if response.status_code == 200:
            response_data = response.json()
            if response_data.get('ResponseCode') == '0000':
                logger.info(f"SMS sent successfully to {recipient_number}")
                return True
            else:
                logger.error(f"Hubtel API error: {response_data.get('ResponseMessage', 'Unknown error')}")
                return False
        else:
            logger.error(f"HTTP error {response.status_code} when sending SMS to {recipient_number}")
            return False
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error when sending SMS to {recipient_number}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error when sending SMS to {recipient_number}: {str(e)}")
        return False


def generate_temporary_credentials():
    """
    Generate secure temporary login credentials for outsiders
    
    Returns:
        tuple: (username, password) - Both as strings
    """
    try:
        # Generate a unique username
        username_prefix = "temp_user_"
        random_suffix = ''.join(secrets.choice(string.ascii_lowercase + string.digits) for _ in range(8))
        username = username_prefix + random_suffix
        
        # Generate a strong password
        # Include uppercase, lowercase, digits, and special characters
        password_characters = string.ascii_letters + string.digits + "!@#$%^&*"
        password = ''.join(secrets.choice(password_characters) for _ in range(12))
        
        logger.info(f"Generated temporary credentials for username: {username}")
        return username, password
        
    except Exception as e:
        logger.error(f"Error generating temporary credentials: {str(e)}")
        # Fallback to simpler generation
        username = f"temp_user_{secrets.token_hex(4)}"
        password = secrets.token_urlsafe(12)
        return username, password


def send_booking_approval_email(booking_request):
    """
    Send email notification for booking approval
    
    Args:
        booking_request: BookingRequest instance
    
    Returns:
        bool: True if email sent successfully
    """
    # Use SendGrid for outsiders only
    if booking_request.requester.role == 'outsider':
        try:
            from .email_service import email_service
            if email_service is not None:
                return email_service.send_booking_approval(booking_request)
            else:
                logger.error("EmailService not available")
                return False
        except Exception as e:
            logger.error(f"Failed to send booking approval email: {e}")
            return False
    else:
        logger.info(f"Skipping approval email for insider: {booking_request.requester.email}")
        return True


def send_booking_denial_email(booking_request):
    """
    Send email notification for booking denial
    
    Args:
        booking_request: BookingRequest instance
    
    Returns:
        bool: True if email sent successfully
    """
    # Use SendGrid for outsiders only
    if booking_request.requester.role == 'outsider':
        try:
            from .email_service import email_service
            if email_service is not None:
                return email_service.send_booking_denial(booking_request)
            else:
                logger.error("EmailService not available")
                return False
        except Exception as e:
            logger.error(f"Failed to send booking denial email: {e}")
            return False
    else:
        logger.info(f"Skipping denial email for insider: {booking_request.requester.email}")
        return True


def send_temporary_login_email(booking_request, username, password):
    """
    Send temporary login credentials to outsider
    
    Args:
        booking_request: BookingRequest instance
        username (str): Temporary username
        password (str): Temporary password
    
    Returns:
        bool: True if email sent successfully
    """
    subject = f"Temporary Login Credentials for Payment - {booking_request.event_name}"
    
    body = f"""
Dear {booking_request.requester.full_name},

Your booking request for "{booking_request.event_name}" has been approved. Please use the following temporary credentials to access the payment portal:

Login Credentials:
Username: {username}
Password: {password}

Important Notes:
- These credentials are valid for 24 hours only
- Please complete your payment as soon as possible
- Do not share these credentials with anyone

Event Details:
- Event: {booking_request.event_name}
- Venue: {booking_request.venue.name}
- Date: {booking_request.desired_date}
- Amount: ₵{booking_request.total_amount}

Payment Portal: {settings.FRONTEND_URL}/outsider-login

Best regards,
KEMS Team
"""
    
    # Use SendGrid email service instead of Gmail API
    from .email_service import email_service
    if email_service:
        return email_service.send_email(
            to_email=booking_request.requester.email,
            subject=subject,
            html_content=body.replace('\n', '<br>'),
            plain_text_content=body
        )
    else:
        logger.error("EmailService not available")
        return False


def send_payment_confirmation_sms(booking_request):
    """
    Send SMS confirmation for successful payment
    
    Args:
        booking_request: BookingRequest instance
    
    Returns:
        bool: True if SMS sent successfully
    """
    if not booking_request.requester.contact_number:
        logger.warning(f"No contact number for user {booking_request.requester.email}")
        return False
    
    message = f"""
KEMS Payment Confirmed!

Event: {booking_request.event_name}
Venue: {booking_request.venue.name}
Date: {booking_request.desired_date}
Amount: ₵{booking_request.total_amount}

Thank you for your payment. Your booking is now confirmed.
"""
    
    return send_sms_hubtel(
        recipient_number=booking_request.requester.contact_number,
        message=message
    )


def send_invitation_email(invitation):
    """
    Send invitation email for private events
    
    Args:
        invitation: Invitation instance
    
    Returns:
        bool: True if email sent successfully
    """
    recipient_email = invitation.invited_email
    if invitation.invited_user:
        recipient_email = invitation.invited_user.email
    
    subject = f"Invitation: {invitation.event.name}"
    
    body = f"""
Dear {invitation.invited_user.full_name if invitation.invited_user else 'Guest'},

You have been invited to attend the following private event:

Event Details:
- Event: {invitation.event.name}
- Description: {invitation.event.description}
- Venue: {invitation.event.venue.name}
- Date: {invitation.event.date}
- Time: {invitation.event.start_time} - {invitation.event.end_time}

Please log in to your KEMS account to respond to this invitation.

Event Portal: {settings.FRONTEND_URL}/events/invitations

Best regards,
KEMS Team
"""
    
    # Use SendGrid email service instead of Gmail API
    from .email_service import email_service
    if email_service:
        return email_service.send_email(
            to_email=recipient_email,
            subject=subject,
            html_content=body.replace('\n', '<br>'),
            plain_text_content=body
        )
    else:
        logger.error("EmailService not available")
        return False


def send_new_booking_notification_to_registrar(booking_request):
    """
    Log new booking notification (registrars should use dashboard notifications)
    
    Args:
        booking_request: BookingRequest instance
    
    Returns:
        bool: True if logged successfully
    """
    if not booking_request.venue.assigned_registrar:
        logger.warning(f"No assigned registrar for venue {booking_request.venue.name}")
        return False
    
    registrar = booking_request.venue.assigned_registrar
    requester_type = "insider" if booking_request.requester.is_insider else "outsider"
    organization_info = f"Organization: {booking_request.organization.name}" if booking_request.organization else "No organization"
    
    logger.info(f"""
New booking request submitted:
- Event: {booking_request.event_name}
- Venue: {booking_request.venue.name}
- Assigned Registrar: {registrar.full_name} ({registrar.email})
- Requester: {booking_request.requester.full_name} ({booking_request.requester.email})
- Requester Type: {requester_type.title()}
- {organization_info}
- Date: {booking_request.desired_date}
- Time: {booking_request.start_time}
- Duration: {booking_request.duration_hours} hours
- Total Amount: ₵{booking_request.total_amount}
""")
    
    return True 