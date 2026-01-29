from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Flight, Booking, ContactMessage, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'passport_number', 'address')

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile')

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    passport_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone_number', 'passport_number', 'address')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = {
            'phone_number': validated_data.pop('phone_number', ''),
            'passport_number': validated_data.pop('passport_number', ''),
            'address': validated_data.pop('address', '')
        }
        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password']
        )
        UserProfile.objects.create(user=user, **profile_data)
        return user

class FlightSerializer(serializers.ModelSerializer):
    available_seats = serializers.SerializerMethodField()

    class Meta:
        model = Flight
        fields = '__all__'

    def get_available_seats(self, obj):
        from django.db.models import Q
        # Calculate available seats
        # We count CONFIRMED and PENDING bookings as taking up a seat
        booked_filter = Q(status='CONFIRMED') | Q(status='PENDING')
        
        # If the object is annotated from the view, use that to save a query
        if hasattr(obj, 'booked_seats_count'):
            booked = obj.booked_seats_count
        else:
            booked = obj.bookings.filter(booked_filter).count()
            
        return max(0, obj.total_seats - booked)

class BookingSerializer(serializers.ModelSerializer):
    flight_details = FlightSerializer(source='flight', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('booking_id', 'status', 'created_at')

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
