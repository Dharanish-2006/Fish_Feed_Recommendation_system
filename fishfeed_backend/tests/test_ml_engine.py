"""
Tests for ml/engine.py — pure Python, no database required.
Run: pytest tests/test_ml_engine.py -v
"""
import sys
import os
import pytest
import numpy as np

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# ── import the engine without Django ────────────────────────────────────────
from ml.engine import (
    FeedLDAClassifier,
    build_fish_feature_vector,
    nutritional_compatibility_score,
    recommend_feeds,
    _group_protein_score,
    _build_explanation,
    GROWTH_STAGE_MAP,
    WATER_TYPE_MAP,
)


# ── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def trained_lda():
    clf = FeedLDAClassifier()
    clf.train()
    return clf


@pytest.fixture
def tilapia_fingerling():
    return {
        'growth_stage': 'fingerling',
        'water_type': 'freshwater',
        'water_temperature': 28.0,
        'water_ph': 7.5,
        'dissolved_oxygen': 6.0,
        'water_condition': 'good',
        'average_weight_grams': 15.0,
        'min_protein_req': 28.0,
        'max_protein_req': 36.0,
        'min_fat_req': 5.0,
        'max_fat_req': 12.0,
        'nutritional_requirements': {
            'protein': {'min': 28, 'max': 36},
            'fat':     {'min': 5,  'max': 12},
            'fiber':   {'min': 0,  'max': 6},
            'moisture':{'min': 0,  'max': 12},
        },
    }


@pytest.fixture
def salmon_juvenile():
    return {
        'growth_stage': 'juvenile',
        'water_type': 'saltwater',
        'water_temperature': 14.0,
        'water_ph': 7.2,
        'dissolved_oxygen': 8.0,
        'water_condition': 'good',
        'average_weight_grams': 200.0,
        'min_protein_req': 38.0,
        'max_protein_req': 48.0,
        'min_fat_req': 12.0,
        'max_fat_req': 22.0,
        'nutritional_requirements': {
            'protein': {'min': 38, 'max': 48},
            'fat':     {'min': 12, 'max': 22},
            'fiber':   {'min': 0,  'max': 3},
            'moisture':{'min': 0,  'max': 10},
        },
    }


@pytest.fixture
def sample_feeds():
    return [
        {
            'id': 1, 'name': 'AquaGrow Pro 32', 'brand': 'AquaFeed',
            'supplier_name': 'AquaFeed Co.', 'price_per_kg': 1.20,
            'currency': 'USD', 'is_available': True, 'stock_quantity_kg': 5000,
            'composition': {'protein': 32, 'fat': 8, 'fiber': 4, 'moisture': 10},
        },
        {
            'id': 2, 'name': 'SalmonMax 42', 'brand': 'AquaFeed',
            'supplier_name': 'AquaFeed Co.', 'price_per_kg': 2.80,
            'currency': 'USD', 'is_available': True, 'stock_quantity_kg': 2000,
            'composition': {'protein': 42, 'fat': 18, 'fiber': 2, 'moisture': 8},
        },
        {
            'id': 3, 'name': 'FryStart Premium', 'brand': 'AquaFeed',
            'supplier_name': 'AquaFeed Co.', 'price_per_kg': 3.50,
            'currency': 'USD', 'is_available': True, 'stock_quantity_kg': 500,
            'composition': {'protein': 50, 'fat': 16, 'fiber': 1, 'moisture': 7},
        },
        {
            'id': 4, 'name': 'CarpBasic 28', 'brand': 'AquaFeed',
            'supplier_name': 'AquaFeed Co.', 'price_per_kg': 0.90,
            'currency': 'USD', 'is_available': True, 'stock_quantity_kg': 8000,
            'composition': {'protein': 28, 'fat': 6, 'fiber': 6, 'moisture': 12},
        },
        {
            'id': 5, 'name': 'Out-of-Stock Feed', 'brand': 'None',
            'supplier_name': 'No One', 'price_per_kg': 0.50,
            'currency': 'USD', 'is_available': False, 'stock_quantity_kg': 0,
            'composition': {'protein': 30, 'fat': 7, 'fiber': 5, 'moisture': 10},
        },
    ]


# ── Feature Vector Tests ──────────────────────────────────────────────────────

