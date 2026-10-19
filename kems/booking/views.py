"""
Views for booking app
"""

import hashlib
import hmac
import json
import logging
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.utils import timezone
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from core.utils import (
    generate_temporary_credentials, send_booking_approval_email,
    send_booking_denial_email, send_temporary_login_email,
    send_payment_confirmation_sms, send_invitation_email,
    send_new_booking_notification_to_registrar, send_booking_confirmation_email
)
from users.permissions import IsRegistrar, IsInsider, IsOutsiderRequester

from .models import (
    Organization, Auditorium, BookingRequest, Payment, 
    Event, Invitation, VenueImage, EventImage
)
from .serializers import (
    OutsiderBookingRequestSerializer, InsiderBookingRequestSerializer,
    BookingRequestListSerializer, BookingRequestDetailSerializer,
    AuditoriumPriceUpdateSerializer, EventSerializer, PaymentSerializer,
    InvitationSerializer, InvitationResponseSerializer,
    InvitationCreateSerializer, AuditoriumSerializer,
    AuditoriumCreateSerializer, AuditoriumUpdateSerializer,
    EventCreateSerializer, EventPostingSerializer,
    VenueImageSerializer, EventImageSerializer
)

User = get_user_model()
logger = logging.getLogger(__name__)


# Booking Request Views
@api_view(['POST'])
@permission_classes([AllowAny])
def outsider_booking_request_create(request):
    """
    View for outsiders to submit booking requests
    """
    serializer = OutsiderBookingRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    booking_request = serializer.save()
    
    # Log the creation
    logger.info(f"Outsider booking request created: {booking_request.id}")
    
    # Send confirmation email to outsider
    try:
        send_booking_confirmation_email(booking_request)
        logger.info(f"Confirmation email sent to outsider for booking request {booking_request.id}")
    except Exception as e:
        logger.error(f"Failed to send confirmation email to outsider: {str(e)}")
    
    # Send notification to assigned registrar
    try:
        send_new_booking_notification_to_registrar(booking_request)
        logger.info(f"Notification sent to registrar for booking request {booking_request.id}")
    except Exception as e:
        logger.error(f"Failed to send notification to registrar: {str(e)}")
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInsider])
def insider_booking_request_create(request):
    """
    View for authenticated insiders to submit booking requests
    """
    serializer = InsiderBookingRequestSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    booking_request = serializer.save()
    
    # Log the creation
    logger.info(f"Insider booking request created: {booking_request.id}")
    
    # Send notification to assigned registrar
    try:
        send_new_booking_notification_to_registrar(booking_request)
        logger.info(f"Notification sent to registrar for booking request {booking_request.id}")
    except Exception as e:
        logger.error(f"Failed to send notification to registrar: {str(e)}")
    
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsInsider])
def insider_booking_status(request):
    """
    View for insiders to see their booking request status
    """
    booking_requests = BookingRequest.objects.filter(requester=request.user)
    
    # Ensure all booking requests have booking_id generated
    for booking in booking_requests:
        if not booking.booking_id:
            booking.generate_booking_id()
    
    serializer = BookingRequestListSerializer(booking_requests, many=True)
    return Response(serializer.data)


# Registrar Dashboard Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRegistrar])
def booking_request_list(request):
    """
    View for registrar to see booking requests for their assigned venues only
    """
    # Only show booking requests for venues assigned to this registrar
    booking_requests = BookingRequest.objects.filter(venue__assigned_registrar=request.user)
    serializer = BookingRequestListSerializer(booking_requests, many=True)
    return Response(serializer.data)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsRegistrar])
