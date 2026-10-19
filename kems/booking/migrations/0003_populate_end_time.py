# Data migration to populate end_time from start_time and duration_hours

from django.db import migrations
from datetime import datetime, timedelta


def populate_end_time(apps, schema_editor):
    """Calculate end_time from start_time and duration_hours"""
    BookingRequest = apps.get_model('booking', 'BookingRequest')
    
    for booking in BookingRequest.objects.all():
        if booking.start_time and booking.duration_hours and booking.end_time is None:
            # Create a datetime object for calculation
            start_datetime = datetime.combine(booking.desired_date, booking.start_time)
            
            # Add duration to get end datetime
            duration_timedelta = timedelta(hours=float(booking.duration_hours))
            end_datetime = start_datetime + duration_timedelta
            
            # Extract the time component
            booking.end_time = end_datetime.time()
            booking.save()


def reverse_populate_end_time(apps, schema_editor):
    """Reverse migration - calculate duration_hours from start_time and end_time"""
    BookingRequest = apps.get_model('booking', 'BookingRequest')
    
    for booking in BookingRequest.objects.all():
        if booking.start_time and booking.end_time and booking.duration_hours is None:
            # Create datetime objects for calculation
            start_datetime = datetime.combine(booking.desired_date, booking.start_time)
            end_datetime = datetime.combine(booking.desired_date, booking.end_time)
            
            # Calculate duration in hours
            duration_timedelta = end_datetime - start_datetime
            duration_hours = duration_timedelta.total_seconds() / 3600
            
            booking.duration_hours = duration_hours
            booking.save()


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0002_add_end_time_field'),
    ]

    operations = [
        migrations.RunPython(populate_end_time, reverse_populate_end_time),
    ]