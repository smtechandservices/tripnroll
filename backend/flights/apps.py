from django.apps import AppConfig
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.utils.translation import gettext_lazy as _

class UnicodeUsernameWithSpaceValidator(UnicodeUsernameValidator):
    regex = r'^[\w .@+-]+\Z'
    message = _(
        'Enter a valid username. This value may contain only letters, '
        'numbers, spaces, and @/./+/-/_ characters.'
    )

class FlightsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'flights'

    def ready(self):
        from django.contrib.auth.models import User
        # Replacing the default validator for the username field to allow spaces
        username_field = User._meta.get_field('username')
        for i, validator in enumerate(username_field.validators):
            if isinstance(validator, UnicodeUsernameValidator):
                username_field.validators[i] = UnicodeUsernameWithSpaceValidator()