class TestBuildFeatureVector:
    def test_returns_numpy_array(self, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        assert isinstance(fv, np.ndarray)

    def test_shape_is_1x11(self, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        assert fv.shape == (1, 11)

    def test_growth_stage_encoded(self, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        assert fv[0][0] == GROWTH_STAGE_MAP['fingerling']

    def test_water_type_encoded(self, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        assert fv[0][1] == WATER_TYPE_MAP['freshwater']

    def test_missing_optional_fields_use_defaults(self):
        minimal = {
            'growth_stage': 'adult',
            'water_type': 'freshwater',
            # No temperature, ph, do — should use defaults
        }
        fv = build_fish_feature_vector(minimal)
        assert fv[0][2] == 25.0   # default temp
        assert fv[0][3] == 7.0    # default pH
        assert fv[0][4] == 6.0    # default DO

    def test_saltwater_encoded_differently_from_freshwater(self, tilapia_fingerling, salmon_juvenile):
        fv_fresh = build_fish_feature_vector(tilapia_fingerling)
        fv_salt = build_fish_feature_vector(salmon_juvenile)
        assert fv_fresh[0][1] != fv_salt[0][1]


# ── Nutritional Scoring Tests ─────────────────────────────────────────────────

class TestNutritionalCompatibilityScore:
    def test_perfect_match_scores_near_1(self):
        """Feed whose values sit right at species midpoint → ~1.0"""
        composition = {'protein': 32, 'fat': 8.5, 'fiber': 3, 'moisture': 6}
        requirements = {
            'protein': {'min': 28, 'max': 36},
            'fat':     {'min': 5,  'max': 12},
            'fiber':   {'min': 0,  'max': 6},
            'moisture':{'min': 0,  'max': 12},
        }
        score = nutritional_compatibility_score(composition, requirements)
        assert score >= 0.85, f"Expected near-perfect score, got {score}"

    def test_out_of_range_low_scores_badly(self):
        composition = {'protein': 10, 'fat': 1, 'fiber': 0, 'moisture': 0}
        requirements = {
            'protein': {'min': 38, 'max': 48},
            'fat':     {'min': 12, 'max': 22},
            'fiber':   {'min': 0,  'max': 5},
            'moisture':{'min': 0,  'max': 10},
        }
        score = nutritional_compatibility_score(composition, requirements)
        assert score < 0.5, f"Expected low score, got {score}"

    def test_score_between_0_and_1(self):
        for protein in [0, 10, 25, 35, 50, 80]:
            comp = {'protein': protein, 'fat': 8, 'fiber': 3, 'moisture': 8}
            req = {'protein': {'min': 28, 'max': 36}, 'fat': {'min': 5, 'max': 12},
                   'fiber': {'min': 0, 'max': 6}, 'moisture': {'min': 0, 'max': 12}}
            score = nutritional_compatibility_score(comp, req)
            assert 0.0 <= score <= 1.0, f"Score {score} out of range for protein={protein}"

    def test_within_range_beats_out_of_range(self):
        req = {'protein': {'min': 28, 'max': 36}, 'fat': {'min': 5, 'max': 12},
               'fiber': {'min': 0, 'max': 6}, 'moisture': {'min': 0, 'max': 12}}
        good = nutritional_compatibility_score(
            {'protein': 32, 'fat': 9, 'fiber': 3, 'moisture': 8}, req
        )
        bad = nutritional_compatibility_score(
            {'protein': 55, 'fat': 25, 'fiber': 12, 'moisture': 20}, req
        )
        assert good > bad

    def test_empty_requirements_doesnt_crash(self):
        score = nutritional_compatibility_score({'protein': 30}, {})
        assert 0.0 <= score <= 1.0


# ── LDA Classifier Tests ──────────────────────────────────────────────────────

class TestFeedLDAClassifier:
    def test_train_sets_is_trained(self):
        clf = FeedLDAClassifier()
        assert not clf.is_trained
        clf.train()
        assert clf.is_trained

    def test_predict_before_train_raises(self):
        clf = FeedLDAClassifier()
        fv = np.zeros((1, 11))
        with pytest.raises(RuntimeError, match='not trained'):
            clf.predict_feed_group(fv)

    def test_predict_returns_valid_group(self, trained_lda, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        group, proba = trained_lda.predict_feed_group(fv)
        valid_groups = {
            'fry_starter', 'carnivore_grow', 'carnivore_adult',
            'omnivore_grow', 'omnivore_adult', 'herbivore_grow',
            'herbivore_adult', 'brackish_grow', 'brackish_adult',
        }
        assert group in valid_groups, f"Unknown group: {group}"

    def test_probabilities_sum_to_1(self, trained_lda, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        _, proba = trained_lda.predict_feed_group(fv)
        total = sum(proba.values())
        assert abs(total - 1.0) < 1e-4, f"Probabilities sum to {total}"

    def test_tilapia_predicts_omnivore_group(self, trained_lda, tilapia_fingerling):
        fv = build_fish_feature_vector(tilapia_fingerling)
        group, _ = trained_lda.predict_feed_group(fv)
        assert 'omnivore' in group or 'herbivore' in group, \
            f"Tilapia should be omnivore/herbivore, got {group}"

    def test_salmon_predicts_carnivore_group(self, trained_lda, salmon_juvenile):
        fv = build_fish_feature_vector(salmon_juvenile)
        group, _ = trained_lda.predict_feed_group(fv)
        assert 'carnivore' in group, f"Salmon should be carnivore, got {group}"

    def test_fry_predicts_fry_starter(self, trained_lda):
        fry_data = {
            'growth_stage': 'fry', 'water_type': 'freshwater',
            'water_temperature': 28, 'water_ph': 7.5, 'dissolved_oxygen': 7,
            'water_condition': 'good', 'average_weight_grams': 0.5,
            'min_protein_req': 45, 'max_protein_req': 55,
            'min_fat_req': 12, 'max_fat_req': 20,
        }
        fv = build_fish_feature_vector(fry_data)
        group, _ = trained_lda.predict_feed_group(fv)
        assert 'fry' in group, f"Fry should map to fry_starter, got {group}"

    def test_save_and_load(self, trained_lda, tmp_path, monkeypatch):
        import ml.engine as engine_module
        monkeypatch.setattr(engine_module, 'LDA_MODEL_PATH', tmp_path / 'lda.pkl')
        monkeypatch.setattr(engine_module, 'SCALER_PATH', tmp_path / 'scaler.pkl')
        monkeypatch.setattr(engine_module, 'LABEL_ENCODER_PATH', tmp_path / 'le.pkl')

        trained_lda.save()

        loaded = FeedLDAClassifier()
        loaded.load()
        assert loaded.is_trained

        fv = np.zeros((1, 11))
        group1, _ = trained_lda.predict_feed_group(fv)
        group2, _ = loaded.predict_feed_group(fv)
        assert group1 == group2


# ── Group Protein Score Tests ─────────────────────────────────────────────────

class TestGroupProteinScore:
    def test_perfect_midpoint_scores_near_1(self):
        # carnivore_grow band is 38-46, midpoint = 42
        score = _group_protein_score('carnivore_grow', 42)
        assert score >= 0.85, f"Midpoint should score highly, got {score}"

    def test_outside_band_scores_lower(self):
        in_band = _group_protein_score('omnivore_grow', 33)
        out_band = _group_protein_score('omnivore_grow', 60)
        assert in_band > out_band

    def test_score_always_0_to_1(self):
        for protein in [0, 10, 25, 32, 45, 55, 80]:
            s = _group_protein_score('omnivore_adult', protein)
            assert 0.0 <= s <= 1.0

    def test_unknown_group_uses_default_band(self):
        score = _group_protein_score('unknown_group', 30)
        assert 0.0 <= score <= 1.0


# ── End-to-End Recommendation Tests ──────────────────────────────────────────

class TestRecommendFeeds:
    def test_returns_list(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        assert isinstance(results, list)

    def test_empty_feeds_returns_empty(self, tilapia_fingerling):
        assert recommend_feeds(tilapia_fingerling, []) == []

    def test_respects_top_n(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds, top_n=2)
        assert len(results) <= 2

    def test_results_sorted_descending_by_match(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        scores = [r['match_percentage'] for r in results]
        assert scores == sorted(scores, reverse=True)

    def test_result_has_required_fields(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds, top_n=1)
        assert len(results) == 1
        r = results[0]
        for key in ['feed_id', 'feed_name', 'match_percentage', 'nutritional_score',
                    'group_score', 'explanation', 'predicted_feed_group']:
            assert key in r, f"Missing key: {key}"

    def test_match_percentage_between_0_and_100(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        for r in results:
            assert 0 <= r['match_percentage'] <= 100

    def test_best_feed_for_tilapia_not_salmon_feed(self, tilapia_fingerling, sample_feeds):
        """AquaGrow Pro 32 (32% protein) should rank above SalmonMax 42 (42%) for tilapia"""
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        ranked_names = [r['feed_name'] for r in results]
        aquagrow_rank = ranked_names.index('AquaGrow Pro 32')
        salmonmax_rank = ranked_names.index('SalmonMax 42')
        assert aquagrow_rank < salmonmax_rank, \
            f"AquaGrow (rank {aquagrow_rank}) should beat SalmonMax (rank {salmonmax_rank}) for tilapia"

    def test_best_feed_for_salmon_is_high_protein(self, salmon_juvenile, sample_feeds):
        """SalmonMax 42 (42% protein) should rank highest for salmon"""
        results = recommend_feeds(salmon_juvenile, sample_feeds)
        best = results[0]['feed_name']
        assert best == 'SalmonMax 42', f"Expected SalmonMax 42 for salmon, got {best}"

    def test_explanation_text_not_empty(self, tilapia_fingerling, sample_feeds):
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        for r in results:
            assert len(r['explanation']) > 10

    def test_unavailable_feed_ranks_lower(self, tilapia_fingerling, sample_feeds):
        """Feed with is_available=False should score lower due to no availability bonus"""
        results = recommend_feeds(tilapia_fingerling, sample_feeds)
        unavailable = next((r for r in results if r['feed_name'] == 'Out-of-Stock Feed'), None)
        available_scores = [r['match_percentage'] for r in results if r['feed_name'] != 'Out-of-Stock Feed']
        if unavailable and available_scores:
            # At least some available feeds should beat it if nutritionally comparable
            max_available = max(available_scores)
            assert unavailable['match_percentage'] <= max_available

    def test_single_feed_still_works(self, tilapia_fingerling):
        feeds = [{'id': 99, 'name': 'Only Feed', 'brand': '', 'supplier_name': 'X',
                  'price_per_kg': 1.0, 'currency': 'USD', 'is_available': True,
                  'stock_quantity_kg': 100,
                  'composition': {'protein': 32, 'fat': 8, 'fiber': 3, 'moisture': 9}}]
        results = recommend_feeds(tilapia_fingerling, feeds, top_n=5)
        assert len(results) == 1

    def test_brackish_species_recommendations(self, sample_feeds):
        milkfish = {
            'growth_stage': 'juvenile', 'water_type': 'brackish',
            'water_temperature': 27.0, 'water_ph': 8.0, 'dissolved_oxygen': 6.0,
            'water_condition': 'good', 'average_weight_grams': 50.0,
            'min_protein_req': 28.0, 'max_protein_req': 38.0,
            'min_fat_req': 6.0, 'max_fat_req': 14.0,
            'nutritional_requirements': {
                'protein': {'min': 28, 'max': 38}, 'fat': {'min': 6, 'max': 14},
                'fiber': {'min': 0, 'max': 5}, 'moisture': {'min': 0, 'max': 10},
            },
        }
        results = recommend_feeds(milkfish, sample_feeds)
        assert len(results) > 0
        scores = [r['match_percentage'] for r in results]
        assert scores == sorted(scores, reverse=True)


# ── Explanation Builder Tests ─────────────────────────────────────────────────

class TestBuildExplanation:
    def test_contains_group_name(self):
        req = {'protein': {'min': 28, 'max': 36}}
        comp = {'protein': 32}
        text = _build_explanation('omnivore_grow', 0.9, 0.85, req, comp)
        assert 'Omnivore Grow' in text

    def test_excellent_score_message(self):
        req = {'protein': {'min': 28, 'max': 36}}
        comp = {'protein': 32}
        text = _build_explanation('omnivore_grow', 0.92, 0.90, req, comp)
        assert 'Excellent' in text

    def test_poor_score_message(self):
        req = {'protein': {'min': 28, 'max': 36}}
        comp = {'protein': 10}
        text = _build_explanation('carnivore_adult', 0.20, 0.15, req, comp)
        assert 'Poor' in text or 'poor' in text
