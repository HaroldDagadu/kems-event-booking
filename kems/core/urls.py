"""
URL patterns for core app
"""

from django.urls import path
from .views import tag_list

urlpatterns = [
    # Tags API
    path('tags/', tag_list, name='tag_list'),
]