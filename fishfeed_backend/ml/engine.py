"""
Fish Feed Recommendation Engine
================================
Uses LDA (Linear Discriminant Analysis) combined with nutritional
compatibility scoring to recommend the best feed for a given fish stock.

How it works:
1. Feature vector is built from the fish stock's conditions
2. LDA model classifies the fish into a feed-group cluster
3. Nutritional compatibility score is calculated per available feed
4. Feeds are ranked by composite score (LDA weight + nutritional match)
"""

import numpy as np
import pandas as pd
import logging
import os
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.pipeline import Pipeline
import joblib
from pathlib import Path

logger = logging.getLogger(__name__)

# Path where trained models are persisted
MODEL_DIR = Path(__file__).resolve().parent.parent / 'models'
MODEL_DIR.mkdir(parents=True, exist_ok=True)

LDA_MODEL_PATH = MODEL_DIR / 'lda_feed_classifier.pkl'
SCALER_PATH = MODEL_DIR / 'feature_scaler.pkl'
LABEL_ENCODER_PATH = MODEL_DIR / 'label_encoder.pkl'


# ─── Feature Engineering ────────────────────────────────────────────────────

GROWTH_STAGE_MAP = {
    'fry': 0,
    'fingerling': 1,
    'juvenile': 2,
    'sub_adult': 3,
    'adult': 4,
}

WATER_TYPE_MAP = {
    'freshwater': 0,
    'saltwater': 1,
    'brackish': 2,
}

WATER_CONDITION_MAP = {
    'good': 2,
    'fair': 1,
    'poor': 0,
}


def build_fish_feature_vector(fish_stock_data: dict) -> np.ndarray:
    """
    Convert a fish stock dict to a numeric feature vector for LDA.

    Expected keys:
        - growth_stage (str)
        - water_type (str)
        - water_temperature (float, optional)
        - water_ph (float, optional)
        - dissolved_oxygen (float, optional)
        - water_condition (str)
        - average_weight_grams (float)
        - min_protein_req (float) — from species
        - max_protein_req (float) — from species
        - min_fat_req (float) — from species
        - max_fat_req (float) — from species
    """
    return np.array([
        GROWTH_STAGE_MAP.get(fish_stock_data.get('growth_stage', 'fingerling'), 1),
        WATER_TYPE_MAP.get(fish_stock_data.get('water_type', 'freshwater'), 0),
        fish_stock_data.get('water_temperature') or 25.0,
        fish_stock_data.get('water_ph') or 7.0,
        fish_stock_data.get('dissolved_oxygen') or 6.0,
        WATER_CONDITION_MAP.get(fish_stock_data.get('water_condition', 'good'), 2),
        fish_stock_data.get('average_weight_grams') or 100.0,
        fish_stock_data.get('min_protein_req') or 25.0,
        fish_stock_data.get('max_protein_req') or 40.0,
        fish_stock_data.get('min_fat_req') or 5.0,
        fish_stock_data.get('max_fat_req') or 15.0,
    ]).reshape(1, -1)


# ─── Nutritional Scoring ─────────────────────────────────────────────────────

def nutritional_compatibility_score(feed_composition: dict, species_requirements: dict) -> float:
    """
    Score how well a feed's nutritional profile matches species requirements.

    Returns a float 0.0–1.0 where 1.0 is a perfect match.
    """
    scores = []

    nutrients = ['protein', 'fat', 'fiber', 'moisture']
    weights = [0.50, 0.30, 0.10, 0.10]  # protein most important

    for nutrient, weight in zip(nutrients, weights):
        feed_val = feed_composition.get(nutrient, 0)
        req = species_requirements.get(nutrient, {})
        min_req = req.get('min', 0)
        max_req = req.get('max', 100)

        if max_req == min_req:
            score = 1.0 if feed_val == min_req else 0.5
        elif min_req <= feed_val <= max_req:
            # Penalise values far from the midpoint
            midpoint = (min_req + max_req) / 2
            distance = abs(feed_val - midpoint)
            half_range = (max_req - min_req) / 2
            score = 1.0 - (distance / half_range) * 0.3  # at most 30% penalty
        elif feed_val < min_req:
            deficit = (min_req - feed_val) / max(min_req, 1)
            score = max(0.0, 1.0 - deficit * 1.5)
        else:
            excess = (feed_val - max_req) / max(max_req, 1)
            score = max(0.0, 1.0 - excess * 2.0)  # excess penalised harder than deficit

        scores.append(score * weight)

    return round(sum(scores) / sum(weights), 4)


# ─── LDA Model ───────────────────────────────────────────────────────────────

class FeedLDAClassifier:
    """
    LDA-based classifier that predicts the optimal feed category/group
    for a given fish stock.

    Training labels are derived from the best matching feed category
    per species + growth stage combination, so the model can generalise
    to new species not seen during training.
    """

    def __init__(self):
        self.scaler = StandardScaler()
        self.lda = LinearDiscriminantAnalysis(solver='svd', n_components=None)
        self.label_encoder = LabelEncoder()
        self.is_trained = False

    def _make_training_data(self):
        """
        Generate synthetic training data from species DB.
        In production this is replaced by real historical data.
        """
        records = []
        labels = []

        # Synthetic training examples (protein group → ideal nutritional band)
        # Group 0: High-protein carnivores (salmon, tuna) — protein 40-50%
        # Group 1: Medium-protein omnivores (tilapia, carp) — protein 28-38%
        # Group 2: Low-protein herbivores (grass carp) — protein 18-26%
        # Group 3: Fry/fingerling — high protein small pellet
        # Group 4: Adult large fish — balanced

        examples = [
            # (growth, water_type, temp, ph, do, condition, weight_g, min_p, max_p, min_f, max_f, label)

            # ── Carnivore grow (saltwater, cold, high weight, high protein req) ─
            (1, 1, 14, 7.2, 8, 2,  80,  38, 48, 10, 20, 'carnivore_grow'),
            (2, 1, 15, 7.2, 8, 2,  200, 38, 48, 10, 18, 'carnivore_grow'),
            (2, 1, 13, 7.0, 9, 2,  350, 40, 50, 12, 22, 'carnivore_grow'),
            (3, 1, 14, 7.1, 8, 2,  600, 38, 46, 10, 18, 'carnivore_grow'),
            (1, 1, 16, 7.3, 8, 2,  50,  40, 50, 11, 20, 'carnivore_grow'),
            (2, 1, 12, 7.0, 9, 2,  300, 42, 50, 14, 22, 'carnivore_grow'),
            (3, 1, 11, 7.2, 9, 2,  800, 38, 46, 10, 18, 'carnivore_grow'),

            # ── Carnivore adult (heavy, fully grown) ──────────────────────────
            (4, 1, 14, 7.2, 7, 2, 2000, 35, 45, 8,  16, 'carnivore_adult'),
            (4, 1, 13, 7.0, 8, 2, 3000, 36, 46, 9,  17, 'carnivore_adult'),
            (4, 1, 12, 7.1, 8, 2, 4000, 34, 44, 8,  16, 'carnivore_adult'),
            (4, 1, 15, 7.3, 7, 2, 2500, 36, 46, 9,  17, 'carnivore_adult'),

            # ── Omnivore grow (freshwater, warm, moderate protein) ────────────
            (1, 0, 28, 7.5, 6, 2,  10,  30, 38, 6,  14, 'omnivore_grow'),
            (1, 0, 27, 7.4, 6, 2,  15,  28, 36, 5,  12, 'omnivore_grow'),
            (2, 0, 26, 7.3, 6, 2,  80,  28, 35, 6,  12, 'omnivore_grow'),
            (2, 0, 29, 7.5, 6, 2,  120, 30, 38, 6,  13, 'omnivore_grow'),
            (3, 0, 28, 7.4, 5, 2,  250, 28, 36, 5,  12, 'omnivore_grow'),
            (1, 0, 30, 7.6, 7, 2,  12,  29, 37, 6,  13, 'omnivore_grow'),

            # ── Omnivore adult ─────────────────────────────────────────────────
            (4, 0, 28, 7.5, 5, 2,  500, 25, 32, 5,  10, 'omnivore_adult'),
            (4, 0, 27, 7.4, 5, 2,  600, 26, 33, 5,  11, 'omnivore_adult'),
            (4, 0, 29, 7.6, 5, 2,  700, 24, 31, 4,   9, 'omnivore_adult'),
            (4, 0, 26, 7.3, 5, 2,  900, 25, 32, 5,  10, 'omnivore_adult'),

            # ── Herbivore grow ─────────────────────────────────────────────────
            (2, 0, 25, 7.0, 5, 2,  100, 18, 26, 3,   8, 'herbivore_grow'),
            (3, 0, 24, 7.2, 5, 2,  300, 18, 24, 3,   7, 'herbivore_grow'),
            (1, 0, 26, 7.1, 5, 2,   30, 20, 28, 3,   8, 'herbivore_grow'),

            # ── Herbivore adult ────────────────────────────────────────────────
            (4, 0, 24, 7.2, 5, 2,  800, 16, 24, 3,   7, 'herbivore_adult'),
            (4, 0, 25, 7.0, 5, 2, 1200, 16, 22, 2,   6, 'herbivore_adult'),

            # ── Fry starter (tiny weight <2g, growth=fry, very high protein) ──
            (0, 0, 28, 7.5, 7, 2,  0.5, 45, 55, 12, 20, 'fry_starter'),
            (0, 0, 29, 7.6, 7, 2,  1.0, 46, 56, 13, 21, 'fry_starter'),
            (0, 1, 20, 7.2, 8, 2,  0.3, 48, 58, 14, 22, 'fry_starter'),
            (0, 1, 19, 7.0, 9, 2,  0.5, 50, 60, 15, 23, 'fry_starter'),
            (0, 2, 25, 7.8, 6, 2,  0.8, 44, 54, 12, 20, 'fry_starter'),
            (0, 0, 27, 7.4, 7, 2,  1.5, 45, 55, 12, 20, 'fry_starter'),
            (0, 1, 21, 7.1, 8, 2,  0.4, 46, 56, 13, 21, 'fry_starter'),

            # ── Brackish grow ──────────────────────────────────────────────────
            (2, 2, 26, 7.8, 6, 2,  150, 32, 42, 7,  15, 'brackish_grow'),
            (3, 2, 27, 8.0, 6, 2,  400, 30, 40, 6,  14, 'brackish_grow'),
            (1, 2, 26, 7.9, 6, 2,   40, 32, 42, 7,  15, 'brackish_grow'),

            # ── Brackish adult ─────────────────────────────────────────────────
            (4, 2, 27, 8.0, 6, 2,  700, 28, 36, 6,  12, 'brackish_adult'),
            (4, 2, 28, 8.1, 6, 2, 1000, 26, 34, 5,  11, 'brackish_adult'),
        ]

        for ex in examples:
            records.append(list(ex[:11]))
            labels.append(ex[11])

        return np.array(records, dtype=float), labels

    def train(self):
        """Train the LDA model on synthetic (or DB-loaded) data."""
        X, y = self._make_training_data()
        y_encoded = self.label_encoder.fit_transform(y)
        X_scaled = self.scaler.fit_transform(X)
        self.lda.fit(X_scaled, y_encoded)
        self.is_trained = True
        logger.info('LDA model trained on %d samples with %d classes.', len(X), len(set(y)))

    def save(self):
        joblib.dump(self.scaler, SCALER_PATH)
        joblib.dump(self.lda, LDA_MODEL_PATH)
        joblib.dump(self.label_encoder, LABEL_ENCODER_PATH)
        logger.info('LDA model saved to %s', MODEL_DIR)

    def load(self):
        if not LDA_MODEL_PATH.exists():
            raise FileNotFoundError(f'Model not found at {LDA_MODEL_PATH}. Run train() first.')
        self.scaler = joblib.load(SCALER_PATH)
        self.lda = joblib.load(LDA_MODEL_PATH)
        self.label_encoder = joblib.load(LABEL_ENCODER_PATH)
        self.is_trained = True
        logger.info('LDA model loaded.')

    def predict_feed_group(self, feature_vector: np.ndarray) -> tuple[str, dict]:
        """
        Predict the feed group and return class probabilities.
        Returns (predicted_group_label, {group: probability})
        """
        if not self.is_trained:
            raise RuntimeError('Model not trained. Call train() first.')

        X_scaled = self.scaler.transform(feature_vector)
        pred_encoded = self.lda.predict(X_scaled)[0]
        proba = self.lda.predict_proba(X_scaled)[0]
        classes = self.label_encoder.classes_

        group_probabilities = {
            cls: round(float(p), 4)
            for cls, p in zip(classes, proba)
        }
        predicted_group = self.label_encoder.inverse_transform([pred_encoded])[0]
        return predicted_group, group_probabilities


