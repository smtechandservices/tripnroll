import uuid
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from .models import Flight, Booking, ContactMessage, UserProfile
from .serializers import (
    UserSerializer, RegisterSerializer, FlightSerializer, 
    BookingSerializer, AdminBookingSerializer, ContactMessageSerializer,
    UserProfileSerializer, AdminUserSerializer
)
from .permissions import IsAdminType
from rest_framework import filters
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user

class FlightListView(generics.ListAPIView):
    serializer_class = FlightSerializer

    def get_queryset(self):
        from django.db.models import Count, F, Q
        # Annotate with number of bookings to calculate available seats
        # We count CONFIRMED and PENDING bookings as taking up a seat
        booked_filter = Q(bookings__status='CONFIRMED') | Q(bookings__status='PENDING')

        queryset = Flight.objects.annotate(
            booked_seats_count=Count('bookings', filter=booked_filter)
        ).filter(
            # Filter where total_seats > booked_seats_count
            total_seats__gt=F('booked_seats_count')
        )
        
        origin = self.request.query_params.get('origin')
        destination = self.request.query_params.get('destination')
        date = self.request.query_params.get('date')
        flight_id = self.request.query_params.get('id')

        # Get filter parameters (can have multiple values)
        stops_filters = self.request.query_params.getlist('stops')
        airlines_filters = self.request.query_params.getlist('airlines')
        departure_time_filters = self.request.query_params.getlist('departure_time')
        arrival_time_filters = self.request.query_params.getlist('arrival_time')

        if flight_id:
            return queryset.filter(id=flight_id)

        if origin:
            queryset = queryset.filter(origin__icontains=origin)
        if destination:
            queryset = queryset.filter(destination__icontains=destination)
        if date:
            print(f"DEBUG: Filtering by date: {date}")
            queryset = queryset.filter(departure_time__date=date)
            print(f"DEBUG: Queryset count after date filter: {queryset.count()}")
            if queryset.exists():
                print(f"DEBUG: Sample flight departure: {queryset.first().departure_time}")
            else:
                print("DEBUG: No flights found after date filter.")
                all_route_flights = Flight.objects.filter(origin__icontains=origin, destination__icontains=destination)
                print(f"DEBUG: Total flights for this route: {all_route_flights.count()}")
                for f in all_route_flights[:5]:
                    print(f"DEBUG: Flight {f.flight_number} departs {f.departure_time}")
        
        # Filter by stops
        if stops_filters:
            from django.db.models import Q
            stops_q = Q()
            for stop_filter in stops_filters:
                if stop_filter == 'non-stop':
                    stops_q |= Q(stops=0)
                elif stop_filter == '1-stop':
                    stops_q |= Q(stops=1)
                elif stop_filter == '2-plus-stops':
                    stops_q |= Q(stops__gte=2)
            if stops_q:
                queryset = queryset.filter(stops_q)

        # Filter by airlines
        if airlines_filters:
            queryset = queryset.filter(airline__in=airlines_filters)

        # Filter by departure time
        if departure_time_filters:
            from django.db.models import Q
            from datetime import time as dt_time
            time_q = Q()
            for time_filter in departure_time_filters:
                if time_filter == 'early-morning':
                    time_q |= Q(departure_time__hour__gte=0, departure_time__hour__lt=6)
                elif time_filter == 'morning':
                    time_q |= Q(departure_time__hour__gte=6, departure_time__hour__lt=12)
                elif time_filter == 'afternoon':
                    time_q |= Q(departure_time__hour__gte=12, departure_time__hour__lt=18)
                elif time_filter == 'evening':
                    time_q |= Q(departure_time__hour__gte=18, departure_time__hour__lt=24)
            if time_q:
                queryset = queryset.filter(time_q)

        # Filter by arrival time
        if arrival_time_filters:
            from django.db.models import Q
            time_q = Q()
            for time_filter in arrival_time_filters:
                if time_filter == 'early-morning':
                    time_q |= Q(arrival_time__hour__gte=0, arrival_time__hour__lt=6)
                elif time_filter == 'morning':
                    time_q |= Q(arrival_time__hour__gte=6, arrival_time__hour__lt=12)
                elif time_filter == 'afternoon':
                    time_q |= Q(arrival_time__hour__gte=12, arrival_time__hour__lt=18)
                elif time_filter == 'evening':
                    time_q |= Q(arrival_time__hour__gte=18, arrival_time__hour__lt=24)
            if time_q:
                queryset = queryset.filter(time_q)
        
        return queryset

class BookingCreateView(generics.CreateAPIView):
    serializer_class = BookingSerializer

    def perform_create(self, serializer):
        # Generate a unique booking ID
        booking_id = f"TNR-{uuid.uuid4().hex[:8].upper()}"
        serializer.save(booking_id=booking_id, status='PENDING')

class BookingHistoryView(generics.ListAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        email = self.request.query_params.get('email')
        if email:
            return Booking.objects.filter(passenger_email=email).order_by('-created_at')
        return Booking.objects.none()

class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer

class SearchMetaView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, *args, **kwargs):
        origin_param = request.query_params.get('origin')
        dest_param = request.query_params.get('destination')

        # Base query for determining valid destinations/dates
        flights = Flight.objects.all()

        # Origins: Always return all unique origins (or could filter if needed, but usually we want all)
        origins = Flight.objects.values_list('origin', flat=True).distinct()

        # Destinations: Filter by origin if selected
        dest_qs = flights
        if origin_param:
            dest_qs = dest_qs.filter(origin__icontains=origin_param)
        destinations = dest_qs.values_list('destination', flat=True).distinct()

        # Dates: Filter by origin AND destination if selected
        date_qs = flights
        if origin_param:
            date_qs = date_qs.filter(origin__icontains=origin_param)
        if dest_param:
            date_qs = date_qs.filter(destination__icontains=dest_param)
        
        dates = date_qs.dates('departure_time', 'day')
        
        return Response({
            'origins': list(origins),
            'destinations': list(destinations),
            'dates': [d.strftime('%Y-%m-%d') for d in dates]
        })

