"""
URL Configuration for KEMS Backend
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.reverse import reverse

@api_view(['GET'])
@permission_classes([AllowAny])
def api_root(request, format=None):
    """
    Welcome to the KEMS API!
    
    This is the Knowledge Event Management System API built with Django REST Framework.
    """
    return Response({
        'message': 'Welcome to KEMS (Knowledge Event Management System) API',
        'version': '1.0.0',
        'endpoints': {
            'authentication': {
                'register': reverse('register', request=request, format=format),
                'login': reverse('login', request=request, format=format),
                'logout': reverse('logout', request=request, format=format),
                'outsider_login': reverse('outsider_login', request=request, format=format),
                'user_profile': reverse('user_detail', request=request, format=format),
                'check_auth': reverse('check_auth', request=request, format=format),
            },
            'booking': {
                'outsider_booking': reverse('outsider_booking_create', request=request, format=format),
                'insider_booking': reverse('insider_booking_create', request=request, format=format),
                'insider_status': reverse('insider_booking_status', request=request, format=format),
                'auditoriums': reverse('auditorium_list', request=request, format=format),
            },
            'registrar_dashboard': {
                'dashboard_stats': reverse('dashboard_stats', request=request, format=format),
                'manage_bookings': reverse('registrar_booking_list', request=request, format=format),
                'create_public_event': reverse('public_event_create', request=request, format=format),
                'view_payments': reverse('registrar_payment_list', request=request, format=format),
            },
            'events': {
                'events_for_you': reverse('events_for_you', request=request, format=format),
                'public_events': reverse('all_public_events', request=request, format=format),
                'invited_events': reverse('invited_events', request=request, format=format),
            },
            'admin': '/admin/',
        },
        'documentation': {
            'note': 'This browsable API allows you to interact with endpoints directly.',
            'authentication': 'Most endpoints require JWT authentication.',
            'usage': 'Click on any endpoint link above to explore the API.',
        }
    })

urlpatterns = [
    # Root API endpoint
    path('api/', api_root, name='api_root'),
    path('', api_root, name='api_root_slash'),
    
    # Django Admin
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/auth/', include('users.urls')),
    path('api/', include('booking.urls')),
    path('api/', include('core.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
