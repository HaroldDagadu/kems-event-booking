from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Tag
from django.db.models import Q

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tag_list(request):
    """
    List all tags for event categorization
    """
    try:
        tags = Tag.objects.all().order_by('name')
        tag_data = [{'id': tag.id, 'name': tag.name} for tag in tags]
        return Response(tag_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': f'Failed to fetch tags: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
