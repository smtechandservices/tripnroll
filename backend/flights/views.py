from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django.contrib.auth.models import User
from rest_framework.decorators import api_view, permission_classes
from .models import Flight, Booking, ContactMessage, UserProfile, WalletTransaction, TopUpRequest
from .serializers import (
    UserSerializer, RegisterSerializer, FlightSerializer, 
    BookingSerializer, AdminBookingSerializer, ContactMessageSerializer,
    UserProfileSerializer, AdminUserSerializer, WalletTransactionSerializer,
    TopUpRequestSerializer
)
from .permissions import IsAdminType
from rest_framework import filters
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
import uuid
from datetime import date
from decimal import Decimal

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
        from django.utils import timezone
        from datetime import timedelta

        # Automatic Cleanup: Delete flights older than 30 days
        try:
            cutoff_date = timezone.now() - timedelta(days=30)
            Flight.objects.filter(departure_time__lt=cutoff_date).delete()
        except Exception as e:
            # Log error but don't stop the request
            print(f"Error during auto-cleanup: {e}")
        
        origin = self.request.query_params.get('origin')
        destination = self.request.query_params.get('destination')
        date = self.request.query_params.get('date')
        flight_id = self.request.query_params.get('id')
        passengers = self.request.query_params.get('passengers')

        # Annotate with number of bookings to calculate available seats
        # We count CONFIRMED and PENDING bookings as taking up a seat
        booked_filter = Q(bookings__status='CONFIRMED') | Q(bookings__status='PENDING')

        queryset = Flight.objects.filter(is_hidden=False).annotate(
            booked_seats_count=Count('bookings', filter=booked_filter)
        )

        if not flight_id:
            from django.utils import timezone
            queryset = queryset.filter(departure_time__gt=timezone.now())

        # Filter by passenger capacity if specified
        if passengers:
            try:
                passengers_count = int(passengers)
                queryset = queryset.filter(
                    total_seats__gte=F('booked_seats_count') + passengers_count
                )
            except (ValueError, TypeError):
                queryset = queryset.filter(
                    total_seats__gt=F('booked_seats_count')
                )
        else:
            queryset = queryset.filter(
                total_seats__gt=F('booked_seats_count')
            )
        
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
    permission_classes = [IsAuthenticated]


    def create(self, request, *args, **kwargs):
        passengers = request.data.get('passengers', [])
        payment_mode = 'WALLET' # Hardcode to WALLET for all new bookings
        
        if not passengers:
             # Fallback for single passenger data direct in request root (Legacy support)
             # NOTE: This path needs update for wallet logic if we want to support it fully.
             # For now, let's assume the new bulk format is primary.
             return super().create(request, *args, **kwargs)
        
        # Calculate total cost (Infants 0-2 yrs are free)
        flight_id = request.data.get('flight')
        try:
            flight = Flight.objects.get(id=flight_id)
        except Flight.DoesNotExist:
            return Response({'error': 'Flight not found'}, status=status.HTTP_404_NOT_FOUND)
            
        total_cost = Decimal('0.00')
        for p in passengers:
            dob_str = p.get('date_of_birth')
            is_infant = False
            if dob_str:
                try:
                    # dob_str is YYYY-MM-DD
                    y, m, d = map(int, dob_str.split('-'))
                    dob = date(y, m, d)
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (m, d))
                    if age <= 2:
                        is_infant = True
                except (ValueError, TypeError, AttributeError):
                    pass
            
            if not is_infant:
                total_cost += flight.price
        user = request.user
        profile = user.profile

        # KYC Verification Check
        if profile.kyc_status != 'VERIFIED':
            return Response({
                'error': 'KYC Verification Required',
                'details': 'Please complete your KYC verification (Aadhar and PAN) to book flights.',
                'kyc_status': profile.kyc_status
            }, status=status.HTTP_403_FORBIDDEN)

        # Ensure prices are decimals
        total_cost = Decimal(str(total_cost))

        # Wallet Logic (Mandatory for all bookings now)
        if True: # Always enforce wallet deduction logic
            available_funds = profile.wallet_balance + (profile.credit_limit - profile.total_dues)
            if available_funds < total_cost:
                return Response({
                    'error': 'Insufficient funds/credit limit',
                    'available': available_funds,
                    'required': total_cost
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Deduct funds
            spent_from_wallet = Decimal('0.00')
            added_to_dues = Decimal('0.00')

            if profile.wallet_balance >= total_cost:
                profile.wallet_balance -= total_cost
                spent_from_wallet = total_cost
            else:
                spent_from_wallet = profile.wallet_balance
                remaining_cost = total_cost - profile.wallet_balance
                profile.wallet_balance = Decimal('0.00')
                profile.total_dues += remaining_cost
                added_to_dues = remaining_cost
            
            profile.save()

            # Record Transaction
            WalletTransaction.objects.create(
                user=user,
                amount=total_cost,
                transaction_type='DEBIT',
                description=f"Booking for {len(passengers)} passengers on flight {flight.flight_number}. Wallet: {spent_from_wallet}, Credit used: {added_to_dues}.",
                balance_after=profile.wallet_balance,
                dues_after=profile.total_dues
            )

        booking_group = f"GRP-{uuid.uuid4().hex[:8].upper()}"
        pnr = flight.pnr
        response_data = []
        
        travel_date = request.data.get('travel_date')

        for p_data in passengers:
            # Mix in group level data
            p_data['flight'] = flight_id
            p_data['travel_date'] = travel_date
            p_data['payment_mode'] = payment_mode
            
            serializer = self.get_serializer(data=p_data)
            serializer.is_valid(raise_exception=True)
            
            booking_id = f"TNR-{uuid.uuid4().hex[:8].upper()}"
            
            # Determine if infant to set historical price and tag correctly
            dob_str = p_data.get('date_of_birth')
            is_infant_passenger = False
            passenger_charged_price = flight.price
            
            if dob_str:
                try:
                    y, m, d = map(int, dob_str.split('-'))
                    dob = date(y, m, d)
                    today = date.today()
                    age = today.year - dob.year - ((today.month, today.day) < (m, d))
                    if age <= 2:
                        is_infant_passenger = True
                        passenger_charged_price = Decimal('0.00')
                except (ValueError, TypeError, AttributeError):
                    pass

            serializer.save(
                booking_id=booking_id, 
                status='CONFIRMED',
                booked_by=request.user,
                booking_group=booking_group,
                pnr=pnr,
                is_infant=is_infant_passenger,
                charged_price=passenger_charged_price
            )
            response_data.append(serializer.data)
            
        return Response(response_data[0] if len(response_data) == 1 else response_data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        # This is for single create, simplified wallet logic (might need expansion if single create is used)
        booking_id = f"TNR-{uuid.uuid4().hex[:8].upper()}"
        
        # Get flight from validated data
        flight = serializer.validated_data.get('flight')
        airline = flight.airline if flight else 'TNR'
        
        pnr = flight.pnr if flight else None
        # Determine if infant to set historical price and tag correctly
        dob_str = serializer.validated_data.get('date_of_birth')
        is_infant_passenger = False
        passenger_charged_price = flight.price if flight else Decimal('0.00')
        
        if dob_str:
            try:
                from datetime import date as dt_date
                if isinstance(dob_str, dt_date):
                    dob = dob_str
                else:
                    y, m, d = map(int, str(dob_str).split('-'))
                    dob = dt_date(y, m, d)
                
                today = dt_date.today()
                age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
                if age <= 2:
                    is_infant_passenger = True
                    passenger_charged_price = Decimal('0.00')
            except (ValueError, TypeError, AttributeError):
                pass

        serializer.save(
            booking_id=booking_id, 
            status='CONFIRMED',
            booked_by=self.request.user,
            pnr=pnr,
            is_infant=is_infant_passenger,
            charged_price=passenger_charged_price
        )

class BookingHistoryView(generics.ListAPIView):
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Booking.objects.filter(booked_by=self.request.user).order_by('-created_at')

class ContactCreateView(generics.CreateAPIView):
    serializer_class = ContactMessageSerializer

class SearchMetaView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, *args, **kwargs):
        origin_param = request.query_params.get('origin')
        dest_param = request.query_params.get('destination')
        passengers = request.query_params.get('passengers', 1)
        try:
            passengers = int(passengers)
        except (ValueError, TypeError):
            passengers = 1

        # Base query for determining valid destinations/dates
        flights = Flight.objects.filter(is_hidden=False, total_seats__gte=passengers)

        # Origins: Always return all unique origins (or could filter if needed, but usually we want all)
        origins = flights.values_list('origin', flat=True).distinct()

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
        
        from django.utils import timezone
        date_qs = date_qs.filter(departure_time__gt=timezone.now())
        dates = date_qs.dates('departure_time', 'day')

        return_dates = []
        if origin_param and dest_param:
            return_date_qs = flights.filter(
                origin__icontains=dest_param,
                destination__icontains=origin_param,
                departure_time__gt=timezone.now()
            )
            return_dates = return_date_qs.dates('departure_time', 'day')
        
        return Response({
            'origins': list(origins),
            'destinations': list(destinations),
            'dates': [d.strftime('%Y-%m-%d') for d in dates],
            'return_dates': [d.strftime('%Y-%m-%d') for d in return_dates]
        })

class AvailableAirlinesView(generics.RetrieveAPIView):
    permission_classes = (AllowAny,)
    
    def get(self, request, *args, **kwargs):
        """Get unique airlines based on search criteria"""
        origin = request.query_params.get('origin')
        destination = request.query_params.get('destination')
        date = request.query_params.get('date')
        passengers = request.query_params.get('passengers', 1)
        try:
            passengers = int(passengers)
        except (ValueError, TypeError):
            passengers = 1
        
        queryset = Flight.objects.filter(is_hidden=False, total_seats__gte=passengers)
        
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
        from django.utils import timezone
        queryset = Flight.objects.filter(departure_time__gt=timezone.now()).order_by('departure_time')
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
    serializer_class = AdminBookingSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['first_name', 'last_name', 'passenger_email', 'booking_id']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Calculate total revenue of all CONFIRMED bookings regardless of pagination
        from django.db.models import Sum, F, Q
        from decimal import Decimal
        
        # Net revenue = Sum of (flight price - refunded amount) for CONFIRMED and REFUNDED bookings
        confirmed_bookings = Booking.objects.filter(Q(status='CONFIRMED') | Q(status='REFUNDED'))
        total_revenue = Decimal('0.00')
        
        for booking in confirmed_bookings:
            net_amount = booking.flight.price - booking.refunded_amount
            total_revenue += net_amount

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
        from django.db.models import Sum, Count, Q
        from django.utils import timezone
        from decimal import Decimal
        
        # Calculate net revenue (price - refunded_amount) for CONFIRMED and REFUNDED bookings
        # Revenue should arguably include past flights too, so we keep this as is for total lifetime revenue
        confirmed_bookings = Booking.objects.filter(Q(status='CONFIRMED') | Q(status='REFUNDED'))
        total_revenue = Decimal('0.00')
        
        for booking in confirmed_bookings:
            # Fallback for old bookings that don't have charged_price set
            price_to_use = booking.charged_price if (booking.charged_price > 0 or booking.is_infant) else booking.flight.price
            net_amount = price_to_use - booking.refunded_amount
            total_revenue += net_amount
        
        total_bookings = Booking.objects.count()

        # Update: Active bookings = Confirmed bookings for FUTURE flights
        active_bookings = Booking.objects.filter(
            status='CONFIRMED',
            flight__departure_time__gt=timezone.now()
        ).count()

        # Update: Total flights = FUTURE flights only
        total_flights = Flight.objects.filter(departure_time__gt=timezone.now()).count()
        
        recent_bookings = Booking.objects.order_by('-created_at')[:5]
        recent_bookings_data = BookingSerializer(recent_bookings, many=True).data

        pending_topups = TopUpRequest.objects.filter(status='PENDING').count()
        pending_refunds = Booking.objects.filter(status='REFUND_REQUESTED').count()

        return Response({
            'total_revenue': total_revenue,
            'total_bookings': total_bookings,
            'active_bookings': active_bookings,
            'total_flights': total_flights,
            'pending_topups': pending_topups,
            'pending_refunds': pending_refunds,
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
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email:
            # Fallback for username-based login if needed, but the requirement is email
            username = request.data.get('username')
            if username:
                try:
                    user = User.objects.get(username=username)
                    email = user.email
                except User.DoesNotExist:
                    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            else:
                return Response({'error': 'Email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        # AuthTokenSerializer expects 'username' and 'password'
        serializer = self.serializer_class(data={'username': user.username, 'password': password}, 
                                         context={'request': request})
        
        if not serializer.is_valid():
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({'token': token.key})


class WalletBalanceView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get(self, request, *args, **kwargs):
        user = request.user
        profile = user.profile
        recent_transactions = WalletTransaction.objects.filter(user=user).order_by('-timestamp')[:10]
        
        return Response({
            'wallet_balance': profile.wallet_balance,
            'credit_limit': profile.credit_limit,
            'total_dues': profile.total_dues,
            'available_spending_power': profile.wallet_balance + (profile.credit_limit - profile.total_dues),
            'recent_transactions': WalletTransactionSerializer(recent_transactions, many=True).data
        })

class UserTopUpRequestListView(generics.ListAPIView):
    serializer_class = TopUpRequestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TopUpRequest.objects.filter(user=self.request.user).order_by('-created_at')

class WalletTopUpView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = TopUpRequestSerializer

    def create(self, request, *args, **kwargs):
        amount = request.data.get('amount')
        try:
            amount = float(amount)
            if amount <= 0:
                raise ValueError
        except (TypeError, ValueError):
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal
        amount = Decimal(str(amount))
        user = request.user
        
        # Create a Top-up Request instead of immediate top-up
        topup_request = TopUpRequest.objects.create(
            user=user,
            amount=amount,
            status='PENDING'
        )

        return Response({
            'message': 'Top-up request submitted for admin approval',
            'request_id': topup_request.id,
            'amount': topup_request.amount,
            'status': topup_request.status
        }, status=status.HTTP_201_CREATED)

class AdminTopUpRequestListView(generics.ListAPIView):
    queryset = TopUpRequest.objects.all().order_by('-created_at')
    serializer_class = TopUpRequestSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['user__username', 'user__email']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class AdminTopUpRequestActionView(generics.GenericAPIView):
    permission_classes = [IsAdminType]

    def post(self, request):
        request_id = request.data.get('request_id')
        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        
        if not request_id or not action:
            return Response({'error': 'Request ID and action are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            topup_request = TopUpRequest.objects.get(id=request_id)
        except TopUpRequest.DoesNotExist:
            return Response({'error': 'Top-up request not found'}, status=status.HTTP_404_NOT_FOUND)

        if topup_request.status != 'PENDING':
            return Response({'error': 'This request has already been processed'}, status=status.HTTP_400_BAD_REQUEST)

        user = topup_request.user
        profile = user.profile
        from decimal import Decimal

        if action == 'APPROVE':
            topup_request.status = 'APPROVED'
            amount = topup_request.amount
            
            # Logic: Clear dues first (copied from original WalletTopUpView)
            dues_cleared = Decimal('0.00')
            wallet_added = Decimal('0.00')

            if profile.total_dues > 0:
                if amount >= profile.total_dues:
                    dues_cleared = profile.total_dues
                    remaining_amount = amount - profile.total_dues
                    profile.total_dues = Decimal('0.00')
                    profile.wallet_balance += remaining_amount
                    wallet_added = remaining_amount
                else:
                    dues_cleared = amount
                    profile.total_dues -= amount
                    wallet_added = Decimal('0.00')
            else:
                profile.wallet_balance += amount
                wallet_added = amount

            profile.save()

            # Create Transaction Record
            WalletTransaction.objects.create(
                user=user,
                amount=amount,
                transaction_type='CREDIT',
                description=f"Top-up of {amount} (Approved). Cleared dues: {dues_cleared}. Added to wallet: {wallet_added}.",
                balance_after=profile.wallet_balance,
                dues_after=profile.total_dues
            )
        elif action == 'REJECT':
            topup_request.status = 'REJECTED'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        topup_request.save()

        return Response({
            'message': f'Top-up request {action.lower()}d successfully',
            'status': topup_request.status,
            'wallet_balance': profile.wallet_balance if action == 'APPROVE' else None
        })

class AdminWalletUpdateView(generics.UpdateAPIView):
    permission_classes = [IsAdminType]
    serializer_class = AdminUserSerializer
    queryset = User.objects.all()

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        profile = user.profile
        
        credit_limit = request.data.get('credit_limit')
        if credit_limit is not None:
            profile.credit_limit = credit_limit
        
        # Admin can also manually adjust balance/dues if needed, 
        # but primarily this is for credit limit.
        # Let's allow manual adjustment for now.
        wallet_balance = request.data.get('wallet_balance')
        if wallet_balance is not None:
            profile.wallet_balance = wallet_balance
            
        total_dues = request.data.get('total_dues')
        if total_dues is not None:
            profile.total_dues = total_dues

        profile.save()
        
        return Response({
            'message': 'Wallet updated successfully',
            'wallet_balance': profile.wallet_balance,
            'credit_limit': profile.credit_limit,
            'total_dues': profile.total_dues
        })

class RefundRequestView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookingSerializer
    queryset = Booking.objects.all()
    lookup_field = 'booking_id'

    def update(self, request, *args, **kwargs):
        booking = self.get_object()
        
        # Verify ownership
        if booking.booked_by != request.user:
            return Response({'error': 'Not authorized'}, status=status.HTTP_403_FORBIDDEN)
            
        if booking.status != 'CONFIRMED':
            return Response({'error': 'Only confirmed bookings can be refunded'}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'REFUND_REQUESTED'
        booking.save()
        
        return Response({'message': 'Refund requested successfully', 'status': booking.status})

class AdminCancelRefundView(generics.GenericAPIView):
    permission_classes = [IsAdminType]
    
    def post(self, request):
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'error': 'Booking ID required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if booking.status != 'REFUND_REQUESTED':
            return Response({'error': 'No active refund request to cancel'}, status=status.HTTP_400_BAD_REQUEST)
            
        booking.status = 'CONFIRMED'
        booking.save()
        
        return Response({'message': 'Refund request cancelled successfully', 'status': booking.status})

class RefundProcessView(generics.GenericAPIView):
    permission_classes = [IsAdminType]
    
    def post(self, request):
        booking_id = request.data.get('booking_id')
        refund_amount = request.data.get('amount')
        
        if not booking_id or not refund_amount:
            return Response({'error': 'Booking ID and amount required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            booking = Booking.objects.get(booking_id=booking_id)
        except Booking.DoesNotExist:
            return Response({'error': 'Booking not found'}, status=status.HTTP_404_NOT_FOUND)
            
        if booking.status == 'REFUNDED':
             return Response({'error': 'Booking already refunded'}, status=status.HTTP_400_BAD_REQUEST)

        # Credit User Wallet
        user = booking.booked_by
        if not user:
             return Response({'error': 'No user associated with this booking'}, status=status.HTTP_400_BAD_REQUEST)
             
        profile = user.profile
        from decimal import Decimal
        try:
            refund_amount = Decimal(str(refund_amount))
        except:
             return Response({'error': 'Invalid amount format'}, status=status.HTTP_400_BAD_REQUEST)
             
        if refund_amount <= 0:
            return Response({'error': 'Refund amount must be positive'}, status=status.HTTP_400_BAD_REQUEST)

        if refund_amount > booking.flight.price:
            return Response({
                'error': f'Refund amount ({refund_amount}) cannot exceed booking cost ({booking.flight.price})'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Logic: Clear dues first
        dues_cleared = Decimal('0.00')
        wallet_added = Decimal('0.00')

        if profile.total_dues > 0:
            if refund_amount >= profile.total_dues:
                dues_cleared = profile.total_dues
                remaining_amount = refund_amount - profile.total_dues
                profile.total_dues = Decimal('0.00')
                profile.wallet_balance += remaining_amount
                wallet_added = remaining_amount
            else:
                dues_cleared = refund_amount
                profile.total_dues -= refund_amount
                wallet_added = Decimal('0.00')
        else:
            profile.wallet_balance += refund_amount
            wallet_added = refund_amount

        profile.save()
        
        # Update Booking Status and Refunded Amount
        booking.refunded_amount = refund_amount
        booking.status = 'REFUNDED'
        booking.save()
        
        # Create Transaction
        WalletTransaction.objects.create(
            user=user,
            amount=refund_amount,
            transaction_type='CREDIT',
            description=f"Refund for booking {booking_id}. Cleared dues: {dues_cleared}. Added to wallet: {wallet_added}.",
            balance_after=profile.wallet_balance,
            dues_after=profile.total_dues
        )
        
        return Response({
            'message': 'Refund processed successfully', 
            'refunded_amount': refund_amount,
            'new_status': booking.status
        })


class AdminContactMessageListView(generics.ListAPIView):
    queryset = ContactMessage.objects.all().order_by('-created_at')
    serializer_class = ContactMessageSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email', 'message']

class SubmitKYCView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer

    def get_object(self):
        return self.request.user.profile

    def update(self, request, *args, **kwargs):
        profile = self.get_object()
        serializer = self.get_serializer(profile, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save(kyc_status='SUBMITTED')
            return Response({
                'message': 'KYC submitted successfully',
                'kyc_status': 'SUBMITTED',
                'details': serializer.data
            })
        
        return Response({'error': 'Invalid KYC data', 'details': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

class AdminKYCListView(generics.ListAPIView):
    queryset = User.objects.filter(profile__kyc_status__in=['SUBMITTED', 'VERIFIED', 'REJECTED']).order_by('-date_joined')
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminType]
    filter_backends = [filters.SearchFilter]
    search_fields = ['username', 'email', 'profile__aadhar_number', 'profile__pan_number']

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        status_param = request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(profile__kyc_status=status_param)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class AdminKYCActionView(generics.GenericAPIView):
    permission_classes = [IsAdminType]

    def post(self, request):
        user_id = request.data.get('user_id')
        action = request.data.get('action') # 'APPROVE' or 'REJECT'
        
        if not user_id or not action:
            return Response({'error': 'User ID and action are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
            profile = user.profile
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'APPROVE':
            profile.kyc_status = 'VERIFIED'
        elif action == 'REJECT':
            profile.kyc_status = 'REJECTED'
        else:
            return Response({'error': 'Invalid action'}, status=status.HTTP_400_BAD_REQUEST)

        profile.save()
        return Response({
            'message': f'KYC {action.lower()}d successfully',
            'kyc_status': profile.kyc_status
        })
