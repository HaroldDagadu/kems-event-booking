from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class UserManager(BaseUserManager):
    """Custom user manager where email is the unique identifier"""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user with the given email and password"""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser with the given email and password"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'registrar')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
            
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """
    Custom User model for KEMS system
    Supports both insiders (students, lecturers, registrars) and outsiders
    """
    
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('lecturer', 'Lecturer'),
        ('registrar', 'Registrar'),
        ('outsider', 'Outsider'),
    ]
    
    # Remove username field as we use email for authentication
    username = None
    
    # Core fields
    email = models.EmailField(unique=True, help_text="Primary identifier for login")
    school_id_num = models.CharField(
        max_length=50, 
        unique=True, 
        null=True, 
        blank=True,
        help_text="Unique school ID for students/staff"
    )
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES,
        help_text="User's role in the system"
    )
    
    # Profile fields
    full_name = models.CharField(max_length=255, help_text="User's full name")
    contact_number = models.CharField(
        max_length=20, 
        null=True, 
        blank=True,
        help_text="Phone number for SMS notifications"
    )
    position = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="Position/title for outsiders (e.g., Event Manager, CEO)"
    )
    
    # Academic fields (for insiders)
    program = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="Student's academic program (e.g., Computer Engineering)"
    )
    department = models.CharField(
        max_length=100, 
        null=True, 
        blank=True,
        help_text="Department for lecturers and registrars"
    )
    
    # Set email as the unique identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['full_name', 'role']
    
    objects = UserManager()
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.full_name} ({self.email})"
    
    @property
    def is_insider(self):
        """Check if user is an insider (student, lecturer, or registrar)"""
        return self.role in ['student', 'lecturer', 'registrar']
    
    @property
    def is_outsider(self):
        """Check if user is an outsider"""
        return self.role == 'outsider'
    
    @property
    def is_registrar(self):
        """Check if user is a registrar"""
        return self.role == 'registrar'
    
    def clean(self):
        """Custom validation for User model"""
        from django.core.exceptions import ValidationError
        
        # Validate that students have a program
        if self.role == 'student' and not self.program:
            raise ValidationError({'program': 'Students must have a program specified.'})
        
        # Validate that lecturers and registrars have a department
        if self.role in ['lecturer', 'registrar'] and not self.department:
            raise ValidationError({'department': 'Lecturers and registrars must have a department specified.'})
        
        # Validate that insiders have a school_id_num
        if self.is_insider and not self.school_id_num:
            raise ValidationError({'school_id_num': 'Insiders must have a school ID number.'})
    
    def save(self, *args, **kwargs):
        """Override save to run clean validation"""
        self.full_clean()
        super().save(*args, **kwargs)
