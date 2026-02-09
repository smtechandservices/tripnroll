from django.db import models

class Flight(models.Model):
    airline = models.CharField(max_length=100)
    flight_number = models.CharField(max_length=20)
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    departure_time = models.DateTimeField()
    arrival_time = models.DateTimeField()
    duration = models.DurationField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    stops = models.IntegerField(default=0)
    stop_details = models.CharField(max_length=255, blank=True, null=True)
    total_seats = models.IntegerField(default=10)

    def __str__(self):
        return f"{self.airline} {self.flight_number}: {self.origin} -> {self.destination}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
    ]

    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='bookings')
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    passenger_email = models.EmailField()
    passenger_phone = models.CharField(max_length=20)
    date_of_birth = models.DateField(blank=True, null=True)
    passport_number = models.CharField(max_length=50, blank=True, null=True)
    passport_issue_date = models.DateField(blank=True, null=True)
    passport_expiry_date = models.DateField(blank=True, null=True)
    frequent_flyer_number = models.CharField(max_length=50, blank=True, null=True)
    travel_date = models.DateField()
    booking_id = models.CharField(max_length=20, unique=True)
    booked_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings_made')
    booking_group = models.CharField(max_length=50, blank=True, null=True)
    pnr = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Booking {self.booking_id} for {self.first_name} {self.last_name}"

class ContactMessage(models.Model):
    name = models.CharField(max_length=255)
    email = models.EmailField()
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class UserProfile(models.Model):
    USER_TYPE_CHOICES = (
        ('user', 'User'),
        ('admin', 'Admin'),
        ('superadmin', 'Super Admin'),
    )
    user = models.OneToOneField('auth.User', on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True)
    passport_number = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    usertype = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='user')

    def __str__(self):
        return f"Profile for {self.user.username}"
