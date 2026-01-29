from django.contrib import admin
from .models import Flight, Booking, ContactMessage, UserProfile

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
    readonly_fields = ('booking_id', 'created_at')
    
    fieldsets = (
        ('Booking Information', {
            'fields': ('booking_id', 'flight', 'status', 'created_at')
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
    list_display = ('user', 'phone_number', 'passport_number')
    search_fields = ('user__username', 'user__email', 'phone_number', 'passport_number')
    ordering = ('user__username',)
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Contact Information', {
            'fields': ('phone_number', 'address')
        }),
        ('Travel Documents', {
            'fields': ('passport_number',)
        }),
    )
