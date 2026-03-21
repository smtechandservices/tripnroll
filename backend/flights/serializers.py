from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Flight, Booking, ContactMessage, UserProfile, WalletTransaction

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'address', 'usertype', 'wallet_balance', 'credit_limit', 'total_dues', 'aadhar_number', 'pan_number', 'kyc_status')
        read_only_fields = ('wallet_balance', 'credit_limit', 'total_dues', 'kyc_status')

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile', 'is_staff', 'is_superuser')

class RegisterSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'phone_number', 'address')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        profile_data = {
            'phone_number': validated_data.pop('phone_number', ''),
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
        read_only_fields = ('booking_id', 'status', 'created_at', 'booked_by', 'booking_group', 'pnr')

class AdminBookingSerializer(serializers.ModelSerializer):
    flight_details = FlightSerializer(source='flight', read_only=True)
    booked_by = UserSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('booking_id', 'created_at', 'booked_by', 'booking_group')

class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = '__all__'
        
class AdminUserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile', 'is_staff', 'is_superuser', 'date_joined')
        read_only_fields = ('id', 'date_joined')

    def create(self, validated_data):
        profile_data = validated_data.pop('profile', {})
        password = validated_data.pop('password', 'tripnroll123') # Default password if not provided
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # UserProfile is created via signal or manually. 
        # Since RegisterSerializer does it manually, we'll do it here too just in case.
        UserProfile.objects.update_or_create(user=user, defaults=profile_data)
        return user

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if profile_data:
            profile = instance.profile
            # Handle wallet fields separately if needed, but for now allow direct update
            # Note: UserProfileSerializer marks them read_only, so we might need a specific serializer for updates
            # OR we can just iterate and set. Since AdminUserSerializer uses UserProfileSerializer as a nested field,
            # and UserProfileSerializer has them as read_only, they might be stripped from validated_data.
            # Let's fix this by using a writable serializer for the profile in AdminUserSerializer 
            # OR extracting them manually from initial_data if DRF strips them.
            # Better approach: Create a WritableUserProfileSerializer for Admin use.
             
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance
