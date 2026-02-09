import os
import django
import sys

# Set up Django environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'tripnroll_backend.settings')
django.setup()

from django.contrib.auth.models import User
from flights.models import WalletTransaction, Booking


print("Users:")
for u in User.objects.all():
    print(f" - {u.username}")

print(f"Total Transactions: {WalletTransaction.objects.count()}")

# Check for REFUNDED bookings
refunded_bookings = Booking.objects.filter(status='REFUNDED')
print(f"Refunded Bookings: {refunded_bookings.count()}")
for b in refunded_bookings:
    print(f"  Booking {b.booking_id} is refunded. User: {b.booked_by.username if b.booked_by else 'None'}")