class AvailableAirlinesView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, *args, **kwargs):
        """Get unique airlines based on search criteria"""
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        date = request.query_params.get('date')
        
        queryset = Flight.objects.all()
        
        if origin:
            queryset = queryset.filter(origin__icontains=origin)
        if destination:
            queryset = queryset.filter(destination__icontains=destination)
        if date:
            queryset = queryset.filter(departure_time__date=date)
        
        # Get unique airlines
        airlines = queryset.values_list('airline', flat=True).distinct().order_by('airline')
        
        return Response({
            'airlines': list(airlines)
        })

@api_view(['POST'])
@permission_classes([AllowAny])
def cleanup_flight_data(request):
    """
    Deletes unbooked flights that have already departed.
    """
    from django.utils import timezone
    from datetime import timedelta
    now = timezone.now()
    
    # 1. Delete unbooked flights that have departed (immediate cleanup)
    expired_unbooked_flights = Flight.objects.filter(
        departure_time__lt=now,
        bookings__isnull=True
    )
    unbooked_count = expired_unbooked_flights.count()
    if unbooked_count > 0:
        expired_unbooked_flights.delete()

    # 2. Delete booked flights that are older than 90 days (preserve recent history)
    cutoff_date = now - timedelta(days=90)
    old_booked_flights = Flight.objects.filter(
        departure_time__lt=cutoff_date,
        bookings__isnull=False
    )
    booked_count = old_booked_flights.count()
    if booked_count > 0:
        old_booked_flights.delete()
    
    total_deleted = unbooked_count + booked_count
    
    message = f'Cleanup complete. Deleted {unbooked_count} unbooked flights and {booked_count} old booked flights (>90 days).'
    return Response({'message': message, 'count': total_deleted}, status=status.HTTP_200_OK)

# Admin Views
class AdminFlightListCreateView(generics.ListCreateAPIView):
    serializer_class = FlightSerializer
    permission_classes = [IsAdminType]

    def get_queryset(self):
        queryset = Flight.objects.all().order_by('-departure_time')
        search = self.request.query_params.get('search')
        if search:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(airline__icontains=search) |
                Q(flight_number__icontains=search) |
                Q(origin__icontains=search) |
                Q(destination__icontains=search)
            )
        return queryset

class AdminFlightDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [IsAdminType]

class AdminFlightBulkCreateView(generics.CreateAPIView):
    queryset = Flight.objects.all()
    serializer_class = FlightSerializer
    permission_classes = [IsAdminType]

    def create(self, request, *args, **kwargs):
        data = request.data
        if isinstance(data, list):
            for item in data:
                # Map yyyy-mm-dd/hh:mm:ss to ISO format
                for field in ['departure_time', 'arrival_time']:
                    val = item.get(field)
                    if val and isinstance(val, str) and '/' in val:
                        date_part, time_part = val.split('/')
                        # Replace dashes with colons in time if necessary (handles both 14:30:00 and 14-30-00)
                        time_part = time_part.replace('-', ':')
                        item[field] = f"{date_part}T{time_part}"
        
        serializer = self.get_serializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class AdminBookingListView(generics.ListAPIView):
    queryset = Booking.objects.all().order_by('-created_at')
    serializer_class = BookingSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'passenger_email', 'booking_id']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate total revenue of all CONFIRMED bookings regardless of pagination
        from django.db.models import Sum
        total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(
            total=Sum('flight__price')
        )['total'] or 0

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            response.data['total_revenue'] = total_revenue
            return response

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'results': serializer.data,
            'total_revenue': total_revenue
        })

class AdminBookingDetailView(generics.RetrieveUpdateAPIView):
    queryset = Booking.objects.all()
    serializer_class = AdminBookingSerializer
    permission_classes = [IsAdminType]
    lookup_field = 'booking_id'

class AdminDashboardView(generics.GenericAPIView):
    permission_classes = [IsAdminType]

    def get(self, request):
        from django.db.models import Sum, Count
        from django.utils import timezone
        
        total_revenue = Booking.objects.filter(status='CONFIRMED').aggregate(
            total=Sum('flight__price')
        )['total'] or 0
        
        total_bookings = Booking.objects.count()
        active_bookings = Booking.objects.filter(status='CONFIRMED').count()
        total_flights = Flight.objects.count()
        
        recent_bookings = Booking.objects.order_by('-created_at')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data

        return Response({
            'total_revenue': total_revenue,
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'total_flights': total_flights,
            'recent_bookings': recent_bookings_data
        })

class AdminUserListView(generics.ListCreateAPIView):
    queryset = User.objects.filter(profile__usertype='user').order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']

class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all() # Allow managing any user if known by ID, but typically called for listed users
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminType]

class LoginView(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        
        username = request.data.get('username')
        if username and not User.objects.filter(username=username).exists():
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if not serializer.is_valid():
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})

