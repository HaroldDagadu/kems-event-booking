from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal

User = get_user_model()


class Organization(models.Model):
    """
    Organization model for external organizations making booking requests
    """
    
    name = models.CharField(
        max_length=255,
        help_text="Name of the organization"
    )
    address = models.TextField(
        null=True, 
        blank=True,
        help_text="Physical address of the organization"
    )
    email = models.EmailField(
        null=True, 
        blank=True,
        help_text="General contact email for the organization"
    )
    contact_number = models.CharField(
        max_length=20, 
        null=True, 
        blank=True,
        help_text="General contact number for the organization"
    )
    website = models.URLField(
        null=True, 
        blank=True,
        help_text="Organization's website URL"
    )
    
    class Meta:
        verbose_name = 'Organization'
        verbose_name_plural = 'Organizations'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class VenueImage(models.Model):
    """
    Model for storing multiple images of venues/facilities
    """
    
    venue = models.ForeignKey(
        'Auditorium',
        on_delete=models.CASCADE,
        related_name='images',
        help_text="The venue this image belongs to"
    )
    image = models.ImageField(
        upload_to='venue_images/',
        help_text="Image file of the venue"
    )
    caption = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Optional caption for the image"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary image for the venue"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Venue Image'
        verbose_name_plural = 'Venue Images'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.venue.name} - {self.caption or 'Image'}"
    
    def save(self, *args, **kwargs):
        """Ensure only one primary image per venue"""
        if self.is_primary:
            # Set all other images for this venue to non-primary
            VenueImage.objects.filter(venue=self.venue).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class Auditorium(models.Model):
    """
    Auditorium model representing bookable venues
    """
    
    name = models.CharField(
        max_length=255, 
        unique=True,
        help_text="Name of the auditorium/venue"
    )
    description = models.TextField(
        null=True, 
        blank=True,
        help_text="Description of the venue and its facilities"
    )
    capacity = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Maximum capacity of the venue"
    )
    location = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Physical location of the venue"
    )
    facilities = models.TextField(
        null=True,
        blank=True,
        help_text="Available facilities (e.g., Projector, Sound System, etc.)"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this venue is available for booking"
    )
    outsider_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Price for outsider bookings"
    )
    insider_price = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=Decimal('0.00'),
        help_text="Price for insider bookings"
    )
    assigned_registrar = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        limit_choices_to={'role': 'registrar'},
        null=True,
        blank=True,
        help_text="The registrar responsible for managing this venue"
    )
    terms_and_conditions = models.TextField(
        null=True,
        blank=True,
        help_text="Terms and conditions for booking this venue that users must accept"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Auditorium'
        verbose_name_plural = 'Auditoriums'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    def get_price_for_user(self, user):
        """Get the appropriate price based on user type"""
        if user.is_insider:
            return self.insider_price
        return self.outsider_price
    
    @property
    def primary_image(self):
        """Get the primary image for this venue"""
        return self.images.filter(is_primary=True).first()
    
    @property
    def all_images(self):
        """Get all images for this venue"""
        return self.images.all()


class EventImage(models.Model):
    """
    Model for storing multiple images for events
    """
    
    event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        related_name='images',
        help_text="The event this image belongs to"
    )
    image = models.ImageField(
        upload_to='event_images/',
        help_text="Image file for the event"
    )
    caption = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text="Optional caption for the image"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Whether this is the primary image for the event"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Event Image'
        verbose_name_plural = 'Event Images'
        ordering = ['-is_primary', '-created_at']
    
    def __str__(self):
        return f"{self.event.name} - {self.caption or 'Image'}"
    
    def save(self, *args, **kwargs):
        """Ensure only one primary image per event"""
        if self.is_primary:
            # Set all other images for this event to non-primary
            EventImage.objects.filter(event=self.event).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)