# ─── Main Recommendation Function ────────────────────────────────────────────

# Singleton LDA instance
_lda_instance: FeedLDAClassifier | None = None


def get_lda_model() -> FeedLDAClassifier:
    global _lda_instance
    if _lda_instance is None:
        _lda_instance = FeedLDAClassifier()
        try:
            _lda_instance.load()
        except FileNotFoundError:
            logger.warning('No saved LDA model found. Training fresh model.')
            _lda_instance.train()
            _lda_instance.save()
    return _lda_instance


def recommend_feeds(fish_stock_data: dict, available_feeds: list[dict], top_n: int = 5) -> list[dict]:
    """
    Main recommendation function.

    Args:
        fish_stock_data: dict with fish stock + species info
        available_feeds: list of feed dicts (id, name, composition, price, etc.)
        top_n: number of recommendations to return

    Returns:
        Sorted list of feed recommendations with scores and explanations.
    """
    if not available_feeds:
        return []

    lda = get_lda_model()
    feature_vector = build_fish_feature_vector(fish_stock_data)

    try:
        predicted_group, group_proba = lda.predict_feed_group(feature_vector)
    except Exception as e:
        logger.error('LDA prediction failed: %s', e)
        predicted_group, group_proba = 'omnivore_grow', {}

    species_requirements = fish_stock_data.get('nutritional_requirements', {})

    scored_feeds = []
    for feed in available_feeds:
        composition = feed.get('composition', {})
        nutritional_score = nutritional_compatibility_score(composition, species_requirements)

        # Group compatibility: how well does this feed's protein match the predicted group?
        feed_protein = composition.get('protein', 0)
        group_score = _group_protein_score(predicted_group, feed_protein)

        # Composite score: 70% nutritional match + 20% group match + 10% availability bonus
        availability_bonus = 0.1 if feed.get('is_available', True) else 0.0
        composite_score = round(
            0.70 * nutritional_score +
            0.20 * group_score +
            0.10 * availability_bonus,
            4
        )

        match_percentage = round(composite_score * 100, 1)

        scored_feeds.append({
            'feed_id': feed['id'],
            'feed_name': feed['name'],
            'brand': feed.get('brand', ''),
            'supplier_name': feed.get('supplier_name', ''),
            'price_per_kg': feed.get('price_per_kg'),
            'currency': feed.get('currency', 'USD'),
            'composition': composition,
            'match_percentage': match_percentage,
            'nutritional_score': round(nutritional_score * 100, 1),
            'group_score': round(group_score * 100, 1),
            'predicted_feed_group': predicted_group,
            'explanation': _build_explanation(
                predicted_group, nutritional_score, group_score, species_requirements, composition
            ),
            'is_available': feed.get('is_available', True),
            'stock_quantity_kg': feed.get('stock_quantity_kg', 0),
        })

    scored_feeds.sort(key=lambda x: x['match_percentage'], reverse=True)
    return scored_feeds[:top_n]


