from django.urls import path
from .views import (
    FlightListView, BookingCreateView, BookingHistoryView, 
    ContactCreateView, SearchMetaView, RegisterView, UserProfileView,
    AvailableAirlinesView, cleanup_flight_data,
    AdminFlightListCreateView, AdminFlightDetailView, AdminFlightBulkCreateView,
    AdminBookingListView, AdminBookingDetailView, AdminDashboardView,
    AdminUserListView, AdminUserDetailView, LoginView,
    WalletBalanceView, WalletTopUpView, AdminWalletUpdateView,
    UserTopUpRequestListView, AdminTopUpRequestListView, AdminTopUpRequestActionView,
    AdminWalletTransactionListView,
    RefundRequestView, RefundProcessView, AdminCancelRefundView, AdminBookingRejectView,
    AdminContactMessageListView,
    SubmitKYCView, AdminKYCListView, AdminKYCActionView,
    ServeKYCDocumentView, CheckDuplicateBookingView,
    RazorpayOrderView, RazorpayVerifyView,
    FlightRazorpayOrderView, FlightRazorpayVerifyView,
    check_email, reset_password,
    FlyerViewSet, PublicFlyerListView, serve_flyer_image
)
from rest_framework.authtoken.views import obtain_auth_token

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('flights/', FlightListView.as_view(), name='flight-list'),
    path('bookings/', BookingCreateView.as_view(), name='booking-create'),
    path('bookings/check-duplicate/', CheckDuplicateBookingView.as_view(), name='check-duplicate-booking'),
    path('bookings/history/', BookingHistoryView.as_view(), name='booking-history'),
    path('bookings/refund/', RefundRequestView.as_view(), name='refund-request'),
    path('contact/', ContactCreateView.as_view(), name='contact-create'),
    path('search-meta/', SearchMetaView.as_view(), name='search-meta'),
    path('available-airlines/', AvailableAirlinesView.as_view(), name='available-airlines'),
    path('cleanup-flights/', cleanup_flight_data, name='cleanup-flights'),
    
    # Wallet Routes
    path('wallet/balance/', WalletBalanceView.as_view(), name='wallet-balance'),
    path('wallet/top-up/', WalletTopUpView.as_view(), name='wallet-topup'),
    path('wallet/top-up-requests/', UserTopUpRequestListView.as_view(), name='user-topup-requests'),
    path('wallet/razorpay/order/', RazorpayOrderView.as_view(), name='razorpay-order'),
    path('wallet/razorpay/verify/', RazorpayVerifyView.as_view(), name='razorpay-verify'),
    path('bookings/razorpay/order/', FlightRazorpayOrderView.as_view(), name='flight-razorpay-order'),
    path('bookings/razorpay/verify/', FlightRazorpayVerifyView.as_view(), name='flight-razorpay-verify'),

    # Admin Routes
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/flights/', AdminFlightListCreateView.as_view(), name='admin-flight-list'),
    path('admin/flights/bulk/', AdminFlightBulkCreateView.as_view(), name='admin-flight-bulk-create'),
    path('admin/flights/<int:pk>/', AdminFlightDetailView.as_view(), name='admin-flight-detail'),
    path('admin/bookings/', AdminBookingListView.as_view(), name='admin-booking-list'),
    path('admin/bookings/reject/', AdminBookingRejectView.as_view(), name='admin-booking-reject'),
    path('admin/bookings/<str:booking_id>/', AdminBookingDetailView.as_view(), name='admin-booking-detail'),
    path('admin/refund/process/', RefundProcessView.as_view(), name='admin-refund-process'),
    path('admin/refund/cancel/', AdminCancelRefundView.as_view(), name='admin-refund-cancel'),
    path('admin/users/', AdminUserListView.as_view(), name='admin-user-list'),
    path('admin/users/<int:pk>/', AdminUserDetailView.as_view(), name='admin-user-detail'),
    path('admin/users/<int:pk>/wallet/', AdminWalletUpdateView.as_view(), name='admin-user-wallet-update'),
    path('admin/messages/', AdminContactMessageListView.as_view(), name='admin-message-list'),
    path('admin/topups/', AdminTopUpRequestListView.as_view(), name='admin-topup-list'),
    path('admin/topups/action/', AdminTopUpRequestActionView.as_view(), name='admin-topup-action'),
    path('admin/transactions/', AdminWalletTransactionListView.as_view(), name='admin-transaction-list'),
    
    # KYC Routes
    path('kyc/submit/', SubmitKYCView.as_view(), name='kyc-submit'),
    path('admin/kyc/', AdminKYCListView.as_view(), name='admin-kyc-list'),
    path('admin/kyc/action/', AdminKYCActionView.as_view(), name='admin-kyc-action'),
    path('kyc/document/<str:doc_type>/<int:user_id>/', ServeKYCDocumentView.as_view(), name='serve-kyc-doc'),
    path('auth/check-email/', check_email, name='check-email'),
    path('auth/reset-password/', reset_password, name='reset-password'),
    
    # Flyer Routes
    path('flyers/', PublicFlyerListView.as_view(), name='flyer-list'),
    path('flyers/<int:pk>/image/', serve_flyer_image, name='serve-flyer-image'),
    
    # Admin Flyer Routes
    path('admin/flyers/', FlyerViewSet.as_view({'get': 'list', 'post': 'create'}), name='admin-flyer-list'),
    path('admin/flyers/<int:pk>/', FlyerViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='admin-flyer-detail'),
]
