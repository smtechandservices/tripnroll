import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from flights.models import Flight

class Command(BaseCommand):
    help = 'Populates the database with dummy flight data'

    def handle(self, *args, **kwargs):
        self.stdout.write('Deleting old flights...')
        Flight.objects.all().delete()

        airports = [
            "JFK", "LHR", "HND", "DXB", "CDG", "SIN", "AMS", "FRA", "IST", "DEL", 
            "BOM", "LAX", "YYZ", "SYD", "PEK", "HKG", "MUC", "ZRH", "NRT", "ICN",
            "MAD", "BCN", "FCO", "SFO", "ORD", "DFW", "ATL", "MIA", "SEA", "BOS",
            "YVR", "MEX", "GRU", "EZE", "JNB", "CPT", "CAI", "DOH", "AUH", "BKK",
            "KUL", "CGK", "MNL", "SGN", "MEL", "AKL", "VIE", "CPH", "ARN", "OSL",
            "HEL", "DUB"
        ]

        airlines = [
            'Delta Airlines', 'American Airlines', 'British Airways', 'Emirates', 
            'Lufthansa', 'Air France', 'Singapore Airlines', 'Qatar Airways', 
            'Cathay Pacific', 'ANA', 'JAL', 'United Airlines', 'Air Canada', 
            'Qantas', 'Turkish Airlines', 'Etihad Airways', 'KLM', 'Swiss',
            'Air India', 'IndiGo'
        ]

        flights_created = 0
        
        # Generate flights for next 30 days
        start_date = timezone.now()
        
        for _ in range(8000): # Create 8000 random flights
            origin = random.choice(airports)
            destination = random.choice([a for a in airports if a != origin])
            
            # Random date within next 30 days
            days_offset = random.randint(0, 30)
            hours_offset = random.randint(0, 23)
            minutes_offset = random.choice([0, 15, 30, 45])
            
            departure_time = start_date + timedelta(days=days_offset, hours=hours_offset, minutes=minutes_offset)
            
            # Duration between 1 and 15 hours
            duration_hours = random.randint(1, 15)
            duration_minutes = random.choice([0, 15, 30, 45])
            
            arrival_time = departure_time + timedelta(hours=duration_hours, minutes=duration_minutes)
            
            price = random.randint(5000, 150000) # Price in Rupees

            Flight.objects.create(
                airline=random.choice(airlines),
                flight_number=f"{random.choice(['AA', 'BA', 'DL', 'EK', 'LH', 'SQ', 'QR', 'CX', 'UA', 'AC', 'QF', 'TK', 'EY', 'KL', 'LX', 'AI', '6E'])}{random.randint(100, 999)}",
                origin=origin,
                destination=destination,
                departure_time=departure_time,
                arrival_time=arrival_time,
                duration=timedelta(hours=duration_hours, minutes=duration_minutes),
                price=price,
                stops=random.choice([0, 0, 0, 1, 2]) # More direct flights
            )
            flights_created += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {flights_created} flights'))
