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
    infant_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stops = models.IntegerField(default=0)
    stop_details = models.CharField(max_length=255, blank=True, null=True)
    total_seats = models.IntegerField(default=10)
    is_hidden = models.BooleanField(default=False)
    pnr = models.CharField(max_length=20, blank=True, null=True)
    baggage_allowance = models.CharField(max_length=100, blank=True, null=True)
    layover_duration = models.CharField(max_length=100, blank=True, null=True)
    departure_terminal = models.CharField(max_length=50, blank=True, null=True)
    arrival_terminal = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return f"{self.airline} {self.flight_number}: {self.origin} -> {self.destination}"

class Booking(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('CANCELLED', 'Cancelled'),
        ('REJECTED', 'Rejected'),
        ('REFUND_REQUESTED', 'Refund Requested'),
        ('REFUNDED', 'Refunded'),
    ]

    flight = models.ForeignKey(Flight, on_delete=models.CASCADE, related_name='bookings')
    first_name = models.CharField(max_length=100, default='')
    last_name = models.CharField(max_length=100, default='')
    passenger_email = models.EmailField(blank=True, null=True)
    passenger_phone = models.CharField(max_length=20, blank=True, null=True)
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
    payment_mode = models.CharField(max_length=20, default='WALLET')
    refunded_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    is_infant = models.BooleanField(default=False)
    charged_price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
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
    address = models.TextField(blank=True)
    usertype = models.CharField(max_length=20, choices=USER_TYPE_CHOICES, default='user')
    wallet_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    credit_limit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_dues = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    # KYC Fields
    aadhar_number = models.CharField(max_length=12, blank=True, null=True)
    pan_number = models.CharField(max_length=10, blank=True, null=True)
    gst_number = models.CharField(max_length=15, blank=True, null=True)
    
    brand_logo = models.ImageField(upload_to='docs/brand_logos/', blank=True, null=True)
    aadhar_card_doc = models.FileField(upload_to='docs/aadhar/', blank=True, null=True)
    pan_card_doc = models.FileField(upload_to='docs/pan/', blank=True, null=True)

    kyc_status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('SUBMITTED', 'Submitted'),
            ('VERIFIED', 'Verified'),
            ('REJECTED', 'Rejected'),
        ],
        default='PENDING'
    )

    def __str__(self):
        return f"Profile for {self.user.username}"

class WalletTransaction(models.Model):
    TRANSACTION_TYPE_CHOICES = (
        ('CREDIT', 'Credit'), # Added funds
        ('DEBIT', 'Debit'),   # Spent funds
    )
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='wallet_transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPE_CHOICES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2)
    dues_after = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        return f"{self.transaction_type} of {self.amount} for {self.user.username}"

class TopUpRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    user = models.ForeignKey('auth.User', on_delete=models.CASCADE, related_name='topup_requests')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Top-up request of {self.amount} by {self.user.username} ({self.status})"
