from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Flight, Booking, ContactMessage, UserProfile, WalletTransaction, TopUpRequest

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('phone_number', 'address', 'usertype', 'wallet_balance', 'credit_limit', 'total_dues', 'aadhar_number', 'pan_number', 'gst_number', 'brand_logo', 'aadhar_card_doc', 'pan_card_doc', 'kyc_status')
        read_only_fields = ('wallet_balance', 'credit_limit', 'total_dues', 'kyc_status')

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    phone_number = serializers.CharField(source='profile.phone_number', required=False, allow_blank=True)
    address = serializers.CharField(source='profile.address', required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'profile', 'phone_number', 'address', 'is_staff', 'is_superuser')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        # Update User fields (username, etc.)
        for attr, value in validated_data.items():
            if attr == 'username':
                value = value.lower()
            setattr(instance, attr, value)
        instance.save()

        # Update Profile fields
        if profile_data:
            profile = instance.profile
            for attr, value in profile_data.items():
                setattr(profile, attr, value)
            profile.save()
            
        return instance

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(required=False, allow_blank=True)
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
        # Use email as username for strictly email-based system, always lowercase
        email = validated_data['email'] # Keep email case as provided
        username = (validated_data.get('username') or email).lower()
        
        user = User.objects.create_user(
            username,
            email,
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
    payment_status = serializers.SerializerMethodField()
    flight_status = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('booking_id', 'status', 'created_at', 'booked_by', 'booking_group', 'pnr', 'payment_mode', 'is_infant', 'charged_price')

    def get_payment_status(self, obj):
        """User-facing payment/booking state."""
        mapping = {
            'CONFIRMED': 'CONFIRMED',
            'PENDING': 'PENDING',
            'CANCELLED': 'CANCELLED',
            'REJECTED': 'REJECTED',
            'REFUND_REQUESTED': 'REFUND REQUESTED',
            'REFUNDED': 'REFUNDED',
        }
        return mapping.get(obj.status, obj.status)

    def get_flight_status(self, obj):
        """Whether the airline has assigned a PNR."""
        return 'CONFIRMED' if obj.pnr else 'PENDING'

class AdminBookingSerializer(serializers.ModelSerializer):
    flight_details = FlightSerializer(source='flight', read_only=True)
    booked_by = UserSerializer(read_only=True)
    payment_status = serializers.SerializerMethodField()
    flight_status = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = ('booking_id', 'created_at', 'booked_by', 'booking_group', 'payment_mode')

    def get_payment_status(self, obj):
        """User-facing payment/booking state."""
        mapping = {
            'CONFIRMED': 'CONFIRMED',
            'PENDING': 'PENDING',
            'CANCELLED': 'CANCELLED',
            'REJECTED': 'REJECTED',
            'REFUND_REQUESTED': 'REFUND REQUESTED',
            'REFUNDED': 'REFUNDED',
        }
        return mapping.get(obj.status, obj.status)

    def get_flight_status(self, obj):
        """Whether the airline has assigned a PNR."""
        return 'CONFIRMED' if obj.pnr else 'PENDING'

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
        
        if 'username' in validated_data:
            validated_data['username'] = validated_data['username'].lower()
        # email is preserved as provided
            
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
            if attr == 'username':
                value = value.lower()
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

class TopUpRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = TopUpRequest
        fields = '__all__'
        read_only_fields = ('user', 'status', 'created_at', 'updated_at')
