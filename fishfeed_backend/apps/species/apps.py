from django.apps import AppConfig

class SpeciesConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.species"

    def ready(self):
        import apps.species.signals  # noqa
