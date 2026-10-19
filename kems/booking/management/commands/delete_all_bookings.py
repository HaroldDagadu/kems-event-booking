"""
Django management command to delete all bookings from the KEMS database
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from booking.models import BookingRequest, Payment, Event, Invitation


class Command(BaseCommand):
    help = 'Delete all booking requests, payments, events, and invitations from the database'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force deletion without confirmation prompt'
        )

    def handle(self, *args, **options):
        """Execute the command"""
        self.stdout.write("Starting deletion process...")
        
        # Get counts before deletion
        booking_count = BookingRequest.objects.count()
        payment_count = Payment.objects.count()
        event_count = Event.objects.count()
        invitation_count = Invitation.objects.count()
        
        self.stdout.write(f"Found {booking_count} booking requests")
        self.stdout.write(f"Found {payment_count} payments") 
        self.stdout.write(f"Found {event_count} events")
        self.stdout.write(f"Found {invitation_count} invitations")
        
        if booking_count == 0 and payment_count == 0 and event_count == 0 and invitation_count == 0:
            self.stdout.write(self.style.WARNING("No booking data found to delete."))
            return
        
        # Confirm deletion unless --force is used
        if not options['force']:
            confirm = input(f"\nThis will delete ALL booking data. Type 'DELETE' to confirm: ")
            if confirm != 'DELETE':
                self.stdout.write(self.style.ERROR("Deletion cancelled."))
                return
        
        try:
            with transaction.atomic():
                # Delete in the correct order (due to foreign key constraints)
                self.stdout.write("\n1. Deleting invitations...")
                deleted_invitations = Invitation.objects.all().delete()
                self.stdout.write(f"   Deleted {deleted_invitations[0]} invitations")
                
                self.stdout.write("2. Deleting payments...")
                deleted_payments = Payment.objects.all().delete()
                self.stdout.write(f"   Deleted {deleted_payments[0]} payments")
                
                self.stdout.write("3. Deleting events...")
                deleted_events = Event.objects.all().delete()
                self.stdout.write(f"   Deleted {deleted_events[0]} events")
                
                self.stdout.write("4. Deleting booking requests...")
                deleted_bookings = BookingRequest.objects.all().delete()
                self.stdout.write(f"   Deleted {deleted_bookings[0]} booking requests")
                
                self.stdout.write(self.style.SUCCESS("\n✅ All booking data has been successfully deleted!"))
                
                # Verify deletion
                self.stdout.write("\nVerifying deletion...")
                self.stdout.write(f"Remaining bookings: {BookingRequest.objects.count()}")
                self.stdout.write(f"Remaining payments: {Payment.objects.count()}")
                self.stdout.write(f"Remaining events: {Event.objects.count()}")
                self.stdout.write(f"Remaining invitations: {Invitation.objects.count()}")
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error during deletion: {str(e)}"))
            raise