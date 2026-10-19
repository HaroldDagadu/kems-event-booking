"""
URL patterns for users app
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    register_user, login_user, logout_user,
    outsider_login, user_detail, change_password,
    check_auth, outsider_booking_details, accept_terms,
    users_by_program
)

urlpatterns = [
    # Authentication endpoints
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('logout/', logout_user, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Outsider authentication
    path('outsider-login/', outsider_login, name='outsider_login'),
    path('outsider-booking/', outsider_booking_details, name='outsider_booking_details'),
    path('accept-terms/', accept_terms, name='accept_terms'),
    
    # User profile endpoints
    path('me/', user_detail, name='user_detail'),
    path('change-password/', change_password, name='change_password'),
    path('check-auth/', check_auth, name='check_auth'),
    
    # Invitation endpoints
    path('users-by-program/', users_by_program, name='users_by_program'),
] 