class BookingRequest(models.Model):
    """
    BookingRequest model for all booking requests from both insiders and outsiders
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('denied', 'Denied'),
        ('paid', 'Paid'),
    ]
    
    EVENT_TYPE_CHOICES = [
        ('private', 'Private'),
        ('public', 'Public'),
    ]
    
    # Core fields
    requester = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        help_text="The user who made the booking request"
    )
    organization = models.ForeignKey(
        Organization, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Linked organization for outsider requests"
    )
    
    # Event details
    event_name = models.CharField(
        max_length=255,
        help_text="Name of the event"
    )
    purpose = models.TextField(
        help_text="Detailed purpose/description of the event"
    )
    venue = models.ForeignKey(
        Auditorium, 
        on_delete=models.PROTECT,
        help_text="The requested venue"
    )
    desired_date = models.DateField(
        help_text="The desired date for the event"
    )
    start_time = models.TimeField(
        help_text="The start time of the event"
    )
    end_time = models.TimeField(
        help_text="The end time of the event"
    )
    event_type = models.CharField(
        max_length=10, 
        choices=EVENT_TYPE_CHOICES,
        help_text="Whether the event is private or public"
    )
    
    # Status and workflow
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Current status of the booking request"
    )
    denial_reason = models.TextField(
        null=True, 
        blank=True,
        help_text="Reason for denial if request is denied"
    )
    
    # Event posting flags
    is_posted = models.BooleanField(
        default=False,
        help_text="Whether this booking has been posted as a public event"
    )
    posted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posted_events',
        help_text="The registrar who posted this event"
    )
    posted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this event was posted"
    )
    
    # Temporary login for outsiders
    temporary_login_username = models.CharField(
        max_length=255, 
        unique=True, 
        null=True, 
        blank=True,
        help_text="Generated username for outsider payment access"
    )
    temporary_login_password = models.CharField(
        max_length=255, 
        null=True, 
        blank=True,
        help_text="Generated password for outsider payment access (hashed)"
    )
    login_expiry_date = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Expiry date for temporary login credentials"
    )
    terms_accepted = models.BooleanField(
        default=False,
        help_text="Whether the user has accepted the venue terms and conditions"
    )
    terms_accepted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the terms were accepted"
    )
    
    # Payment tracking
    is_paid = models.BooleanField(
        default=False,
        help_text="Indicates if payment has been made"
    )
    paystack_reference = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="Paystack transaction reference"
    )
    booking_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="Unique booking ID for payment lookup"
    )
    
    # Invitees for private events (stored as JSON list of user IDs)
    invited_user_ids = models.JSONField(
        null=True,
        blank=True,
        help_text="List of user IDs to invite when event is approved (for private events only)"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Booking Request'
        verbose_name_plural = 'Booking Requests'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.event_name} - {self.requester.full_name} ({self.status})"
    
    @property
    def duration_hours(self):
        """Calculate duration in hours based on start and end time"""
        if self.start_time and self.end_time:
            from datetime import datetime, timedelta
            start_datetime = datetime.combine(self.desired_date, self.start_time)
            end_datetime = datetime.combine(self.desired_date, self.end_time)
            duration = end_datetime - start_datetime
            return float(duration.total_seconds() / 3600)
        return 0
    
    @property
    def total_amount(self):
        """Get flat rate amount based on venue and user type"""
        return self.venue.get_price_for_user(self.requester)
    
    @property
    def responsible_registrar(self):
        """Get the registrar responsible for this venue"""
        return self.venue.assigned_registrar
    
    def generate_booking_id(self):
        """Generate a unique booking ID for payment purposes"""
        import secrets
        import string
        while True:
            # Generate 8-character booking ID (letters and numbers)
            booking_id = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            # Ensure uniqueness
            if not BookingRequest.objects.filter(booking_id=booking_id).exists():
                self.booking_id = booking_id
                self.save(update_fields=['booking_id'])
                return booking_id
    
    def clean(self):
        """Custom validation for BookingRequest"""
        errors = {}
        
        # Validate that desired date is not in the past
        if self.desired_date and self.desired_date < timezone.now().date():
            errors['desired_date'] = 'Event date cannot be in the past.'
        
        # Validate that denial reason is provided if status is denied
        if self.status == 'denied' and not self.denial_reason:
            errors['denial_reason'] = 'Denial reason is required when status is denied.'
        
        # Validate that end time is after start time
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors['end_time'] = 'End time must be after start time.'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class Payment(models.Model):
    """
    Payment model for recording successful payment transactions
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
    ]
    
    booking_request = models.OneToOneField(
        BookingRequest, 
        on_delete=models.CASCADE,
        help_text="The booking request this payment is for"
    )
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        help_text="Amount paid"
    )
    payment_date = models.DateTimeField(
        auto_now_add=True,
        help_text="Date and time when payment was made"
    )
    paystack_transaction_id = models.CharField(
        max_length=100, 
        unique=True,
        help_text="Unique transaction ID from Paystack"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Status of the payment transaction"
    )
    
    class Meta:
        verbose_name = 'Payment'
        verbose_name_plural = 'Payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"Payment for {self.booking_request.event_name} - {self.status}"


