"""
URL patterns for booking app
"""

from django.urls import path

from .views import (
    # Booking Request Views
    outsider_booking_request_create, insider_booking_request_create,
    insider_booking_status,
    
    # Registrar Dashboard Views
    booking_request_list, booking_request_detail,
    auditorium_list, auditorium_price_update,
    public_event_create, public_event_detail,
    payment_list, calendar_event_list,
    
    # Venue Management Views
    registrar_venues_view, auditorium_detail,
    venue_image_create, venue_image_detail,
    
    # Event Posting Views
    event_posting_create,
    
    # Event Image Management
    event_image_create, event_image_detail,
    
    # Event Hub Views
    events_for_you, all_public_events, invited_events,
    
    # Invitation Views
    invitation_create, invitation_response,
    
    # Paystack Webhook
    paystack_webhook,
    
    # Helper Views
    get_auditoriums, dashboard_stats, payment_lookup, initialize_payment, verify_payment,
    
    # Saved Events Views
    saved_events_list, save_event, unsave_event, event_saved_status,
    
    # Evette AI Chatbot Views
    evette_chat, evette_conversation_history, evette_personalized_events,
    evette_user_preferences, evette_update_preferences
)

urlpatterns = [
    # Booking Requests
    path('bookings/outsider/', outsider_booking_request_create, name='outsider_booking_create'),
    path('bookings/insider/', insider_booking_request_create, name='insider_booking_create'),
    path('bookings/insider/status/', insider_booking_status, name='insider_booking_status'),
    
    # Auditorium Information
    path('auditoriums/', auditorium_list, name='auditorium_list'),
    path('auditoriums/list/', get_auditoriums, name='get_auditoriums'),
    
    # Registrar Dashboard
    path('registrar/dashboard/stats/', dashboard_stats, name='dashboard_stats'),
    path('registrar/bookings/', booking_request_list, name='registrar_booking_list'),
    path('registrar/bookings/<int:pk>/', booking_request_detail, name='registrar_booking_detail'),
    path('registrar/auditoriums/<int:pk>/prices/', auditorium_price_update, name='auditorium_price_update'),
    path('registrar/events/public/', public_event_create, name='public_event_create'),
    path('registrar/events/public/<int:pk>/', public_event_detail, name='public_event_detail'),
    path('registrar/payments/', payment_list, name='registrar_payment_list'),
    path('registrar/calendar-events/', calendar_event_list, name='registrar_calendar_events'),
    
    # Venue Management
    path('registrar/venues/', registrar_venues_view, name='registrar_venues'),
    path('registrar/venues/<int:pk>/', auditorium_detail, name='auditorium_detail'),
    path('registrar/venues/<int:venue_id>/images/', venue_image_create, name='venue_image_create'),
    path('registrar/venues/<int:venue_id>/images/<int:image_id>/', venue_image_detail, name='venue_image_detail'),
    
    # Event Posting
    path('registrar/bookings/<int:booking_id>/post-event/', event_posting_create, name='event_posting_create'),
    
    # Event Image Management
    path('registrar/events/<int:event_id>/images/', event_image_create, name='event_image_create'),
    path('registrar/events/<int:event_id>/images/<int:image_id>/', event_image_detail, name='event_image_detail'),
    
    # Event Hub
    path('events/for-you/', events_for_you, name='events_for_you'),
    path('events/invited/', invited_events, name='invited_events'),
    path('events/all-public/', all_public_events, name='all_public_events'),
    
    # Invitations
    path('invitations/', invitation_create, name='invitation_create'),
    path('invitations/<int:pk>/response/', invitation_response, name='invitation_response'),
    
    # Payment Processing
    path('payment-lookup/<str:booking_id>/', payment_lookup, name='payment_lookup'),
    path('payment-initialize/<str:booking_id>/', initialize_payment, name='initialize_payment'),
    path('payment-verify/<str:booking_id>/', verify_payment, name='verify_payment'),
    path('paystack/webhook/', paystack_webhook, name='paystack_webhook'),
    
    # Saved Events API
    path('events/saved/', saved_events_list, name='saved_events_list'),
    path('events/<int:event_id>/save/', save_event, name='save_event'),
    path('events/<int:event_id>/save/', unsave_event, name='unsave_event'),  # Same URL, different method
    path('events/<int:event_id>/saved-status/', event_saved_status, name='event_saved_status'),
    
    # Evette AI Chatbot API
    path('evette/chat/', evette_chat, name='evette_chat'),
    path('evette/history/', evette_conversation_history, name='evette_conversation_history'),
    path('evette/recommendations/', evette_personalized_events, name='evette_personalized_events'),
    path('evette/preferences/', evette_user_preferences, name='evette_user_preferences'),
    path('evette/preferences/update/', evette_update_preferences, name='evette_update_preferences'),
] 