from rest_framework import permissions

class IsAdminType(permissions.BasePermission):
    """
    Custom permission to only allow users with usertype 'admin' or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if user has profile and usertype is admin
        # Also allow superusers access
        return (
            request.user.is_superuser or 
            (hasattr(request.user, 'profile') and request.user.profile.usertype == 'admin')
        )

class IsSuperAdminType(permissions.BasePermission):
    """
    Custom permission to only allow users with usertype 'superadmin' or superusers.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
            
        return (
            request.user.is_superuser or 
            (hasattr(request.user, 'profile') and request.user.profile.usertype == 'superadmin')
        )
