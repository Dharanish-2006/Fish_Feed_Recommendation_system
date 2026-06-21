"""
Seed the database with sample fish species and feed products for development.
Run: python manage.py shell < scripts/seed_data.py
     OR: python scripts/seed_data.py (after setting DJANGO_SETTINGS_MODULE)
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.species.models import FishSpecies
from apps.users.models import User
from apps.feeds.models import FeedProduct

print("Seeding fish species...")

species_data = [
    {
        'name': 'Nile Tilapia',
        'scientific_name': 'Oreochromis niloticus',
        'habitat': 'Tropical lakes and rivers',
        'water_type': 'freshwater',
        'growth_stage': 'fingerling',
        'min_protein_requirement': 28.0,
        'max_protein_requirement': 36.0,
        'min_fat_requirement': 5.0,
        'max_fat_requirement': 12.0,
        'optimal_temp_min': 25.0,
        'optimal_temp_max': 32.0,
        'optimal_ph_min': 6.5,
        'optimal_ph_max': 8.5,
    },
    {
        'name': 'Atlantic Salmon',
        'scientific_name': 'Salmo salar',
        'habitat': 'Cold ocean and rivers',
        'water_type': 'saltwater',
        'growth_stage': 'juvenile',
        'min_protein_requirement': 38.0,
        'max_protein_requirement': 48.0,
        'min_fat_requirement': 12.0,
        'max_fat_requirement': 22.0,
        'optimal_temp_min': 10.0,
        'optimal_temp_max': 18.0,
        'optimal_ph_min': 6.5,
        'optimal_ph_max': 8.0,
    },
    {
        'name': 'Common Carp',
        'scientific_name': 'Cyprinus carpio',
        'habitat': 'Freshwater ponds and lakes',
        'water_type': 'freshwater',
        'growth_stage': 'adult',
        'min_protein_requirement': 25.0,
        'max_protein_requirement': 33.0,
        'min_fat_requirement': 4.0,
        'max_fat_requirement': 10.0,
        'optimal_temp_min': 20.0,
        'optimal_temp_max': 28.0,
        'optimal_ph_min': 7.0,
        'optimal_ph_max': 8.5,
    },
    {
        'name': 'Pangasius',
        'scientific_name': 'Pangasianodon hypophthalmus',
        'habitat': 'Southeast Asian rivers',
        'water_type': 'freshwater',
        'growth_stage': 'juvenile',
        'min_protein_requirement': 26.0,
        'max_protein_requirement': 34.0,
        'min_fat_requirement': 5.0,
        'max_fat_requirement': 11.0,
        'optimal_temp_min': 26.0,
        'optimal_temp_max': 32.0,
        'optimal_ph_min': 6.5,
        'optimal_ph_max': 8.0,
    },
    {
        'name': 'Milkfish',
        'scientific_name': 'Chanos chanos',
        'habitat': 'Coastal and estuarine waters',
        'water_type': 'brackish',
        'growth_stage': 'juvenile',
        'min_protein_requirement': 28.0,
        'max_protein_requirement': 38.0,
        'min_fat_requirement': 6.0,
        'max_fat_requirement': 14.0,
        'optimal_temp_min': 24.0,
        'optimal_temp_max': 30.0,
        'optimal_ph_min': 7.5,
        'optimal_ph_max': 8.5,
    },
]

for data in species_data:
    species, created = FishSpecies.objects.update_or_create(
        name=data['name'],
        defaults=data
    )
    status = 'Created' if created else 'Updated'
    print(f'  {status}: {species.name}')

print("\nSeeding demo supplier + feeds...")

supplier, _ = User.objects.get_or_create(
    email='supplier@demo.com',
    defaults={
        'full_name': 'AquaFeed Co.',
        'role': 'supplier',
        'is_active': True,
    }
)
supplier.set_password('demo1234')
supplier.save()

feeds_data = [
    {
        'name': 'AquaGrow Pro 32',
        'brand': 'AquaFeed Co.',
        'feed_form': 'pellet',
        'protein_percentage': 32.0,
        'fat_percentage': 8.0,
        'fiber_percentage': 4.0,
        'moisture_percentage': 10.0,
        'ash_percentage': 7.0,
        'price_per_kg': 1.20,
        'stock_quantity_kg': 5000.0,
    },
    {
        'name': 'SalmonMax 42',
        'brand': 'AquaFeed Co.',
        'feed_form': 'extruded',
        'protein_percentage': 42.0,
        'fat_percentage': 18.0,
        'fiber_percentage': 2.0,
        'moisture_percentage': 8.0,
        'ash_percentage': 6.0,
        'price_per_kg': 2.80,
        'stock_quantity_kg': 2000.0,
    },
    {
        'name': 'FryStart Premium',
        'brand': 'AquaFeed Co.',
        'feed_form': 'powder',
        'protein_percentage': 50.0,
        'fat_percentage': 16.0,
        'fiber_percentage': 1.0,
        'moisture_percentage': 7.0,
        'ash_percentage': 8.0,
        'price_per_kg': 3.50,
        'stock_quantity_kg': 500.0,
    },
    {
        'name': 'CarpBasic 28',
        'brand': 'AquaFeed Co.',
        'feed_form': 'pellet',
        'protein_percentage': 28.0,
        'fat_percentage': 6.0,
        'fiber_percentage': 6.0,
        'moisture_percentage': 12.0,
        'ash_percentage': 8.0,
        'price_per_kg': 0.90,
        'stock_quantity_kg': 8000.0,
    },
]

for data in feeds_data:
    feed, created = FeedProduct.objects.update_or_create(
        name=data['name'],
        supplier=supplier,
        defaults=data
    )
    status = 'Created' if created else 'Updated'
    print(f'  {status}: {feed.name}')

print("\nSeeding admin user...")
admin, _ = User.objects.get_or_create(
    email='admin@demo.com',
    defaults={'full_name': 'System Admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
)
admin.set_password('admin1234')
admin.save()
print(f'  Admin: {admin.email}')

print("\nDemo farmer...")
farmer, _ = User.objects.get_or_create(
    email='farmer@demo.com',
    defaults={'full_name': 'Demo Farmer', 'role': 'farmer'}
)
farmer.set_password('demo1234')
farmer.save()
print(f'  Farmer: {farmer.email}')

print("\nSeed complete!")