class Event(models.Model):
    """
    Event model representing scheduled events from both approved bookings and direct posts
    """
    
    name = models.CharField(
        max_length=255,
        help_text="Name of the event"
    )
    description = models.TextField(
        help_text="Detailed description of the event"
    )
    venue = models.ForeignKey(
        Auditorium, 
        on_delete=models.PROTECT,
        help_text="The venue where the event takes place"
    )
    date = models.DateField(
        help_text="Date of the event"
    )
    start_time = models.TimeField(
        help_text="Start time of the event"
    )
    end_time = models.TimeField(
        help_text="End time of the event"
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether the event is visible to all users"
    )
    organizer = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="The user who organized/posted the event"
    )
    tags = models.ManyToManyField(
        'core.Tag', 
        blank=True,
        help_text="Tags for categorization and filtering"
    )
    is_paid_event = models.BooleanField(
        default=False,
        help_text="Whether tickets are required for this event"
    )
    ticket_info_url = models.URLField(
        null=True, 
        blank=True,
        help_text="URL for external ticket purchase"
    )
    booking_request = models.OneToOneField(
        BookingRequest, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="Link to the original booking request if applicable"
    )
    
    # Event posting details
    is_posted_by_registrar = models.BooleanField(
        default=False,
        help_text="Whether this event was posted by a registrar"
    )
    posted_registrar = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='registrar_posted_events',
        help_text="The registrar who posted this event"
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Event'
        verbose_name_plural = 'Events'
        ordering = ['date', 'start_time']
    
    def __str__(self):
        return f"{self.name} - {self.date}"
    
    @property
    def is_upcoming(self):
        """Check if event is in the future"""
        now = timezone.now()
        event_datetime = timezone.make_aware(
            timezone.datetime.combine(self.date, self.start_time)
        )
        return event_datetime > now
    
    @property
    def is_ongoing(self):
        """Check if event is currently happening"""
        now = timezone.now()
        start_datetime = timezone.make_aware(
            timezone.datetime.combine(self.date, self.start_time)
        )
        end_datetime = timezone.make_aware(
            timezone.datetime.combine(self.date, self.end_time)
        )
        return start_datetime <= now <= end_datetime
    
    @property
    def primary_image(self):
        """Get the primary image for this event"""
        return self.images.filter(is_primary=True).first()
    
    @property
    def all_images(self):
        """Get all images for this event"""
        return self.images.all()
    
    def clean(self):
        """Custom validation for Event model"""
        errors = {}
        
        # Validate that end time is after start time
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors['end_time'] = 'End time must be after start time.'
        
        # Validate that date is not in the past
        if self.date and self.date < timezone.now().date():
            errors['date'] = 'Event date cannot be in the past.'
        
        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)


class Invitation(models.Model):
    """
    Invitation model for managing invitations to private events
    """
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
    ]
    
    event = models.ForeignKey(
        Event, 
        on_delete=models.CASCADE,
        help_text="The private event being invited to"
    )
    invited_user = models.ForeignKey(
        User, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        help_text="The registered user being invited"
    )
    invited_email = models.EmailField(
        null=True, 
        blank=True,
        help_text="Email for external invitees or for matching registered users"
    )
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default='pending',
        help_text="Status of the invitation"
    )
    sent_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'Invitation'
        verbose_name_plural = 'Invitations'
        ordering = ['-sent_at']
        unique_together = [['event', 'invited_user'], ['event', 'invited_email']]
    
    def __str__(self):
        if self.invited_user:
            return f"Invitation for {self.invited_user.full_name} to {self.event.name}"
        return f"Invitation for {self.invited_email} to {self.event.name}"
    
    def clean(self):
        """Custom validation for Invitation model"""
        from django.core.exceptions import ValidationError
        
        # Ensure either invited_user or invited_email is provided
        if not self.invited_user and not self.invited_email:
            raise ValidationError('Either invited_user or invited_email must be provided.')
        
        # If invited_user is provided, use their email
        if self.invited_user and not self.invited_email:
            self.invited_email = self.invited_user.email
    
    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)
