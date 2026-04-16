from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from .models import Flight, Booking, ContactMessage, UserProfile, WalletTransaction, UserKYC

@admin.register(Flight)
class FlightAdmin(admin.ModelAdmin):
    list_display = ('flight_number', 'airline', 'origin', 'destination', 'departure_time', 'price', 'stops')
    list_filter = ('airline', 'origin', 'destination', 'stops')
    search_fields = ('flight_number', 'airline', 'origin', 'destination')
    ordering = ('-departure_time',)
    date_hierarchy = 'departure_time'
    
    fieldsets = (
        ('Flight Information', {
            'fields': ('airline', 'flight_number')
        }),
        ('Route Details', {
            'fields': ('origin', 'destination', 'stops')
        }),
        ('Schedule', {
            'fields': ('departure_time', 'arrival_time', 'duration')
        }),
        ('Pricing', {
            'fields': ('price',)
        }),
    )

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('booking_id', 'get_passenger_name', 'passenger_email', 'get_flight_info', 'travel_date', 'status', 'created_at')
    list_filter = ('status', 'travel_date', 'created_at')
    search_fields = ('booking_id', 'first_name', 'last_name', 'passenger_email', 'passenger_phone')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    readonly_fields = ('booking_id', 'created_at', 'payment_mode')
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('booking_id', 'flight', 'status', 'created_at')
        }),
        ('Payment & Group Info', {
            'fields': ('payment_mode', 'booking_group', 'pnr')
        }),
        ('Passenger Details', {
            'fields': ('first_name', 'last_name', 'passenger_email', 'passenger_phone', 'date_of_birth')
        }),
        ('Passport Information', {
            'fields': ('passport_number', 'passport_issue_date', 'passport_expiry_date'),
            'classes': ('collapse',)
        }),
        ('Additional Information', {
            'fields': ('frequent_flyer_number', 'travel_date'),
            'classes': ('collapse',)
        }),
    )
    
    def get_passenger_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    get_passenger_name.short_description = 'Passenger Name'
    get_passenger_name.admin_order_field = 'first_name'
    
    def get_flight_info(self, obj):
        return f"{obj.flight.airline} {obj.flight.flight_number} ({obj.flight.origin} → {obj.flight.destination})"
    get_flight_info.short_description = 'Flight'

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'created_at', 'message_preview')
    list_filter = ('created_at',)
    search_fields = ('name', 'email', 'message')
    ordering = ('-created_at',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)
    
    def message_preview(self, obj):
        return obj.message[:50] + '...' if len(obj.message) > 50 else obj.message
    message_preview.short_description = 'Message Preview'

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'usertype', 'wallet_balance', 'credit_limit', 'total_dues')
    list_filter = ('usertype',)
    search_fields = ('user__username', 'user__email', 'phone_number', 'passport_number')
    ordering = ('user__username',)
    
    fieldsets = (
        ('User', {
            'fields': ('user', 'usertype')
        }),
        ('Wallet and Financials', {
            'fields': ('wallet_balance', 'credit_limit', 'total_dues')
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'address')
        }),
        ('Travel Documents', {
            'fields': ('passport_number',)
        }),
    )

@admin.register(UserKYC)
class UserKYCAdmin(admin.ModelAdmin):
    list_display = ('user', 'kyc_status', 'aadhar_number', 'pan_number', 'updated_at')
    list_filter = ('kyc_status', 'updated_at')
    search_fields = ('user__username', 'user__email', 'aadhar_number', 'pan_number')
    readonly_fields = ('brand_logo_preview', 'aadhar_doc_preview', 'pan_doc_preview', 'created_at', 'updated_at')
    
    fieldsets = (
        ('User Reflection', {
            'fields': ('user', 'kyc_status')
        }),
        ('KYC Data', {
            'fields': ('aadhar_number', 'pan_number', 'gst_number')
        }),
        ('Document Previews', {
            'fields': ('brand_logo_preview', 'aadhar_doc_preview', 'pan_doc_preview')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def _get_doc_link(self, obj, doc_type, label):
        has_data = False
        if doc_type == 'brand_logo' and obj.brand_logo_data:
            has_data = True
        elif doc_type == 'aadhar' and obj.aadhar_card_doc_data:
            has_data = True
        elif doc_type == 'pan' and obj.pan_card_doc_data:
            has_data = True

        if has_data:
            url = reverse('serve-kyc-doc', kwargs={'doc_type': doc_type, 'user_id': obj.user.id})
            return format_html('<a href="{}" target="_blank">View {}</a>', url, label)
        return "Not Uploaded"

    def brand_logo_preview(self, obj):
        return self._get_doc_link(obj, 'brand_logo', 'Logo')
    brand_logo_preview.short_description = 'Brand Logo'

    def aadhar_doc_preview(self, obj):
        return self._get_doc_link(obj, 'aadhar', 'Aadhar Card')
    aadhar_doc_preview.short_description = 'Aadhar Card'

    def pan_doc_preview(self, obj):
        return self._get_doc_link(obj, 'pan', 'PAN Card')
    pan_doc_preview.short_description = 'PAN Card'

@admin.register(WalletTransaction)
class WalletTransactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'transaction_type', 'amount', 'balance_after', 'timestamp')
    list_filter = ('transaction_type', 'timestamp')
    search_fields = ('user__username', 'user__email', 'description')
    ordering = ('-timestamp',)
    date_hierarchy = 'timestamp'
    readonly_fields = ('timestamp',)