def booking_request_detail(request, pk):
    """
    View for registrar to view and update booking request status
    """
    try:
        # Only allow access to booking requests for venues assigned to this registrar
        booking_request = BookingRequest.objects.get(pk=pk, venue__assigned_registrar=request.user)
    except BookingRequest.DoesNotExist:
        return Response({'error': 'Booking request not found or not assigned to you'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = BookingRequestDetailSerializer(booking_request)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        old_status = booking_request.status
        serializer = BookingRequestDetailSerializer(booking_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        booking_request = serializer.save()
        new_status = booking_request.status
        
        # Handle status changes
        if old_status != new_status:
            if new_status == 'approved':
                _handle_approval(booking_request)
            elif new_status == 'denied':
                _handle_denial(booking_request)
        
        return Response(serializer.data)


def _handle_approval(booking_request):
    """Handle booking approval"""
    # Use the end_time directly from the booking request
    from datetime import datetime, timedelta
    start_datetime = datetime.combine(booking_request.desired_date, booking_request.start_time)
    end_datetime = datetime.combine(booking_request.desired_date, booking_request.end_time)
    
    # For events spanning midnight, use 23:59 as end time and add note to description
    if end_datetime.date() > booking_request.desired_date:
        end_time = datetime.strptime("23:59", "%H:%M").time()
        description_with_note = f"{booking_request.purpose}\n\nNote: This event continues until {booking_request.end_time} the next day."
    else:
        end_time = booking_request.end_time
        description_with_note = booking_request.purpose
    
    # Create Event record only if one doesn't already exist
    try:
        event = Event.objects.get(booking_request=booking_request)
        logger.info(f"Event already exists for booking request {booking_request.id}: {event.id}")
    except Event.DoesNotExist:
        event = Event.objects.create(
            name=booking_request.event_name,
            description=description_with_note,
            venue=booking_request.venue,
            date=booking_request.desired_date,
            start_time=booking_request.start_time,
            end_time=end_time,
            is_public=(booking_request.event_type == 'public'),
            organizer=booking_request.requester,
            booking_request=booking_request
        )
        
        # For private events with invitees:
        # - If booking is free (total_amount = 0), create invitations immediately
        # - Otherwise, invitations will be created in the payment success handler
        if (booking_request.event_type == 'private' and 
            booking_request.invited_user_ids and 
            booking_request.total_amount == 0):
            _create_invitations_for_private_event(booking_request)

    # Generate booking ID for payment purposes (for all users) if not already exists
    if not booking_request.booking_id:
        booking_request.generate_booking_id()
    
    # For outsiders, generate temporary login credentials
    if booking_request.requester.is_outsider:
        username, password = generate_temporary_credentials()
        
        # Hash the password before storing
        from django.contrib.auth.hashers import make_password
        booking_request.temporary_login_username = username
        booking_request.temporary_login_password = make_password(password)
        booking_request.login_expiry_date = timezone.now() + timedelta(days=1)
        booking_request.save()
        
        # Send temporary login email
        send_temporary_login_email(booking_request, username, password)
        
        # Also send booking approval email with payment details
        send_booking_approval_email(booking_request)
    else:
        # Send approval email to insider
        send_booking_approval_email(booking_request)

    logger.info(f"Booking request {booking_request.id} approved and event {event.id} created")


def _handle_denial(booking_request):
    """Handle booking denial"""
    send_booking_denial_email(booking_request)
    logger.info(f"Booking request {booking_request.id} denied")


def _create_invitations_for_private_event(booking_request):
    """Create invitations for private events after payment is made"""
    if booking_request.event_type != 'private' or not booking_request.invited_user_ids:
        return
    
    # Get the event associated with this booking request
    try:
        event = Event.objects.get(booking_request=booking_request)
    except Event.DoesNotExist:
        logger.error(f"Event not found for booking request {booking_request.id}")
        return
    
    # Create invitations for each user ID
    for user_id in booking_request.invited_user_ids:
        try:
            invited_user = User.objects.get(id=user_id)
            # Check if invitation already exists to avoid duplicates
            invitation, created = Invitation.objects.get_or_create(
                event=event,
                invited_user=invited_user,
                defaults={
                    'invited_email': invited_user.email
                }
            )
            
            if created:
                # Send invitation email only for newly created invitations
                send_invitation_email(invitation)
                logger.info(f"Invitation sent to {invited_user.email} for event {event.name}")
            else:
                logger.info(f"Invitation already exists for {invited_user.email} for event {event.name}")
                
        except User.DoesNotExist:
            logger.warning(f"User with ID {user_id} not found for invitation")


# Venue Management Views
@api_view(['GET'])
@permission_classes([AllowAny])
def auditorium_list(request):
    """
    📍 List All Auditoriums
    
    This endpoint shows all available auditoriums that can be booked,
    including their capacity, location, and pricing information.
    
    🔓 No authentication required - this is public information.
    """
    auditoriums = Auditorium.objects.filter(is_active=True)
    serializer = AuditoriumSerializer(auditoriums, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsRegistrar])
def registrar_venues_view(request):
    """
    🏢 Registrar Venue Management
    
    GET: List venues assigned to the current registrar
    POST: Create a new venue and assign it to the current registrar
    """
    if request.method == 'GET':
        # List registrar's assigned venues
        auditoriums = Auditorium.objects.filter(assigned_registrar=request.user)
        serializer = AuditoriumSerializer(auditoriums, many=True, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Create new venue
        serializer = AuditoriumCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        auditorium = serializer.save()
        
        logger.info(f"New auditorium created by registrar: {auditorium.name}")
        return Response(AuditoriumSerializer(auditorium, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRegistrar])
def auditorium_detail(request, pk):
    """
    🏢 Manage Venue/Facility
    
    This endpoint allows registrars to view, update, or delete venues assigned to them.
    """
    try:
        # Only allow access to venues assigned to this registrar
        auditorium = Auditorium.objects.get(pk=pk, assigned_registrar=request.user)
    except Auditorium.DoesNotExist:
        return Response({'error': 'Auditorium not found or not assigned to you'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AuditoriumSerializer(auditorium, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = AuditoriumUpdateSerializer(auditorium, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        auditorium = serializer.save()
        
        logger.info(f"Auditorium updated by registrar: {auditorium.name}")
        return Response(AuditoriumSerializer(auditorium, context={'request': request}).data)
    
    elif request.method == 'DELETE':
        auditorium.delete()
        logger.info(f"Auditorium deleted by registrar: {auditorium.name}")
        return Response({'message': 'Auditorium deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated, IsRegistrar])
def auditorium_price_update(request, pk):
    """
    View for registrar to update auditorium prices
    """
    try:
        auditorium = Auditorium.objects.get(pk=pk)
    except Auditorium.DoesNotExist:
        return Response({'error': 'Auditorium not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AuditoriumSerializer(auditorium, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = AuditoriumPriceUpdateSerializer(auditorium, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        auditorium = serializer.save()
        
        logger.info(f"Auditorium prices updated: {auditorium.name}")
        return Response(AuditoriumSerializer(auditorium, context={'request': request}).data)


# Venue Image Management
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRegistrar])
def venue_image_create(request, venue_id):
    """
    📸 Add Image to Venue
    
    This endpoint allows registrars to add images to venues.
    """
    try:
        venue = Auditorium.objects.get(pk=venue_id)
    except Auditorium.DoesNotExist:
        return Response({'error': 'Venue not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = VenueImageSerializer(data=request.data, context={'venue': venue})
    serializer.is_valid(raise_exception=True)
    image = serializer.save(venue=venue)
    
    logger.info(f"Image added to venue: {venue.name}")
    return Response(VenueImageSerializer(image).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRegistrar])
def venue_image_detail(request, venue_id, image_id):
    """
    📸 Manage Venue Image
    
    This endpoint allows registrars to update or delete venue images.
    """
    try:
        venue = Auditorium.objects.get(pk=venue_id)
        image = VenueImage.objects.get(pk=image_id, venue=venue)
    except (Auditorium.DoesNotExist, VenueImage.DoesNotExist):
        return Response({'error': 'Venue or image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = VenueImageSerializer(image, data=request.data, partial=True, context={'venue': venue})
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        
        logger.info(f"Venue image updated: {venue.name}")
        return Response(VenueImageSerializer(image).data)
    
    elif request.method == 'DELETE':
        image.delete()
        logger.info(f"Venue image deleted: {venue.name}")
        return Response({'message': 'Image deleted successfully'}, status=status.HTTP_204_NO_CONTENT)


# Event Posting Views
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRegistrar])
def event_posting_create(request, booking_id):
    """
    📅 Post Approved Booking as Event
    
    This endpoint allows registrars to post approved booking requests as public events.
    """
    try:
        booking_request = BookingRequest.objects.get(pk=booking_id)
    except BookingRequest.DoesNotExist:
        return Response({'error': 'Booking request not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if booking can be posted as event (approved or paid)
    if booking_request.status not in ['approved', 'paid']:
        return Response({
            'error': f'Only approved or paid bookings can be posted as events. Current status: {booking_request.status}'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if booking_request.is_posted:
        return Response({'error': 'This booking has already been posted as an event'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle FormData with image uploads
    from .models import EventImage
    
    data = request.data.copy()
    
    # Handle tag_ids from FormData (array notation)
    tag_ids = []
    for key in request.data.keys():
        if key.startswith('tag_ids['):
            tag_ids.append(int(request.data[key]))
    if tag_ids:
        data['tag_ids'] = tag_ids
    
    serializer = EventPostingSerializer(
        data=data, 
        context={'request': request, 'booking_request': booking_request}
    )
    serializer.is_valid(raise_exception=True)
    event = serializer.save()
    
    # Handle primary image if provided
    if 'primary_image' in request.FILES:
        EventImage.objects.create(
            event=event,
            image=request.FILES['primary_image'],
            caption=data.get('primary_image_caption', ''),
            is_primary=True
        )
    
    # Handle additional images
    for key in request.FILES.keys():
        if key.startswith('additional_image_') and not key.endswith('_caption'):
            image_index = key.replace('additional_image_', '')
            caption_key = f'additional_image_{image_index}_caption'
            
            event_image = EventImage.objects.create(
                event=event,
                image=request.FILES[key],
                caption=data.get(caption_key, ''),
                is_primary=False
            )
            logger.info(f"Created additional image {event_image.id} ({key}) for event {event.name}")
    
    logger.info(f"Event posted by registrar from booking: {booking_request.id}")
    return Response(EventSerializer(event, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsRegistrar])
def public_event_create(request):
    """
    📅 Create New Public Event or List Public Events
    
    GET: List all public events
    POST: Create new public event
    """
    if request.method == 'GET':
        # List public events with pagination
        from django.core.paginator import Paginator
        from .models import Event
        
        page = int(request.GET.get('page', 1))
        page_size = int(request.GET.get('page_size', 10))
        
        events = Event.objects.filter(is_public=True).order_by('-created_at')
        paginator = Paginator(events, page_size)
        
        try:
            page_obj = paginator.page(page)
            events_data = []
            for event in page_obj:
                # Get event images
                images = []
                for image in event.images.all():
                    image_url = None
                    if image.image:
                        # Build full URL for the image
                        image_url = request.build_absolute_uri(image.image.url)
                    
                    images.append({
                        'id': image.id,
                        'image': image_url,
                        'caption': image.caption,
                        'is_primary': image.is_primary
                    })
                
                events_data.append({
                    'id': event.id,
                    'name': event.name,
                    'description': event.description,
                    'date': event.date,
                    'start_time': event.start_time,
                    'end_time': event.end_time,
                    'venue_name': event.venue.name if event.venue else None,
                    'organizer_name': event.organizer.full_name if event.organizer else None,
                    'is_public': event.is_public,
                    'images': images,
                    'created_at': event.created_at
                })
            
            return Response({
                'events': events_data,
                'pagination': {
                    'page': page,
                    'page_size': page_size,
                    'total_pages': paginator.num_pages,
                    'total_events': paginator.count
                }
            })
        except Exception as e:
            return Response({'error': 'Invalid page number'}, status=400)
    
    elif request.method == 'POST':
        # Create new public event
        # Handle FormData with image uploads
        from .models import EventImage
        
        # Debug: Log what we received
        logger.info(f"POST request content type: {request.content_type}")
        logger.info(f"POST request.FILES keys: {list(request.FILES.keys())}")
        logger.info(f"POST request.data keys: {list(request.data.keys())}")
        logger.info(f"POST request.POST keys: {list(request.POST.keys()) if hasattr(request, 'POST') else 'No POST attr'}")
        
        data = request.data.copy()
        
        # Extract tag_ids from FormData and handle separately (like images)
        tag_ids = []
        if 'tag_ids' in request.data:
            tag_ids_raw = request.data.getlist('tag_ids')
            tag_ids = [int(tag_id) for tag_id in tag_ids_raw if tag_id]
            # Remove tag_ids from data to prevent serializer issues
            if 'tag_ids' in data:
                del data['tag_ids']
        
        serializer = EventCreateSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        
        # Handle tag assignment after event creation
        if tag_ids:
            from core.models import Tag
            tags = Tag.objects.filter(id__in=tag_ids)
            event.tags.set(tags)
            logger.info(f"Assigned {len(tags)} tags to event {event.name}: {[tag.name for tag in tags]}")
        
        # Handle primary image if provided
        if 'primary_image' in request.FILES:
            event_image = EventImage.objects.create(
                event=event,
                image=request.FILES['primary_image'],
                caption=data.get('primary_image_caption', ''),
                is_primary=True
            )
            logger.info(f"Created primary image {event_image.id} for event {event.name}")
        else:
            logger.warning(f"No primary_image found in request.FILES for event {event.name}")
        
        # Handle additional images
        for key in request.FILES.keys():
            if key.startswith('additional_image_') and not key.endswith('_caption'):
                image_index = key.replace('additional_image_', '')
                caption_key = f'additional_image_{image_index}_caption'
                
                event_image = EventImage.objects.create(
                    event=event,
                    image=request.FILES[key],
                    caption=data.get(caption_key, ''),
                    is_primary=False
                )
                logger.info(f"Created additional image {event_image.id} ({key}) for event {event.name}")
        
        logger.info(f"New public event created by registrar: {event.name}")
        return Response(EventSerializer(event, context={'request': request}).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRegistrar])
def public_event_detail(request, pk):
    """
    📅 Manage Public Event
    
    This endpoint allows registrars to view, update, or delete public events.
    """
    try:
        # Allow access to events in venues assigned to this registrar OR events posted by this registrar
        event = Event.objects.get(
            pk=pk,
            venue__assigned_registrar=request.user
        )
    except Event.DoesNotExist:
        # Log more details for debugging
        logger.warning(f"Event {pk} not found or not accessible by registrar {request.user.id}. Checking if event exists...")
        try:
            event_exists = Event.objects.get(pk=pk)
            logger.warning(f"Event {pk} exists but is in venue {event_exists.venue.name} assigned to registrar {event_exists.venue.assigned_registrar}")
        except Event.DoesNotExist:
            logger.warning(f"Event {pk} does not exist in database")
        return Response({'error': 'Event not found or not in your assigned venues'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = EventSerializer(event, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = EventSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        
        logger.info(f"Event updated by registrar: {event.name}")
        return Response(EventSerializer(event, context={'request': request}).data)
    
    elif request.method == 'DELETE':
        event_name = event.name  # Store name before deletion
        event.delete()
        logger.info(f"Event deleted by registrar: {event_name}")
        return Response(status=status.HTTP_204_NO_CONTENT)


# Event Image Management
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsRegistrar])
def event_image_create(request, event_id):
    """
    📸 Add Image to Event
    
    This endpoint allows registrars to add images to events.
    """
    try:
        # Check if registrar has permission to manage this event
        event = Event.objects.get(
            pk=event_id,
            venue__assigned_registrar=request.user
        )
    except Event.DoesNotExist:
        logger.warning(f"Event {event_id} not found or not accessible by registrar {request.user.id}")
        return Response({'error': 'Event not found or not in your assigned venues'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = EventImageSerializer(data=request.data, context={'event': event})
    serializer.is_valid(raise_exception=True)
    image = serializer.save(event=event)
    
    logger.info(f"Image added to event: {event.name}")
    return Response(EventImageSerializer(image).data, status=status.HTTP_201_CREATED)


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated, IsRegistrar])
def event_image_detail(request, event_id, image_id):
    """
    📸 Manage Event Image
    
    This endpoint allows registrars to update or delete event images.
    """
    try:
        # Check if registrar has permission to manage this event
        event = Event.objects.get(
            pk=event_id,
            venue__assigned_registrar=request.user
        )
        image = EventImage.objects.get(pk=image_id, event=event)
    except Event.DoesNotExist:
        logger.warning(f"Event {event_id} not found or not accessible by registrar {request.user.id}")
        return Response({'error': 'Event not found or not in your assigned venues'}, status=status.HTTP_404_NOT_FOUND)
    except EventImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'PUT':
        serializer = EventImageSerializer(image, data=request.data, partial=True, context={'event': event})
        serializer.is_valid(raise_exception=True)
        image = serializer.save()
        
        logger.info(f"Event image updated: {event.name}")
        return Response(EventImageSerializer(image).data)
    
    elif request.method == 'DELETE':
        image.delete()
        logger.info(f"Event image deleted: {event.name}")
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRegistrar])
def payment_list(request):
    """
    View for registrar to see payment records for their assigned venues only
    """
    # Only show payments for booking requests in venues assigned to this registrar
    payments = Payment.objects.filter(booking_request__venue__assigned_registrar=request.user)
    serializer = PaymentSerializer(payments, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRegistrar])
def calendar_event_list(request):
    """
    View for registrar to see events in their assigned venues for calendar display
    """
    # Only show events in venues assigned to this registrar
    events = Event.objects.filter(venue__assigned_registrar=request.user)
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data)


# Event Hub Views
@api_view(['GET'])
@permission_classes([IsAuthenticated, IsInsider])
def events_for_you(request):
    """
    🎯 Events For You
    
    This endpoint shows personalized events based on user's followed tags.
    """
    user = request.user
    
    # Get events that match user's followed tags
    followed_tags = user.tags.all() if hasattr(user, 'tags') else []
    
    if followed_tags:
        events = Event.objects.filter(
            tags__in=followed_tags,
            is_public=True
        ).distinct()
    else:
        # If no tags followed, show recent public events
        events = Event.objects.filter(
            is_public=True
        ).order_by('-created_at')[:10]
    
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def all_public_events(request):
    """
    📅 All Public Events
    
    This endpoint shows all public events available to everyone.
    """
    events = Event.objects.filter(is_public=True).order_by('date', 'start_time')
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsInsider])
def invited_events(request):
    """
    📧 Invited Events
    
    This endpoint shows events where the user has been invited.
    """
    invitations = Invitation.objects.filter(
        invited_user=request.user,
        status='pending'
    )
    events = [invitation.event for invitation in invitations]
    serializer = EventSerializer(events, many=True, context={'request': request})
    return Response(serializer.data)


# Invitation Views
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsInsider])
def invitation_create(request):
    """
    📧 Create Invitations
    
    This endpoint allows users to send invitations to private events.
    """
    serializer = InvitationCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    invitations = serializer.save()
    
    # Send invitation emails
    for invitation in invitations:
        send_invitation_email(invitation)
    
    logger.info(f"Invitations created for event: {invitations[0].event.name}")
    return Response(InvitationSerializer(invitations, many=True).data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def invitation_response(request, pk):
    """
    📧 Respond to Invitation
    
    This endpoint allows users to accept or decline invitations.
    """
    try:
        invitation = Invitation.objects.get(pk=pk)
    except Invitation.DoesNotExist:
        return Response({'error': 'Invitation not found'}, status=status.HTTP_404_NOT_FOUND)
    
    serializer = InvitationResponseSerializer(invitation, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    invitation = serializer.save()
    
    logger.info(f"Invitation response: {invitation.status}")
    return Response(InvitationSerializer(invitation).data)


# Paystack Webhook
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def paystack_webhook(request):
    """
    Paystack webhook for payment verification
    """
    try:
        # Verify webhook signature
        signature = request.headers.get('X-Paystack-Signature')
        if not signature:
            return Response({'error': 'Missing signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify signature
        if not _verify_signature(request.body, signature):
            return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse webhook data
        webhook_data = json.loads(request.body)
        event_type = webhook_data.get('event')
        
        if event_type == 'charge.success':
            _handle_successful_payment(webhook_data['data'])
        elif event_type == 'charge.failed':
            _handle_failed_payment(webhook_data['data'])
        
        return Response({'status': 'success'})
        
    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        return Response({'error': 'Webhook processing failed'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _verify_signature(payload, signature):
    """Verify Paystack webhook signature"""
    secret = settings.PAYSTACK_SECRET_KEY
    computed_signature = hmac.new(
        secret.encode('utf-8'),
        payload,
        hashlib.sha512
    ).hexdigest()
    
    return hmac.compare_digest(computed_signature, signature)


def _handle_successful_payment(payment_data):
    """Handle successful payment"""
    try:
        # Find the booking request - try booking_id from metadata first, then reference
        booking_request = None
        
        # Check if metadata contains booking_id
        if 'metadata' in payment_data and 'booking_id' in payment_data['metadata']:
            try:
                booking_request = BookingRequest.objects.get(
                    booking_id=payment_data['metadata']['booking_id']
                )
            except BookingRequest.DoesNotExist:
                pass
        
        # Fallback to paystack_reference if booking_id lookup failed
        if not booking_request:
            booking_request = BookingRequest.objects.get(
                paystack_reference=payment_data['reference']
            )
        
        # Create payment record
        payment = Payment.objects.create(
            booking_request=booking_request,
            amount=payment_data['amount'] / 100,  # Convert from kobo to naira
            paystack_transaction_id=payment_data['id'],
            status='successful'
        )
        
        # Update booking request
        booking_request.is_paid = True
        booking_request.status = 'paid'
        booking_request.save()
        
        # Send payment confirmation email (especially for outsiders)
        if booking_request.requester.role == 'outsider':
            try:
                from core.email_service import email_service
                email_service.send_payment_confirmation(booking_request)
                logger.info(f"Payment confirmation email sent for booking: {booking_request.id}")
            except Exception as e:
                logger.error(f"Failed to send payment confirmation email: {str(e)}")
        
        # Send confirmation SMS
        if booking_request.requester.contact_number:
            send_payment_confirmation_sms(booking_request)
        
        # Create invitations for private events now that payment is complete
        _create_invitations_for_private_event(booking_request)
        
        logger.info(f"Payment successful for booking: {booking_request.id}")
        
    except BookingRequest.DoesNotExist:
        logger.error(f"Booking request not found for payment: {payment_data['reference']}")


def _handle_failed_payment(payment_data):
    """Handle failed payment"""
    logger.error(f"Payment failed: {payment_data}")


@api_view(['GET'])
@permission_classes([AllowAny])
def get_auditoriums(request):
    """
    Helper endpoint for getting auditorium list
    """
    auditoriums = Auditorium.objects.filter(is_active=True)
    serializer = AuditoriumSerializer(auditoriums, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def payment_lookup(request, booking_id):
    """
    Look up booking details by booking ID for payment
    """
    try:
        booking = BookingRequest.objects.get(
            booking_id=booking_id,
            status='approved'
        )
        
        # Return booking details for payment
        data = {
            'booking_id': booking.booking_id,
            'event_name': booking.event_name,
            'venue_name': booking.venue.name,
            'date': booking.desired_date,
            'start_time': booking.start_time,
            'calculated_end_time': booking.end_time,
            'duration_hours': booking.duration_hours,  # This is calculated from start_time and end_time
            'total_amount': booking.total_amount,
            'organization': booking.organization.name if booking.organization else None,
            'requester_name': booking.requester.full_name,
            'requester_email': booking.requester.email,
            'is_paid': booking.is_paid,
        }
        
        return Response(data)
        
    except BookingRequest.DoesNotExist:
        return Response(
            {'error': 'Booking not found or not approved for payment'}, 
            status=404
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def initialize_payment(request, booking_id):
    """
    Initialize Paystack payment for a booking
    """
    try:
        booking = BookingRequest.objects.get(
            booking_id=booking_id,
            status='approved'
        )
        
        if booking.is_paid:
            return Response(
                {'error': 'This booking has already been paid for'}, 
                status=400
            )
        
        # Generate unique transaction reference
        import time
        reference = f"KEMS_{booking.booking_id}_{int(time.time())}"
        
        # Prepare Paystack initialization data
        paystack_data = {
            'email': booking.requester.email,
            'amount': int(booking.total_amount * 100),  # Convert to kobo
            'reference': reference,
            'callback_url': f"{settings.FRONTEND_URL}/payment/{booking.booking_id}/verify",
            'metadata': {
                'booking_id': booking.booking_id,
                'event_name': booking.event_name,
                'venue_name': booking.venue.name,
                'cancel_action': f"{settings.FRONTEND_URL}/payment/{booking.booking_id}"
            }
        }
        
        # Make request to Paystack Initialize Transaction API
        import requests
        paystack_url = "https://api.paystack.co/transaction/initialize"
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(paystack_url, json=paystack_data, headers=headers)
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response['status']:
                # Store the reference in the booking for later verification
                booking.paystack_reference = reference
                booking.save(update_fields=['paystack_reference'])
                
                return Response({
                    'access_code': paystack_response['data']['access_code'],
                    'authorization_url': paystack_response['data']['authorization_url'],
                    'reference': reference
                })
            else:
                return Response(
                    {'error': 'Failed to initialize payment'}, 
                    status=400
                )
        else:
            logger.error(f"Paystack API error: {response.text}")
            return Response(
                {'error': 'Payment service unavailable'}, 
                status=503
            )
        
    except BookingRequest.DoesNotExist:
        return Response(
            {'error': 'Booking not found or not approved for payment'}, 
            status=404
        )
    except Exception as e:
        logger.error(f"Payment initialization error: {str(e)}")
        return Response(
            {'error': f'Payment initialization failed: {str(e)}'}, 
            status=500
        )


@api_view(['GET'])
@permission_classes([AllowAny])
def verify_payment(request, booking_id):
    """
    Verify payment and redirect appropriately
    """
    reference = request.GET.get('reference')
    
    if not reference:
        return Response(
            {'error': 'Payment reference not provided'}, 
            status=400
        )
    
    try:
        booking = BookingRequest.objects.get(
            booking_id=booking_id,
            paystack_reference=reference
        )
        
        # Make request to Paystack Verify Transaction API
        import requests
        paystack_url = f"https://api.paystack.co/transaction/verify/{reference}"
        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
        }
        
        response = requests.get(paystack_url, headers=headers)
        
        if response.status_code == 200:
            paystack_response = response.json()
            
            if paystack_response['status'] and paystack_response['data']['status'] == 'success':
                # Verify amount matches
                expected_amount = int(booking.total_amount * 100)
                actual_amount = paystack_response['data']['amount']
                
                if actual_amount == expected_amount:
                    # Payment verified - update booking
                    if not booking.is_paid:
                        # Create payment record
                        payment = Payment.objects.create(
                            booking_request=booking,
                            amount=booking.total_amount,
                            paystack_transaction_id=paystack_response['data']['id'],
                            status='successful'
                        )
                        
                        # Update booking request
                        booking.is_paid = True
                        booking.status = 'paid'
                        booking.save()
                        
                        # Send confirmation emails
                        if booking.requester.role == 'outsider':
                            try:
                                from core.email_service import email_service
                                email_service.send_payment_confirmation(booking)
                            except Exception as e:
                                logger.error(f"Failed to send payment confirmation email: {str(e)}")
                        
                        # Create invitations for private events now that payment is complete
                        _create_invitations_for_private_event(booking)
                    
                    return Response({
                        'status': 'success',
                        'message': 'Payment verified successfully',
                        'booking_id': booking.booking_id,
                        'is_paid': True
                    })
                else:
                    logger.error(f"Amount mismatch: expected {expected_amount}, got {actual_amount}")
                    return Response(
                        {'error': 'Payment amount verification failed'}, 
                        status=400
                    )
            else:
                return Response(
                    {'error': 'Payment verification failed'}, 
                    status=400
                )
        else:
            logger.error(f"Paystack verify API error: {response.text}")
            return Response(
                {'error': 'Payment verification service unavailable'}, 
                status=503
            )
        
    except BookingRequest.DoesNotExist:
        return Response(
            {'error': 'Booking not found for payment verification'}, 
            status=404
        )
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        return Response(
            {'error': 'Payment verification failed'}, 
            status=500
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsRegistrar])
def dashboard_stats(request):
    """
    📊 Dashboard Statistics for Registrar's Assigned Venues
    
    This endpoint provides statistics only for venues assigned to the current registrar.
    Supports date range filtering via query parameters:
    - start_date: YYYY-MM-DD format
    - end_date: YYYY-MM-DD format
    - period: 'today', 'this_week', 'this_month', 'this_year', 'all_time'
    """
    from django.db.models import Sum, Q
    from datetime import datetime, timedelta
    
    # Filter all statistics by venues assigned to this registrar
    registrar_venues = Auditorium.objects.filter(assigned_registrar=request.user)
    registrar_venue_ids = registrar_venues.values_list('id', flat=True)
    
    # Get date filtering parameters
    start_date = request.GET.get('start_date')
    end_date = request.GET.get('end_date')
    period = request.GET.get('period', 'all_time')
    
    # Calculate date range based on period
    now = timezone.now()
    date_filter = Q()
    
    if period == 'today':
        start_date = now.date()
        end_date = now.date()
    elif period == 'this_week':
        start_date = now.date() - timedelta(days=now.weekday())
        end_date = now.date()
    elif period == 'this_month':
        start_date = now.date().replace(day=1)
        end_date = now.date()
    elif period == 'this_year':
        start_date = now.date().replace(month=1, day=1)
        end_date = now.date()
    elif start_date and end_date:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            start_date = None
            end_date = None
    
    # Apply date filtering if dates are provided
    if start_date and end_date:
        date_filter = Q(created_at__date__gte=start_date, created_at__date__lte=end_date)
    
    # Base queries with venue filtering
    base_bookings = BookingRequest.objects.filter(venue__in=registrar_venue_ids)
    base_payments = Payment.objects.filter(booking_request__venue__in=registrar_venue_ids)
    base_events = Event.objects.filter(venue__in=registrar_venue_ids)
    
    # Apply date filtering for period-specific stats
    filtered_bookings = base_bookings.filter(date_filter) if start_date and end_date else base_bookings
    filtered_payments = base_payments.filter(date_filter) if start_date and end_date else base_payments
    
    # Basic counts
    total_bookings = base_bookings.count()
    pending_bookings = base_bookings.filter(status='pending').count()
    approved_bookings = base_bookings.filter(status='approved').count()
    paid_bookings = base_bookings.filter(status='paid').count()
    denied_bookings = base_bookings.filter(status='denied').count()
    total_events = base_events.count()
    total_venues = registrar_venues.count()
    active_venues = registrar_venues.filter(is_active=True).count()
    
    # Revenue calculations
    total_revenue = base_payments.filter(status='successful').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    period_revenue = filtered_payments.filter(status='successful').aggregate(
        total=Sum('amount')
    )['total'] or 0
    
    # This month revenue for comparison
    this_month_start = now.date().replace(day=1)
    this_month_revenue = base_payments.filter(
        status='successful',
        payment_date__date__gte=this_month_start,
        payment_date__date__lte=now.date()
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Upcoming events (within next 30 days)
    upcoming_events = base_events.filter(
        date__gte=now.date(),
        date__lte=now.date() + timedelta(days=30)
    ).count()
    
    stats = {
        'total_bookings': total_bookings,
        'pending_bookings': pending_bookings,
        'approved_bookings': approved_bookings,
        'paid_bookings': paid_bookings,
        'denied_bookings': denied_bookings,
        'total_events': total_events,
        'upcoming_events': upcoming_events,
        'total_venues': total_venues,
        'active_venues': active_venues,
        'total_revenue': float(total_revenue),
        'period_revenue': float(period_revenue),
        'this_month_revenue': float(this_month_revenue),
        'period_info': {
            'period': period,
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat() if end_date else None,
        }
    }
    
    return Response(stats)


# ====================
# SAVED EVENTS API
# ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def saved_events_list(request):
    """
    📌 Get User's Saved Events
    
    Returns all events saved by the current user as favorites.
    """
    try:
        from core.models import SavedEvent
        
        # Get saved events for the current user
        saved_events = SavedEvent.objects.filter(
            user=request.user
        ).select_related('event', 'event__venue').prefetch_related('event__tags', 'event__images')
        
        events_data = []
        for saved_event in saved_events:
            event = saved_event.event
            
            # Serialize the event data with images
            serializer = EventSerializer(event, context={'request': request})
            event_data = serializer.data
            event_data['saved_at'] = saved_event.saved_at.isoformat()
            events_data.append(event_data)
        
        logger.info(f"User {request.user.id} retrieved {len(events_data)} saved events")
        return Response(events_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error retrieving saved events for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to retrieve saved events'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def save_event(request, event_id):
    """
    ❤️ Save Event to Favorites
    
    Adds an event to the user's saved events list.
    """
    try:
        from core.models import SavedEvent
        
        # Check if event exists
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create or get the saved event record
        saved_event, created = SavedEvent.objects.get_or_create(
            user=request.user,
            event=event
        )
        
        if created:
            logger.info(f"User {request.user.id} saved event {event.id} ({event.name})")
            return Response(
                {'message': 'Event saved successfully', 'saved_at': saved_event.saved_at.isoformat()}, 
                status=status.HTTP_201_CREATED
            )
        else:
            # Already saved
            return Response(
                {'message': 'Event already in favorites', 'saved_at': saved_event.saved_at.isoformat()}, 
                status=status.HTTP_200_OK
            )
            
    except Exception as e:
        logger.error(f"Error saving event {event_id} for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to save event'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unsave_event(request, event_id):
    """
    💔 Remove Event from Favorites
    
    Removes an event from the user's saved events list.
    """
    try:
        from core.models import SavedEvent
        
        # Check if event exists
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Try to delete the saved event record
        try:
            saved_event = SavedEvent.objects.get(
                user=request.user,
                event=event
            )
            saved_event.delete()
            
            logger.info(f"User {request.user.id} unsaved event {event.id} ({event.name})")
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except SavedEvent.DoesNotExist:
            # Event wasn't saved anyway
            return Response(
                {'message': 'Event was not in favorites'}, 
                status=status.HTTP_200_OK
            )
            
    except Exception as e:
        logger.error(f"Error unsaving event {event_id} for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to remove event from favorites'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def event_saved_status(request, event_id):
    """
    🔍 Check if Event is Saved
    
    Returns whether the current user has saved the specified event.
    """
    try:
        from core.models import SavedEvent
        
        # Check if event exists
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response(
                {'error': 'Event not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if user has saved this event
        is_saved = SavedEvent.objects.filter(
            user=request.user,
            event=event
        ).exists()
        
        return Response({
            'is_saved': is_saved,
            'event_id': event_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error checking saved status for event {event_id} and user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to check saved status'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# =============================================================================
# EVETTE AI CHATBOT VIEWS
# =============================================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def evette_chat(request):
    """
    🤖 Chat with Evette AI
    
    Handles conversations between users and the Evette AI chatbot.
    Evette helps users discover events based on their preferences.
    """
    try:
        from core.evette_service import EvetteService
        import asyncio
        
        message = request.data.get('message', '').strip()
        
        if not message:
            return Response(
                {'error': 'Message cannot be empty'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Initialize Evette service
        evette = EvetteService()
        
        # Get AI response using sync method
        result = evette.chat_with_evette_sync(request.user, message)
        
        if result['success']:
            return Response({
                'message': result['message'],
                'is_onboarding': result.get('is_onboarding', False),
                'preferences_count': result.get('preferences_count', 0)
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': result.get('error', 'Chat failed')}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    except Exception as e:
        logger.error(f"Error in Evette chat for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to process chat message'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evette_conversation_history(request):
    """
    📜 Get Evette Conversation History
    
    Returns the user's recent conversation history with Evette.
    """
    try:
        from core.models import EvetteConversation
        from core.evette_service import EvetteService
        
        evette = EvetteService()
        session_id = evette.get_or_create_session_id(request.user)
        
        # Get recent conversations
        conversations = EvetteConversation.objects.filter(
            user=request.user,
            session_id=session_id
        ).order_by('timestamp')[:20]  # Last 20 messages
        
        conversation_data = []
        for conv in conversations:
            conversation_data.append({
                'role': conv.role,
                'message': conv.message,
                'timestamp': conv.timestamp.isoformat(),
                'is_onboarding': conv.is_onboarding
            })
        
        return Response({
            'conversations': conversation_data,
            'session_id': session_id
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting conversation history for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to get conversation history'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evette_personalized_events(request):
    """
    🎯 Get Personalized Event Recommendations
    
    Returns events recommended by Evette based on user preferences.
    This replaces the generic "Events for You" with AI-powered recommendations.
    """
    try:
        from core.evette_service import EvetteService
        
        evette = EvetteService()
        recommended_events = evette.get_personalized_events(request.user)
        
        # Serialize the events
        serializer = EventSerializer(recommended_events, many=True, context={'request': request})
        
        return Response({
            'events': serializer.data,
            'count': len(recommended_events),
            'message': 'Events handpicked by Evette based on your preferences'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting personalized events for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to get personalized events'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def evette_user_preferences(request):
    """
    ⚙️ Get User Event Preferences
    
    Returns the user's current event preferences and onboarding status.
    """
    try:
        from core.models import UserEventPreferences, Tag
        
        # Get or create preferences
        preferences, created = UserEventPreferences.objects.get_or_create(user=request.user)
        
        # Get all available tags
        all_tags = Tag.objects.all()
        preferred_tags = preferences.preferred_tags.all()
        
        return Response({
            'onboarding_completed': preferences.onboarding_completed,
            'preferred_tags': [{'id': tag.id, 'name': tag.name} for tag in preferred_tags],
            'available_tags': [{'id': tag.id, 'name': tag.name} for tag in all_tags],
            'last_updated': preferences.last_updated.isoformat(),
            'preferences_count': preferred_tags.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error getting user preferences for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to get user preferences'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def evette_update_preferences(request):
    """
    🔄 Update User Event Preferences
    
    Allows users to manually update their event preferences.
    """
    try:
        from core.models import UserEventPreferences, Tag
        
        # Get or create preferences
        preferences, created = UserEventPreferences.objects.get_or_create(user=request.user)
        
        # Get tag IDs from request
        tag_ids = request.data.get('tag_ids', [])
        
        if tag_ids:
            # Validate tag IDs
            valid_tags = Tag.objects.filter(id__in=tag_ids)
            preferences.preferred_tags.set(valid_tags)
            
            # Mark onboarding as completed if not already
            if not preferences.onboarding_completed:
                preferences.onboarding_completed = True
                preferences.save()
        
        return Response({
            'message': 'Preferences updated successfully',
            'preferred_tags': [{'id': tag.id, 'name': tag.name} for tag in preferences.preferred_tags.all()],
            'onboarding_completed': preferences.onboarding_completed
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error updating preferences for user {request.user.id}: {str(e)}")
        return Response(
            {'error': 'Failed to update preferences'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
