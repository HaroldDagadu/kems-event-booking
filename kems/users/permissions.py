"""
Custom permission classes for KEMS system
"""

from rest_framework import permissions


class IsRegistrar(permissions.BasePermission):
    """
    Permission class to check if the user is a registrar
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and has registrar role
        """
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'registrar'
        )


class IsInsider(permissions.BasePermission):
    """
    Permission class to check if the user is an insider
    (student, lecturer, or registrar)
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and is an insider
        """
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role in ['student', 'lecturer', 'registrar']
        )


class IsOutsiderRequester(permissions.BasePermission):
    """
    Permission class to check if the user is an outsider and 
    is the requester of the specific object
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated and is an outsider
        """
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'outsider'
        )
    
    def has_object_permission(self, request, view, obj):
        """
        Check if the outsider user is the requester of the specific object
        """
        # Check if the object has a 'requester' attribute and it matches the user
        if hasattr(obj, 'requester'):
            return obj.requester == request.user
        
        # For objects that might have different field names
        if hasattr(obj, 'user'):
            return obj.user == request.user
            
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission class to allow read access to all authenticated users,
    but write access only to the owner of the object
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Read permissions for any authenticated user,
        Write permissions only for the owner
        """
        # Read permissions for safe methods
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for the owner
        if hasattr(obj, 'requester'):
            return obj.requester == request.user
        if hasattr(obj, 'organizer'):
            return obj.organizer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
            
        return False


class IsRegistrarOrOwner(permissions.BasePermission):
    """
    Permission class to allow access to registrars or the owner of the object
    """
    
    def has_permission(self, request, view):
        """
        Check if the user is authenticated
        """
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        """
        Allow access to registrars or the owner of the object
        """
        # Registrars have full access
        if request.user.role == 'registrar':
            return True
        
        # Owners have access to their own objects
        if hasattr(obj, 'requester'):
            return obj.requester == request.user
        if hasattr(obj, 'organizer'):
            return obj.organizer == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
            
        return False


class IsInvitedUser(permissions.BasePermission):
    """
    Permission class to check if the user is invited to a specific event
    """
    
    def has_object_permission(self, request, view, obj):
        """
        Check if the user is invited to the event (for private events)
        or if it's a public event
        """
        # For public events, all authenticated users can view
        if hasattr(obj, 'is_public') and obj.is_public:
            return True
        
        # For private events, check if user is invited
        if hasattr(obj, 'invitation_set'):
            return obj.invitation_set.filter(
                invited_user=request.user,
                status='accepted'
            ).exists()
        
        # For invitation objects themselves
        if hasattr(obj, 'invited_user'):
            return obj.invited_user == request.user
            
        return False 