from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import (
    Organization, Auditorium, BookingRequest, Payment, 
    Event, Invitation, VenueImage, EventImage
)

User = get_user_model()


class VenueImageInline(admin.TabularInline):
    """Inline admin for venue images"""
    model = VenueImage
    extra = 1
    fields = ['image', 'caption', 'is_primary']


@admin.register(Auditorium)
class AuditoriumAdmin(admin.ModelAdmin):
    """Admin for Auditorium model"""
    list_display = ['name', 'assigned_registrar', 'capacity', 'location', 'is_active', 'outsider_price', 'insider_price']
    list_filter = ['is_active', 'assigned_registrar', 'created_at']
    search_fields = ['name', 'description', 'location', 'assigned_registrar__full_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [VenueImageInline]
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'description', 'capacity', 'location', 'facilities')
        }),
        ('Management', {
            'fields': ('assigned_registrar',)
        }),
        ('Pricing', {
            'fields': ('outsider_price', 'insider_price')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Limit assigned_registrar choices to users with registrar role"""
        if db_field.name == "assigned_registrar":
            kwargs["queryset"] = User.objects.filter(role='registrar')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)


@admin.register(VenueImage)
class VenueImageAdmin(admin.ModelAdmin):
    """Admin for VenueImage model"""
    list_display = ['venue', 'caption', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['venue__name', 'caption']
    readonly_fields = ['created_at']


class EventImageInline(admin.TabularInline):
    """Inline admin for event images"""
    model = EventImage
    extra = 1
    fields = ['image', 'caption', 'is_primary']


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """Admin for Event model"""
    list_display = ['name', 'venue', 'date', 'start_time', 'is_public', 'is_posted_by_registrar']
    list_filter = ['is_public', 'is_paid_event', 'is_posted_by_registrar', 'date', 'created_at']
    search_fields = ['name', 'description', 'venue__name', 'organizer__full_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [EventImageInline]
    
    fieldsets = (
        ('Event Details', {
            'fields': ('name', 'description', 'venue', 'date', 'start_time', 'end_time')
        }),
        ('Visibility & Type', {
            'fields': ('is_public', 'is_paid_event', 'ticket_info_url')
        }),
        ('Organizer', {
            'fields': ('organizer', 'is_posted_by_registrar', 'posted_registrar')
        }),
        ('Tags', {
            'fields': ('tags',)
        }),
        ('Booking Link', {
            'fields': ('booking_request',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(EventImage)
class EventImageAdmin(admin.ModelAdmin):
    """Admin for EventImage model"""
    list_display = ['event', 'caption', 'is_primary', 'created_at']
    list_filter = ['is_primary', 'created_at']
    search_fields = ['event__name', 'caption']
    readonly_fields = ['created_at']


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    """Admin for Organization model"""
    list_display = ['name', 'email', 'contact_number', 'website']
    search_fields = ['name', 'email', 'contact_number']
    readonly_fields = ['id']


@admin.register(BookingRequest)
class BookingRequestAdmin(admin.ModelAdmin):
    """Admin for BookingRequest model"""
    list_display = [
        'event_name', 'requester', 'venue', 'desired_date', 
        'status', 'is_posted', 'created_at'
    ]
    list_filter = [
        'status', 'event_type', 'is_posted', 'is_paid', 
        'desired_date', 'created_at'
    ]
    search_fields = [
        'event_name', 'requester__full_name', 'requester__email',
        'venue__name', 'organization__name'
    ]
    readonly_fields = [
        'created_at', 'updated_at', 'duration_hours', 
        'total_amount', 'posted_at'
    ]
    
    fieldsets = (
        ('Request Details', {
            'fields': ('event_name', 'purpose', 'venue', 'desired_date', 'start_time', 'end_time')
        }),
        ('Requester', {
            'fields': ('requester', 'organization')
        }),
        ('Event Type', {
            'fields': ('event_type',)
        }),
        ('Status & Payment', {
            'fields': ('status', 'denial_reason', 'is_paid', 'paystack_reference')
        }),
        ('Event Posting', {
            'fields': ('is_posted', 'posted_by', 'posted_at')
        }),
        ('Temporary Login (Outsiders)', {
            'fields': ('temporary_login_username', 'temporary_login_password', 'login_expiry_date'),
            'classes': ('collapse',)
        }),
        ('Calculated Fields', {
            'fields': ('duration_hours', 'total_amount'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    """Admin for Payment model"""
    list_display = [
        'booking_request', 'amount', 'status', 'payment_date'
    ]
    list_filter = ['status', 'payment_date']
    search_fields = [
        'booking_request__event_name', 
        'booking_request__requester__full_name',
        'paystack_transaction_id'
    ]
    readonly_fields = ['payment_date']


@admin.register(Invitation)
class InvitationAdmin(admin.ModelAdmin):
    """Admin for Invitation model"""
    list_display = [
        'event', 'invited_user', 'invited_email', 'status', 'sent_at'
    ]
    list_filter = ['status', 'sent_at']
    search_fields = [
        'event__name', 'invited_user__full_name', 
        'invited_user__email', 'invited_email'
    ]
    readonly_fields = ['sent_at']
