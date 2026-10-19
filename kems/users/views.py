"""
Views for users app
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings

from .serializers import (
    UserRegistrationSerializer, UserLoginSerializer,
    OutsiderTempLoginSerializer, UserDetailSerializer,
    PasswordChangeSerializer
)

User = get_user_model()

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """FBV version of RegisterUserView"""
    serializer = UserRegistrationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()
    
    return Response({
        'message': 'User registered successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """FBV version of LoginView"""
    login_serializer = UserLoginSerializer(data=request.data)
    login_serializer.is_valid(raise_exception=True)
    
    user = login_serializer.validated_data['user']
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    
    response = Response({
        'message': 'Login successful',
        'user': {
            'id': user.id,
            'email': user.email,
            'full_name': user.full_name,
            'role': user.role
        }
    }, status=status.HTTP_200_OK)
    
    # Set HttpOnly cookies
    response.set_cookie(
        'access_token',
        str(access_token),
        max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )
    
    response.set_cookie(
        'refresh_token',
        str(refresh),
        max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(),
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )
    
    return response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """FBV version of LogoutView"""
    try:
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
    except Exception:
        pass
    
    response = Response({
        'message': 'Logout successful'
    }, status=status.HTTP_200_OK)
    
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')
    
    return response

@api_view(['POST'])
@permission_classes([AllowAny])
def outsider_login(request):
    """FBV version of OutsiderLoginView"""
    serializer = OutsiderTempLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    
    user = serializer.validated_data['user']
    booking_request = serializer.validated_data['booking_request']
    
    refresh = RefreshToken.for_user(user)
    access_token = refresh.access_token
    access_token['temp_access'] = True
    access_token['booking_id'] = booking_request.id
    
    response = Response({
        'message': 'Temporary login successful',
        'booking_request': {
            'id': booking_request.id,
            'event_name': booking_request.event_name,
            'total_amount': str(booking_request.total_amount)
        }
    }, status=status.HTTP_200_OK)
    
    response.set_cookie(
        'temp_access_token',
        str(access_token),
        max_age=86400,  # 24 hours
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax'
    )
    
    return response

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def user_detail(request):
    """FBV version of UserDetailView"""
    if request.method == 'GET':
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = UserDetailSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """FBV version of PasswordChangeView"""
    serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
    serializer.is_valid(raise_exception=True)
    serializer.save()
    
    return Response({
        'message': 'Password changed successfully'
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_auth(request):
    """Check if user is authenticated"""
    return Response({
        'authenticated': True,
        'user': {
            'id': request.user.id,
            'email': request.user.email,
            'full_name': request.user.full_name,
            'role': request.user.role
        }
    })

@api_view(['GET'])
@permission_classes([AllowAny])
def outsider_booking_details(request):
    """Get booking details for outsider with temp access"""
    # Check for temp access token in cookies
    temp_token = request.COOKIES.get('temp_access_token')
    
    if not temp_token:
        return Response({'error': 'Temporary access token required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        from rest_framework_simplejwt.tokens import UntypedToken
        from django.contrib.auth import get_user_model
        from booking.models import BookingRequest
        
        # Decode the token to get user and booking info
        token = UntypedToken(temp_token)
        user_id = token['user_id']
        booking_id = token.get('booking_id')
        
        if not booking_id:
            return Response({'error': 'Invalid temporary access token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get the specific booking for this temp login
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        booking = BookingRequest.objects.get(
            id=booking_id,
            requester=user,
            status__in=['approved', 'paid']
        )
        
        # Return booking details
        booking_data = {
            'id': booking.id,
            'booking_id': booking.booking_id,
            'event_name': booking.event_name,
            'venue': {
                'name': booking.venue.name,
                'id': booking.venue.id,
                'terms_and_conditions': booking.venue.terms_and_conditions
            },
            'desired_date': booking.desired_date,
            'start_time': booking.start_time,
            'calculated_end_time': booking.end_time,
            'duration_hours': booking.duration_hours,
            'total_amount': str(booking.total_amount),
            'status': booking.status,
            'is_paid': booking.is_paid,
            'terms_accepted': booking.terms_accepted,
            'requester': {
                'full_name': booking.requester.full_name,
                'email': booking.requester.email,
                'contact_number': booking.requester.contact_number
            },
            'organization': {
                'name': booking.organization.name if booking.organization else None
            },
            'purpose': booking.purpose
        }
        
        return Response(booking_data)
        
    except Exception as e:
        return Response({'error': 'Invalid temporary access'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
def accept_terms(request):
    """Accept terms and conditions for outsider booking"""
    # Check for temp access token in cookies
    temp_token = request.COOKIES.get('temp_access_token')
    
    if not temp_token:
        return Response({'error': 'Temporary access token required'}, status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        from rest_framework_simplejwt.tokens import UntypedToken
        from django.contrib.auth import get_user_model
        from booking.models import BookingRequest
        from django.utils import timezone
        
        # Decode the token to get user and booking info
        token = UntypedToken(temp_token)
        user_id = token['user_id']
        booking_id = token.get('booking_id')
        
        if not booking_id:
            return Response({'error': 'Invalid temporary access token'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Get the specific booking for this temp login
        User = get_user_model()
        user = User.objects.get(id=user_id)
        
        booking = BookingRequest.objects.get(
            id=booking_id,
            requester=user,
            status__in=['approved', 'paid']
        )
        
        # Accept the terms
        booking.terms_accepted = True
        booking.terms_accepted_at = timezone.now()
        booking.save()
        
        return Response({'message': 'Terms and conditions accepted successfully'})
        
    except Exception as e:
        return Response({'error': 'Failed to accept terms'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def users_by_program(request):
    """
    Get users grouped by program for invitation selection
    Returns users grouped by program, with separate sections for lecturers and students
    """
    from django.db.models import Q
    
    # Get all users with programs (excluding outsiders)
    users = User.objects.filter(
        Q(role='student') | Q(role='lecturer'),
        program__isnull=False
    ).exclude(program='').order_by('program', 'role', 'full_name')
    
    # Group users by program
    programs_data = {}
    
    for user in users:
        program = user.program
        if program not in programs_data:
            programs_data[program] = {
                'program_name': program,
                'lecturers': [],
                'students': []
            }
        
        user_data = {
            'id': user.id,
            'full_name': user.full_name,
            'email': user.email,
            'role': user.role,
            'department': user.department or ''
        }
        
        if user.role == 'lecturer':
            programs_data[program]['lecturers'].append(user_data)
        elif user.role == 'student':
            programs_data[program]['students'].append(user_data)
    
    # Convert to list format
    programs_list = list(programs_data.values())
    
    return Response({
        'programs': programs_list
    })