def _group_protein_score(group: str, feed_protein: float) -> float:
    """Score how well a feed's protein % fits the predicted feed group."""
    protein_bands = {
        'fry_starter':    (46, 58),
        'carnivore_grow': (38, 46),
        'carnivore_adult':(34, 44),
        'omnivore_grow':  (28, 38),
        'omnivore_adult': (24, 33),
        'herbivore_grow': (18, 26),
        'herbivore_adult':(16, 24),
        'brackish_grow':  (30, 42),
        'brackish_adult': (26, 36),
    }
    band = protein_bands.get(group, (25, 40))
    lo, hi = band
    if lo <= feed_protein <= hi:
        mid = (lo + hi) / 2
        half_range = (hi - lo) / 2
        return 1.0 - abs(feed_protein - mid) / half_range * 0.15
    # Out of band: score drops steeply, never above 0.5
    gap = min(abs(feed_protein - lo), abs(feed_protein - hi))
    band_width = max(hi - lo, 1)
    return max(0.0, 0.5 - gap / band_width * 0.8)


def _build_explanation(group, nutritional_score, group_score, requirements, composition) -> str:
    lines = [f'Predicted feed group: {group.replace("_", " ").title()}.']

    protein_req = requirements.get('protein', {})
    feed_protein = composition.get('protein', 0)
    if protein_req:
        lines.append(
            f'Protein: feed has {feed_protein}% vs species requirement '
            f'{protein_req.get("min", 0)}–{protein_req.get("max", 100)}%.'
        )

    if nutritional_score >= 0.85:
        lines.append('Excellent nutritional match.')
    elif nutritional_score >= 0.65:
        lines.append('Good nutritional match.')
    elif nutritional_score >= 0.45:
        lines.append('Partial nutritional match — consider alternatives.')
    else:
        lines.append('Poor nutritional match — strongly consider an alternative feed.')

    return ' '.join(lines)
