from django.urls import path
from .views import (
    FlightListView, BookingCreateView, BookingHistoryView, 
    ContactCreateView, SearchMetaView, RegisterView, UserProfileView,
    AvailableAirlinesView, cleanup_flight_data
)
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('login/', obtain_auth_token, name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('flights/', FlightListView.as_view(), name='flight-list'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/history/', BookingHistoryView.as_view(), name='booking-history'),
    path('contact/', ContactCreateView.as_view(), name='contact-create'),
    path('search-meta/', SearchMetaView.as_view(), name='search-meta'),
    path('available-airlines/', AvailableAirlinesView.as_view(), name='available-airlines'),
    path('cleanup-flights/', cleanup_flight_data, name='cleanup-flights'),
]
