"""
Integration tests for all REST API endpoints.
Run: python manage.py test tests.test_api
"""
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.species.models import FishSpecies
from apps.feeds.models import FeedProduct
from apps.farms.models import Farm, FishStock
from apps.recommendations.models import Recommendation
import datetime


def make_farmer(**kwargs):
    defaults = dict(email='farmer@test.com', full_name='Test Farmer', role=User.FARMER)
    defaults.update(kwargs)
    u = User.objects.create_user(password='testpass123', **defaults)
    return u


def make_supplier(**kwargs):
    defaults = dict(email='supplier@test.com', full_name='Test Supplier', role=User.SUPPLIER)
    defaults.update(kwargs)
    u = User.objects.create_user(password='testpass123', **defaults)
    return u


def make_admin(**kwargs):
    defaults = dict(email='admin@test.com', full_name='Admin', role=User.ADMIN,
                    is_staff=True, is_superuser=True)
    defaults.update(kwargs)
    u = User.objects.create_user(password='testpass123', **defaults)
    return u


def make_species(**kwargs):
    defaults = dict(
        name='Tilapia', scientific_name='O. niloticus',
        habitat='Rivers', water_type='freshwater', growth_stage='fingerling',
        min_protein_requirement=28.0, max_protein_requirement=36.0,
        min_fat_requirement=5.0, max_fat_requirement=12.0,
    )
    defaults.update(kwargs)
    return FishSpecies.objects.create(**defaults)


def make_feed(supplier, species=None, **kwargs):
    defaults = dict(
        supplier=supplier, name='Test Feed', brand='TestBrand',
        feed_form='pellet', protein_percentage=32.0, fat_percentage=8.0,
        price_per_kg='1.20', stock_quantity_kg=500.0,
    )
    defaults.update(kwargs)
    feed = FeedProduct.objects.create(**defaults)
    if species:
        feed.suitable_species.add(species)
    return feed


def make_farm(farmer, **kwargs):
    defaults = dict(name='Test Farm', farmer=farmer, location='Test Location')
    defaults.update(kwargs)
    return Farm.objects.create(**defaults)


def make_stock(farm, species, **kwargs):
    defaults = dict(
        farm=farm, species=species, quantity=100,
        average_weight_grams=15.0, growth_stage='fingerling',
        water_type='freshwater', water_temperature=28.0,
        water_ph=7.5, dissolved_oxygen=6.0, water_condition='good',
        stocking_date=datetime.date.today(),
    )
    defaults.update(kwargs)
    return FishStock.objects.create(**defaults)


# ── Auth Tests ────────────────────────────────────────────────────────────────

