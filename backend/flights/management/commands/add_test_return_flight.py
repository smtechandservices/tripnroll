from django.core.management.base import BaseCommand
from django.utils import timezone
from flights.models import Flight
from datetime import datetime, timedelta
import pytz

class Command(BaseCommand):
    help = 'Adds a specific test return flight from DEL to DXB'

    def handle(self, *args, **kwargs):
        # Target Date: Feb 21, 2026
        # Note: We need to be careful with timezone. Django usually uses UTC or configured timezone.
        # Let's assume UTC for simplicity or use django.utils.timezone
        
        # Create a specific datetime for 2026-02-21
        # 16:00 (4 PM) departure
        departure_time = datetime(2026, 2, 21, 16, 0, 0, tzinfo=pytz.UTC)
        duration = timedelta(hours=4, minutes=30)
        arrival_time = departure_time + duration
        
        Flight.objects.create(
            airline='Emirates',
            flight_number='EK555',
            origin='DEL',
            destination='DXB',
            departure_time=departure_time,
            arrival_time=arrival_time,
            duration=duration,
            price=45000.00,
            stops=0
        )
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created flight EK555 DEL->DXB on {departure_time}'))
