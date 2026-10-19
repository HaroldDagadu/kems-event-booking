"""
Serializers for users app
"""

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from booking.models import BookingRequest
from .models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for insider user registration
    """
    
    password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Password for the account"
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
        help_text="Confirm your password"
    )
    
    class Meta:
        model = User
        fields = [
            'full_name', 'email', 'school_id_num', 'password', 
            'password_confirm', 'role', 'program', 'department', 
            'contact_number'
        ]
        extra_kwargs = {
            'email': {'required': True},
            'full_name': {'required': True},
            'role': {'required': True},
            'school_id_num': {'required': True},
        }
    
    def validate_email(self, value):
        """Validate email uniqueness"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_school_id_num(self, value):
        """Validate school ID uniqueness"""
        if User.objects.filter(school_id_num=value).exists():
            raise serializers.ValidationError("A user with this school ID already exists.")
        return value
    
    def validate_password(self, value):
        """Validate password strength"""
        try:
            validate_password(value)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Check password confirmation
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        
        # Validate role-specific requirements
        role = attrs.get('role')
        program = attrs.get('program')
        department = attrs.get('department')
        
        if role == 'student' and not program:
            raise serializers.ValidationError({
                'program': 'Students must specify a program.'
            })
        
        if role in ['lecturer', 'registrar'] and not department:
            raise serializers.ValidationError({
                'department': 'Lecturers and registrars must specify a department.'
            })
        
        # Remove password_confirm from validated data
        attrs.pop('password_confirm', None)
        return attrs
    
    def create(self, validated_data):
        """Create user with hashed password"""
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for insider user login
    """
    
    email = serializers.EmailField(
        help_text="Email address for login"
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="Password for the account"
    )
    
    def validate(self, attrs):
        """Authenticate user credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(email=email, password=password)
            
            if not user:
                raise serializers.ValidationError(
                    'Invalid email or password.',
                    code='authorization'
                )
            
            if not user.is_active:
                raise serializers.ValidationError(
                    'User account is disabled.',
                    code='authorization'
                )
            
            # Ensure user is an insider for this login endpoint
            if not user.is_insider:
                raise serializers.ValidationError(
                    'This login is only for university members.',
                    code='authorization'
                )
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError(
                'Both email and password are required.',
                code='authorization'
            )


class OutsiderTempLoginSerializer(serializers.Serializer):
    """
    Serializer for outsider temporary login
    """
    
    username = serializers.CharField(
        help_text="Temporary username provided via email"
    )
    password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="Temporary password provided via email"
    )
    
    def validate(self, attrs):
        """Authenticate temporary credentials"""
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            try:
                # Find booking request with matching temporary credentials
                booking_request = BookingRequest.objects.get(
                    temporary_login_username=username
                )
                
                # Check if credentials are still valid (not expired)
                from django.utils import timezone
                if booking_request.login_expiry_date and booking_request.login_expiry_date < timezone.now():
                    raise serializers.ValidationError(
                        'Temporary login credentials have expired.',
                        code='authorization'
                    )
                
                # Verify password (stored as hashed in database)
                from django.contrib.auth.hashers import check_password
                if not check_password(password, booking_request.temporary_login_password):
                    raise serializers.ValidationError(
                        'Invalid temporary credentials.',
                        code='authorization'
                    )
                
                # Check if booking is in approved or paid status
                if booking_request.status not in ['approved', 'paid']:
                    raise serializers.ValidationError(
                        'Access not available for this booking.',
                        code='authorization'
                    )
                
                attrs['booking_request'] = booking_request
                attrs['user'] = booking_request.requester
                return attrs
                
            except BookingRequest.DoesNotExist:
                raise serializers.ValidationError(
                    'Invalid temporary credentials.',
                    code='authorization'
                )
        else:
            raise serializers.ValidationError(
                'Both username and password are required.',
                code='authorization'
            )


class UserDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying and updating user profile information
    """
    
    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'email', 'school_id_num', 
            'role', 'program', 'department', 'contact_number',
            'date_joined', 'is_active'
        ]
        read_only_fields = ['id', 'email', 'school_id_num', 'role', 'date_joined']
    
    def validate(self, attrs):
        """Cross-field validation for updates"""
        # Get the current user instance
        user = self.instance
        
        if user:
            role = user.role
            program = attrs.get('program', user.program)
            department = attrs.get('department', user.department)
            
            # Validate role-specific requirements
            if role == 'student' and not program:
                raise serializers.ValidationError({
                    'program': 'Students must have a program specified.'
                })
            
            if role in ['lecturer', 'registrar'] and not department:
                raise serializers.ValidationError({
                    'department': 'Lecturers and registrars must have a department specified.'
                })
        
        return attrs


class PasswordChangeSerializer(serializers.Serializer):
    """
    Serializer for changing user password
    """
    
    old_password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="Current password"
    )
    new_password = serializers.CharField(
        style={'input_type': 'password'},
        help_text="New password"
    )
    new_password_confirm = serializers.CharField(
        style={'input_type': 'password'},
        help_text="Confirm new password"
    )
    
    def validate_old_password(self, value):
        """Validate current password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Incorrect current password.')
        return value
    
    def validate_new_password(self, value):
        """Validate new password strength"""
        try:
            validate_password(value, self.context['request'].user)
        except ValidationError as e:
            raise serializers.ValidationError(e.messages)
        return value
    
    def validate(self, attrs):
        """Cross-field validation"""
        if attrs.get('new_password') != attrs.get('new_password_confirm'):
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })
        return attrs
    
    def save(self):
        """Update user password"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user 