class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_farmer(self):
        res = self.client.post(reverse('register'), {
            'email': 'new@test.com', 'full_name': 'New User',
            'role': 'farmer', 'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', res.data)
        self.assertEqual(res.data['user']['role'], 'farmer')

    def test_register_supplier(self):
        res = self.client.post(reverse('register'), {
            'email': 'sup@test.com', 'full_name': 'Supplier',
            'role': 'supplier', 'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_cannot_self_register_as_admin(self):
        res = self.client.post(reverse('register'), {
            'email': 'a@test.com', 'full_name': 'Admin',
            'role': 'admin', 'password': 'StrongPass123!',
            'password_confirm': 'StrongPass123!',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_password_mismatch(self):
        res = self.client.post(reverse('register'), {
            'email': 'x@test.com', 'full_name': 'X',
            'role': 'farmer', 'password': 'abc', 'password_confirm': 'xyz',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_returns_tokens(self):
        make_farmer(email='login@test.com')
        res = self.client.post(reverse('login'), {
            'email': 'login@test.com', 'password': 'testpass123'
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)
        self.assertIn('user', res.data)

    def test_login_wrong_password(self):
        make_farmer(email='bad@test.com')
        res = self.client.post(reverse('login'), {
            'email': 'bad@test.com', 'password': 'wrongpass'
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_requires_auth(self):
        res = self.client.get(reverse('profile'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_profile_returns_user_data(self):
        farmer = make_farmer()
        self.client.force_authenticate(user=farmer)
        res = self.client.get(reverse('profile'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['email'], farmer.email)

    def test_change_password(self):
        farmer = make_farmer()
        self.client.force_authenticate(user=farmer)
        res = self.client.post(reverse('change-password'), {
            'old_password': 'testpass123',
            'new_password': 'NewStrongPass456!',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        farmer.refresh_from_db()
        self.assertTrue(farmer.check_password('NewStrongPass456!'))

    def test_change_password_wrong_old(self):
        farmer = make_farmer()
        self.client.force_authenticate(user=farmer)
        res = self.client.post(reverse('change-password'), {
            'old_password': 'wrongold', 'new_password': 'NewStrongPass456!'
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_can_list_users(self):
        admin = make_admin()
        make_farmer(email='f1@test.com')
        make_supplier(email='s1@test.com')
        self.client.force_authenticate(user=admin)
        res = self.client.get(reverse('user-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 3)

    def test_farmer_cannot_list_users(self):
        farmer = make_farmer()
        self.client.force_authenticate(user=farmer)
        res = self.client.get(reverse('user-list'))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Species Tests ─────────────────────────────────────────────────────────────

class SpeciesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        self.admin = make_admin()
        self.species = make_species()

    def test_list_species_authenticated(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('species-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(res.data['count'], 1)

    def test_list_species_unauthenticated(self):
        res = self.client.get(reverse('species-list'))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_species_detail(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('species-detail', kwargs={'pk': self.species.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['name'], 'Tilapia')
        self.assertIn('nutritional_requirements', res.data)

    def test_admin_can_create_species(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post(reverse('species-admin-create'), {
            'name': 'Salmon', 'scientific_name': 'S. salar',
            'habitat': 'Ocean', 'water_type': 'saltwater', 'growth_stage': 'adult',
            'min_protein_requirement': 38.0, 'max_protein_requirement': 48.0,
            'min_fat_requirement': 12.0, 'max_fat_requirement': 22.0,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(FishSpecies.objects.filter(name='Salmon').exists())

    def test_farmer_cannot_create_species(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('species-admin-create'), {
            'name': 'FakeSpecies', 'water_type': 'freshwater',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_filter_by_water_type(self):
        make_species(name='Saltwater Fish', water_type='saltwater')
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('species-list') + '?water_type=saltwater')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for s in res.data['results']:
            self.assertEqual(s['water_type'], 'saltwater')


# ── Feed Tests ────────────────────────────────────────────────────────────────

class FeedTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        self.supplier = make_supplier()
        self.other_supplier = make_supplier(email='other@test.com')
        self.species = make_species()
        self.feed = make_feed(self.supplier, self.species)

    def test_list_feeds_public(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('feed-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_supplier_create_feed(self):
        self.client.force_authenticate(user=self.supplier)
        res = self.client.post(reverse('supplier-feed-list'), {
            'name': 'New Feed', 'brand': 'Brand X',
            'feed_form': 'pellet', 'protein_percentage': 35.0,
            'fat_percentage': 9.0, 'price_per_kg': '1.50',
            'stock_quantity_kg': 1000.0,
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FeedProduct.objects.filter(supplier=self.supplier).count(), 2)

    def test_farmer_cannot_create_feed(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('supplier-feed-list'), {
            'name': 'Illegal Feed', 'protein_percentage': 30.0,
            'fat_percentage': 8.0, 'price_per_kg': '1.00',
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_supplier_sees_own_feeds_only(self):
        make_feed(self.other_supplier, name='Other Feed')
        self.client.force_authenticate(user=self.supplier)
        res = self.client.get(reverse('supplier-feed-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for f in res.data['results']:
            self.assertEqual(f['supplier_name'], self.supplier.full_name)

    def test_update_inventory_add_stock(self):
        self.client.force_authenticate(user=self.supplier)
        initial_stock = self.feed.stock_quantity_kg
        res = self.client.post(
            reverse('update-inventory', kwargs={'pk': self.feed.pk}),
            {'action': 'add', 'quantity_kg': 200.0}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.feed.refresh_from_db()
        self.assertAlmostEqual(self.feed.stock_quantity_kg, initial_stock + 200.0)

    def test_update_inventory_sell_stock(self):
        self.client.force_authenticate(user=self.supplier)
        res = self.client.post(
            reverse('update-inventory', kwargs={'pk': self.feed.pk}),
            {'action': 'sell', 'quantity_kg': 100.0}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_update_inventory_oversell_fails(self):
        self.client.force_authenticate(user=self.supplier)
        res = self.client.post(
            reverse('update-inventory', kwargs={'pk': self.feed.pk}),
            {'action': 'sell', 'quantity_kg': 99999.0}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nutritional_validation(self):
        """Sum of nutrition components > 100% should fail"""
        self.client.force_authenticate(user=self.supplier)
        res = self.client.post(reverse('supplier-feed-list'), {
            'name': 'Bad Feed', 'brand': 'X',
            'feed_form': 'pellet', 'protein_percentage': 60.0,
            'fat_percentage': 30.0, 'fiber_percentage': 25.0,
            'moisture_percentage': 20.0, 'price_per_kg': '1.00',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


# ── Farm Tests ────────────────────────────────────────────────────────────────

class FarmTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        self.other_farmer = make_farmer(email='other@test.com')
        self.species = make_species()
        self.farm = make_farm(self.farmer)

    def test_farmer_can_list_own_farms(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('farm-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_farmer_cannot_see_others_farms(self):
        make_farm(self.other_farmer, name="Other Farm")
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('farm-list'))
        self.assertEqual(res.data['count'], 1)

    def test_create_farm(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('farm-list'), {
            'name': 'New Farm', 'location': 'Location A',
            'total_area_hectares': 5.0
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Farm.objects.filter(farmer=self.farmer).count(), 2)

    def test_create_fish_stock(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(
            reverse('stock-list', kwargs={'farm_pk': self.farm.pk}),
            {
                'species': self.species.pk, 'quantity': 200,
                'average_weight_grams': 10.0, 'growth_stage': 'fingerling',
                'water_type': 'freshwater', 'water_temperature': 28.0,
                'water_ph': 7.5, 'dissolved_oxygen': 6.0,
                'water_condition': 'good',
                'stocking_date': str(datetime.date.today()),
            }
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(FishStock.objects.filter(farm=self.farm).count(), 1)

    def test_list_fish_stocks(self):
        make_stock(self.farm, self.species)
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('stock-list', kwargs={'farm_pk': self.farm.pk}))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)


# ── Recommendation Tests ──────────────────────────────────────────────────────

class RecommendationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        self.supplier = make_supplier()
        self.species = make_species()
        self.farm = make_farm(self.farmer)
        self.stock = make_stock(self.farm, self.species)
        # Create available feeds so the engine has something to score
        for i in range(3):
            make_feed(
                self.supplier,
                name=f'Feed {i}',
                protein_percentage=28.0 + i * 2,
                stock_quantity_kg=500.0,
            )

    def test_generate_recommendation(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('generate-recommendation'), {
            'fish_stock_id': self.stock.pk
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['status'], 'completed')
        self.assertIn('results', res.data)
        self.assertGreater(len(res.data['results']), 0)

    def test_recommendation_results_have_scores(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('generate-recommendation'), {
            'fish_stock_id': self.stock.pk
        })
        for result in res.data['results']:
            self.assertIn('match_percentage', result)
            self.assertIn('nutritional_score', result)
            self.assertIn('explanation', result)
            self.assertBetween(result['match_percentage'], 0, 100)

    def assertBetween(self, value, lo, hi):
        self.assertGreaterEqual(value, lo)
        self.assertLessEqual(value, hi)

    def test_recommendation_list(self):
        # Generate one first
        self.client.force_authenticate(user=self.farmer)
        self.client.post(reverse('generate-recommendation'), {'fish_stock_id': self.stock.pk})
        res = self.client.get(reverse('recommendation-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_farmer_cannot_see_others_recommendations(self):
        other_farmer = make_farmer(email='other2@test.com')
        other_farm = make_farm(other_farmer, name='Other Farm')
        other_stock = make_stock(other_farm, self.species)
        # Generate rec for other farmer
        from apps.recommendations.service import generate_recommendation
        generate_recommendation(other_stock.pk, other_farmer)

        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('recommendation-list'))
        self.assertEqual(res.data['count'], 0)

    def test_latest_recommendation_for_stock(self):
        self.client.force_authenticate(user=self.farmer)
        self.client.post(reverse('generate-recommendation'), {'fish_stock_id': self.stock.pk})
        res = self.client.get(
            reverse('latest-recommendation', kwargs={'stock_pk': self.stock.pk})
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('best_feed', res.data)

    def test_generate_for_wrong_stock_fails(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('generate-recommendation'), {
            'fish_stock_id': 99999
        })
        self.assertIn(res.status_code, [status.HTTP_404_NOT_FOUND, status.HTTP_500_INTERNAL_SERVER_ERROR])


# ── Analytics Tests ───────────────────────────────────────────────────────────

class AnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        self.admin = make_admin()
        self.supplier = make_supplier()

    def test_admin_dashboard(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get(reverse('admin-dashboard'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('totals', res.data)
        self.assertIn('recommendations', res.data)
        self.assertIn('last_30_days', res.data)

    def test_farmer_dashboard(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('farmer-dashboard'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('farms_count', res.data)
        self.assertIn('recent_recommendations', res.data)

    def test_supplier_dashboard(self):
        self.client.force_authenticate(user=self.supplier)
        res = self.client.get(reverse('supplier-dashboard'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('total_products', res.data)

    def test_farmer_cannot_access_admin_dashboard(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('admin-dashboard'))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)


# ── Notification Tests ────────────────────────────────────────────────────────

class NotificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.farmer = make_farmer()
        from apps.notifications.models import Notification
        Notification.objects.create(
            user=self.farmer,
            notification_type='recommendation_ready',
            title='Test Notif',
            message='Your recommendation is ready.'
        )

    def test_list_notifications(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('notification-list'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['count'], 1)

    def test_unread_count(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.get(reverse('unread-count'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['unread_count'], 1)

    def test_mark_all_read(self):
        self.client.force_authenticate(user=self.farmer)
        res = self.client.post(reverse('mark-all-read'))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        count_res = self.client.get(reverse('unread-count'))
        self.assertEqual(count_res.data['unread_count'], 0)
