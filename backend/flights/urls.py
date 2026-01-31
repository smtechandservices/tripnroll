from django.urls import path
from .views import (
    FlightListView, BookingCreateView, BookingHistoryView, 
    ContactCreateView, SearchMetaView, RegisterView, UserProfileView,
    AvailableAirlinesView, cleanup_flight_data,
    AdminFlightListCreateView, AdminFlightDetailView, AdminFlightBulkCreateView,
    AdminBookingListView, AdminBookingDetailView, AdminDashboardView,
    AdminUserListView, AdminUserDetailView, LoginView
)
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('flights/', FlightListView.as_view(), name='flight-list'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/history/', BookingHistoryView.as_view(), name='booking-history'),
    path('contact/', ContactCreateView.as_view(), name='contact-create'),
    path('search-meta/', SearchMetaView.as_view(), name='search-meta'),
    path('available-airlines/', AvailableAirlinesView.as_view(), name='available-airlines'),
    path('cleanup-flights/', cleanup_flight_data, name='cleanup-flights'),
    
    # Admin Routes
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/flights/', AdminFlightListCreateView.as_view(), name='admin-flight-list'),
    path('admin/flights/bulk/', AdminFlightBulkCreateView.as_view(), name='admin-flight-bulk-create'),
    path('admin/flights/<int:pk>/', AdminFlightDetailView.as_view(), name='admin-flight-detail'),
    path('admin/bookings/', AdminBookingListView.as_view(), name='admin-booking-list'),
    path('admin/bookings/<str:booking_id>/', AdminBookingDetailView.as_view(), name='admin-booking-detail'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
]
