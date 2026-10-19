"""
Serializers for booking app
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.utils import timezone
from core.models import Tag
from .models import (
    Organization, Auditorium, BookingRequest, 
    Payment, Event, Invitation, VenueImage, EventImage
)

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    """
    Serializer for Organization model
    """
    
    class Meta:
        model = Organization
        fields = ['id', 'name', 'address', 'email', 'contact_number', 'website']


class VenueImageSerializer(serializers.ModelSerializer):
    """
    Serializer for VenueImage model
    """
    image = serializers.SerializerMethodField()
    
    def get_image(self, obj):
        """Get full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    class Meta:
        model = VenueImage
        fields = ['id', 'image', 'caption', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        """Ensure only one primary image per venue"""
        if attrs.get('is_primary', False):
            venue = self.context.get('venue')
            if venue:
                # Check if another primary image exists
                existing_primary = VenueImage.objects.filter(
                    venue=venue, 
                    is_primary=True
                ).exclude(pk=self.instance.pk if self.instance else None)
                if existing_primary.exists():
                    raise serializers.ValidationError(
                        "Only one primary image is allowed per venue."
                    )
        return attrs


class AuditoriumSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying Auditorium details
    """
    
    images = VenueImageSerializer(many=True, read_only=True)
    primary_image = VenueImageSerializer(read_only=True)
    assigned_registrar_name = serializers.CharField(source='assigned_registrar.full_name', read_only=True)
    
    class Meta:
        model = Auditorium
        fields = [
            'id', 'name', 'description', 'capacity', 'location', 'facilities',
            'is_active', 'outsider_price', 'insider_price', 'assigned_registrar',
            'assigned_registrar_name', 'terms_and_conditions', 'images', 'primary_image', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'assigned_registrar', 'created_at', 'updated_at']


class AuditoriumCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating new auditoriums by registrars
    """
    
    images = VenueImageSerializer(many=True, required=False)
    
    class Meta:
        model = Auditorium
        fields = [
            'name', 'description', 'capacity', 'location', 'facilities',
            'is_active', 'outsider_price', 'insider_price', 'terms_and_conditions', 'images'
        ]
    
    def validate_outsider_price(self, value):
        """Validate outsider price is non-negative"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value or 0.00
    
    def validate_insider_price(self, value):
        """Validate insider price is non-negative"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value or 0.00
    
    def create(self, validated_data):
        """Create auditorium with images and assign to current registrar"""
        images_data = validated_data.pop('images', [])
        
        # Automatically assign the venue to the current registrar
        user = self.context['request'].user
        validated_data['assigned_registrar'] = user
        
        auditorium = Auditorium.objects.create(**validated_data)
        
        # Create venue images
        for image_data in images_data:
            VenueImage.objects.create(venue=auditorium, **image_data)
        
        return auditorium


class AuditoriumUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating auditoriums by registrars
    """
    
    class Meta:
        model = Auditorium
        fields = [
            'name', 'description', 'capacity', 'location', 'facilities',
            'is_active', 'outsider_price', 'insider_price', 'terms_and_conditions'
        ]
    
    def validate_outsider_price(self, value):
        """Validate outsider price is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value
    
    def validate_insider_price(self, value):
        """Validate insider price is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class AuditoriumPriceUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for updating Auditorium prices by Registrar
    """
    
    class Meta:
        model = Auditorium
        fields = ['outsider_price', 'insider_price']
    
    def validate_outsider_price(self, value):
        """Validate outsider price is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value
    
    def validate_insider_price(self, value):
        """Validate insider price is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value


class OutsiderBookingRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for creating booking requests by outsiders
    """
    
    organization = OrganizationSerializer()
    requester_full_name = serializers.CharField(
        write_only=True,
        help_text="Full name of the person making the request"
    )
    requester_position = serializers.CharField(
        write_only=True,
        help_text="Position of the requester in the organization"
    )
    requester_contact_number = serializers.CharField(
        write_only=True,
        help_text="Contact number of the requester"
    )
    requester_email = serializers.EmailField(
        write_only=True,
        help_text="Email address of the requester"
    )
    
    class Meta:
        model = BookingRequest
        fields = [
            'event_name', 'purpose', 'venue', 'desired_date', 
            'start_time', 'end_time', 'event_type',
            'organization', 'requester_full_name', 'requester_position',
            'requester_contact_number', 'requester_email'
        ]
    
    def validate_desired_date(self, value):
        """Validate that desired date is not in the past"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Event date cannot be in the past.")
        return value
    
    def validate(self, attrs):
        """Validate that end time is after start time"""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create organization, user, and booking request"""
        # Extract organization and requester data
        organization_data = validated_data.pop('organization')
        requester_full_name = validated_data.pop('requester_full_name')
        requester_position = validated_data.pop('requester_position')
        requester_contact_number = validated_data.pop('requester_contact_number')
        requester_email = validated_data.pop('requester_email')
        
        # Create organization (allowing duplicate names)
        organization = Organization.objects.create(**organization_data)
        
        # Handle outsider user creation - check if user already exists
        try:
            # Try to find existing user with this email
            user = User.objects.get(email=requester_email)
            # Update user details if found
            user.full_name = requester_full_name
            user.contact_number = requester_contact_number
            user.position = requester_position
            user.save()
        except User.DoesNotExist:
            # Create new user with original email
            user = User.objects.create_user(
                email=requester_email,
                full_name=requester_full_name,
                contact_number=requester_contact_number,
                position=requester_position,
                role='outsider'
            )
        
        # Create booking request
        booking_request = BookingRequest.objects.create(
            requester=user,
            organization=organization,
            **validated_data
        )
        
        return booking_request


class InsiderBookingRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for creating booking requests by insiders
    """
    
    invitees = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        write_only=True,
        help_text="List of user IDs to invite for private events"
    )
    
    class Meta:
        model = BookingRequest
        fields = [
            'event_name', 'purpose', 'venue', 'desired_date',
            'start_time', 'end_time', 'event_type', 'invitees'
        ]
    
    def validate_desired_date(self, value):
        """Validate that desired date is not in the past"""
        if value < timezone.now().date():
            raise serializers.ValidationError("Event date cannot be in the past.")
        return value
    
    def validate(self, attrs):
        """Validate that end time is after start time"""
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        return attrs
    
    def create(self, validated_data):
        """Create booking request with authenticated user as requester"""
        user = self.context['request'].user
        invitees = validated_data.pop('invitees', None)
        
        # Store invitees in the booking request if this is a private event
        if invitees and validated_data.get('event_type') == 'private':
            validated_data['invited_user_ids'] = invitees
            
        booking_request = BookingRequest.objects.create(requester=user, **validated_data)
        return booking_request


class BookingRequestListSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying booking request summaries in lists
    """
    
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    requester_name = serializers.CharField(source='requester.full_name', read_only=True)
    organization_name = serializers.CharField(
        source='organization.name', 
        read_only=True, 
        allow_null=True
    )
    total_amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    requester_details = serializers.SerializerMethodField()
    
    def get_requester_details(self, obj):
        """Get basic requester information for segregation"""
        return {
            'role': obj.requester.role,
            'full_name': obj.requester.full_name,
            'email': obj.requester.email,
            'department': getattr(obj.requester, 'department', None),
            'program': getattr(obj.requester, 'program', None),
        }
    
    class Meta:
        model = BookingRequest
        fields = [
            'id', 'booking_id', 'event_name', 'venue_name', 'desired_date', 
            'start_time', 'end_time', 'purpose', 'event_type',
            'status', 'requester_name', 'organization_name',
            'total_amount', 'is_posted', 'is_paid', 'denial_reason', 
            'created_at', 'updated_at', 'requester_details'
        ]


class BookingRequestDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for detailed booking request view and updates by Registrar
    """
    
    # Detailed requester information
    requester_details = serializers.SerializerMethodField()
    organization = OrganizationSerializer(read_only=True)
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    total_amount = serializers.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        read_only=True
    )
    calculated_end_time = serializers.SerializerMethodField()
    
    def get_calculated_end_time(self, obj):
        """Return the end time of the booking"""
        return obj.end_time
    
    def get_requester_details(self, obj):
        """Get detailed requester information"""
        return {
            'id': obj.requester.id,
            'full_name': obj.requester.full_name,
            'email': obj.requester.email,
            'contact_number': obj.requester.contact_number,
            'position': obj.requester.position,
            'role': obj.requester.role,
            'program': obj.requester.program,
            'department': obj.requester.department,
        }
    
    class Meta:
        model = BookingRequest
        fields = [
            'id', 'requester_details', 'organization', 'event_name', 'purpose',
            'venue', 'venue_name', 'desired_date', 'start_time', 'end_time',
            'calculated_end_time', 'event_type', 'status', 'denial_reason',
            'is_paid', 'total_amount', 'is_posted', 'posted_by', 'posted_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'requester_details', 'organization', 'venue_name', 'calculated_end_time',
            'total_amount', 'is_posted', 'posted_by', 'posted_at', 'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Custom validation for booking request updates"""
        # Ensure denial reason is provided when status is denied
        if attrs.get('status') == 'denied' and not attrs.get('denial_reason'):
            raise serializers.ValidationError(
                {'denial_reason': 'Denial reason is required when status is denied.'}
            )
        return attrs


class TagSerializer(serializers.ModelSerializer):
    """
    Serializer for Tag model
    """
    
    class Meta:
        model = Tag
        fields = ['id', 'name']


class EventImageSerializer(serializers.ModelSerializer):
    """
    Serializer for EventImage model
    """
    image = serializers.SerializerMethodField()
    
    def get_image(self, obj):
        """Get full URL for image"""
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None
    
    class Meta:
        model = EventImage
        fields = ['id', 'image', 'caption', 'is_primary', 'created_at']
        read_only_fields = ['id', 'created_at']
    
    def validate(self, attrs):
        """Ensure only one primary image per event"""
        if attrs.get('is_primary', False):
            event = self.context.get('event')
            if event:
                # Check if another primary image exists
                existing_primary = EventImage.objects.filter(
                    event=event, 
                    is_primary=True
                ).exclude(pk=self.instance.pk if self.instance else None)
                if existing_primary.exists():
                    raise serializers.ValidationError(
                        "Only one primary image is allowed per event."
                    )
        return attrs


class EventSerializer(serializers.ModelSerializer):
    """
    Serializer for Event model
    """
    
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        source='tags',
        required=False
    )
    venue_name = serializers.CharField(source='venue.name', read_only=True)
    organizer_name = serializers.CharField(source='organizer.full_name', read_only=True)
    is_upcoming = serializers.BooleanField(read_only=True)
    is_ongoing = serializers.BooleanField(read_only=True)
    images = EventImageSerializer(many=True, read_only=True)
    primary_image = EventImageSerializer(read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'name', 'description', 'venue', 'venue_name',
            'date', 'start_time', 'end_time', 'is_public',
            'organizer', 'organizer_name', 'tags', 'tag_ids',
            'is_paid_event', 'ticket_info_url', 'is_upcoming',
            'is_ongoing', 'images', 'primary_image', 'is_posted_by_registrar',
            'posted_registrar', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'organizer', 'is_upcoming', 'is_ongoing', 'images', 
            'primary_image', 'is_posted_by_registrar', 'posted_registrar',
            'created_at', 'updated_at'
        ]
    
    def validate(self, attrs):
        """Custom validation for Event model"""
        # Validate that end time is after start time
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {'end_time': 'End time must be after start time.'}
            )
        
        # Validate that date is not in the past
        date = attrs.get('date')
        if date and date < timezone.now().date():
            raise serializers.ValidationError(
                {'date': 'Event date cannot be in the past.'}
            )
        
        return attrs


class EventCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating events by registrars
    """
    
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        source='tags'
    )
    images = EventImageSerializer(many=True, required=False)
    
    class Meta:
        model = Event
        fields = [
            'name', 'description', 'venue', 'date', 'start_time', 'end_time',
            'is_public', 'tag_ids', 'is_paid_event', 'ticket_info_url', 'images'
        ]
    
    def validate(self, attrs):
        """Custom validation for Event creation"""
        # Validate that end time is after start time
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {'end_time': 'End time must be after start time.'}
            )
        
        # Validate that date is not in the past
        date = attrs.get('date')
        if date and date < timezone.now().date():
            raise serializers.ValidationError(
                {'date': 'Event date cannot be in the past.'}
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create event with images and set registrar as organizer"""
        images_data = validated_data.pop('images', [])
        tags_data = validated_data.pop('tags', [])
        user = self.context['request'].user
        
        # Create event
        event = Event.objects.create(
            organizer=user,
            is_posted_by_registrar=True,
            posted_registrar=user,
            **validated_data
        )
        
        # Set many-to-many tags
        if tags_data:
            event.tags.set(tags_data)
        
        # Create event images
        for image_data in images_data:
            EventImage.objects.create(event=event, **image_data)
        
        return event


class EventPostingSerializer(serializers.ModelSerializer):
    """
    Serializer for posting approved booking requests as events
    """
    
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        required=False,
        source='tags'
    )
    images = EventImageSerializer(many=True, required=False)
    
    class Meta:
        model = Event
        fields = [
            'name', 'description', 'venue', 'date', 'start_time', 'end_time',
            'is_public', 'tag_ids', 'is_paid_event', 'ticket_info_url', 'images'
        ]
    
    def validate(self, attrs):
        """Custom validation for event posting"""
        # Validate that end time is after start time
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError(
                {'end_time': 'End time must be after start time.'}
            )
        
        # Validate that date is not in the past
        date = attrs.get('date')
        if date and date < timezone.now().date():
            raise serializers.ValidationError(
                {'date': 'Event date cannot be in the past.'}
            )
        
        return attrs
    
    def create(self, validated_data):
        """Create event from booking request"""
        images_data = validated_data.pop('images', [])
        tags_data = validated_data.pop('tags', [])
        booking_request = self.context.get('booking_request')
        user = self.context['request'].user
        
        # Create event
        event = Event.objects.create(
            organizer=booking_request.requester,
            booking_request=booking_request,
            is_posted_by_registrar=True,
            posted_registrar=user,
            **validated_data
        )
        
        # Set many-to-many tags
        if tags_data:
            event.tags.set(tags_data)
        
        # Create event images
        for image_data in images_data:
            EventImage.objects.create(event=event, **image_data)
        
        # Update booking request
        booking_request.is_posted = True
        booking_request.posted_by = user
        booking_request.posted_at = timezone.now()
        booking_request.save()
        
        return event


class PaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for Payment records
    """
    
    booking_event_name = serializers.CharField(
        source='booking_request.event_name', 
        read_only=True
    )
    requester_name = serializers.CharField(
        source='booking_request.requester.full_name', 
        read_only=True
    )
    
    class Meta:
        model = Payment
        fields = [
            'id', 'booking_request', 'booking_event_name', 
            'requester_name', 'amount', 'payment_date',
            'paystack_transaction_id', 'status'
        ]
        read_only_fields = ['id', 'payment_date']


class InvitationSerializer(serializers.ModelSerializer):
    """
    Serializer for Invitation model
    """
    
    event_name = serializers.CharField(source='event.name', read_only=True)
    invited_user_name = serializers.CharField(
        source='invited_user.full_name', 
        read_only=True
    )
    
    class Meta:
        model = Invitation
        fields = [
            'id', 'event', 'event_name', 'invited_user', 
            'invited_user_name', 'invited_email', 'status', 'sent_at'
        ]
        read_only_fields = ['id', 'sent_at']
    
    def validate(self, attrs):
        """Custom validation for Invitation"""
        # Ensure either invited_user or invited_email is provided
        if not attrs.get('invited_user') and not attrs.get('invited_email'):
            raise serializers.ValidationError(
                'Either invited_user or invited_email must be provided.'
            )
        
        # Validate that the event is private for invitations
        event = attrs.get('event')
        if event and event.is_public:
            raise serializers.ValidationError(
                {'event': 'Invitations can only be sent for private events.'}
            )
        
        return attrs


class InvitationResponseSerializer(serializers.ModelSerializer):
    """
    Serializer for responding to invitations
    """
    
    class Meta:
        model = Invitation
        fields = ['status']
    
    def validate_status(self, value):
        """Validate status change"""
        if value not in ['accepted', 'declined']:
            raise serializers.ValidationError(
                'Status must be either "accepted" or "declined".'
            )
        return value


class InvitationCreateSerializer(serializers.Serializer):
    """
    Serializer for creating multiple invitations
    """
    
    event = serializers.PrimaryKeyRelatedField(queryset=Event.objects.all())
    emails = serializers.ListField(
        child=serializers.EmailField(),
        help_text="List of email addresses to invite"
    )
    
    def validate_event(self, value):
        """Validate that event is private"""
        if value.is_public:
            raise serializers.ValidationError(
                'Invitations can only be sent for private events.'
            )
        return value
    
    def validate_emails(self, value):
        """Validate email list"""
        if not value:
            raise serializers.ValidationError(
                'At least one email address is required.'
            )
        
        # Check for duplicates
        if len(value) != len(set(value)):
            raise serializers.ValidationError(
                'Duplicate email addresses are not allowed.'
            )
        
        return value
    
    def create(self, validated_data):
        """Create invitations for the provided emails"""
        event = validated_data['event']
        emails = validated_data['emails']
        invitations = []
        
        for email in emails:
            # Check if user exists with this email
            try:
                user = User.objects.get(email=email)
                invitation = Invitation.objects.create(
                    event=event,
                    invited_user=user,
                    invited_email=email
                )
            except User.DoesNotExist:
                invitation = Invitation.objects.create(
                    event=event,
                    invited_email=email
                )
            invitations.append(invitation)
        
        return invitations 