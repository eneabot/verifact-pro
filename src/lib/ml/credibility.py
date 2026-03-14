"""
ML-based Credibility Scoring Model
Uses XGBoost + domain expertise for accuracy
"""

import numpy as np
from typing import Dict, List, Tuple

# Placeholder for XGBoost model (to be trained)
class CredibilityModel:
    """
    Ensemble model combining:
    - Source reliability (40%)
    - Content signals (60%)
    """
    
    def __init__(self):
        self.source_weight = 0.4
        self.content_weight = 0.6
        self.features = [
            'source_base_score',
            'sentence_count',
            'has_external_links',
            'has_quotes',
            'has_numbers',
            'has_named_entities',
            'sentiment_polarity',
            'word_count',
            'avg_word_length',
            'reading_difficulty',
        ]
    
    def extract_features(self, article_text: str, source_score: int) -> Dict[str, float]:
        """Extract features from article content"""
        features = {
            'source_base_score': source_score,
        }
        
        # Text metrics
        sentences = article_text.split('.')
        words = article_text.split()
        
        features['sentence_count'] = len(sentences)
        features['word_count'] = len(words)
        features['avg_word_length'] = np.mean([len(w) for w in words]) if words else 0
        
        # Content signals
        features['has_external_links'] = int('http' in article_text)
        features['has_quotes'] = int('"' in article_text or '«' in article_text)
        features['has_numbers'] = int(any(c.isdigit() for c in article_text))
        features['has_named_entities'] = self._count_entities(article_text)
        
        # Sentiment (placeholder)
        features['sentiment_polarity'] = 0.5  # -1 to 1
        
        # Reading difficulty (Flesch-Kincaid estimate)
        features['reading_difficulty'] = self._estimate_reading_level(article_text)
        
        return features
    
    def _count_entities(self, text: str) -> int:
        """Rough count of named entities (capitalized words)"""
        words = text.split()
        capitals = sum(1 for w in words if w and w[0].isupper())
        return min(capitals / len(words) if words else 0, 1.0)
    
    def _estimate_reading_level(self, text: str) -> float:
        """Flesch-Kincaid reading ease (0-1 normalized)"""
        words = text.split()
        sentences = text.split('.')
        syllables = sum(self._count_syllables(w) for w in words)
        
        if not words or not sentences:
            return 0.5
        
        # Simplified Flesch formula
        level = 206.835 - 1.015 * (len(words) / len(sentences)) - 84.6 * (syllables / len(words))
        return max(0, min(level / 100, 1.0))  # Normalize to 0-1
    
    def _count_syllables(self, word: str) -> int:
        """Rough syllable count"""
        word = word.lower()
        vowels = 'aeiouy'
        syllables = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllables += 1
            prev_was_vowel = is_vowel
        
        return max(1, syllables)
    
    def predict(self, features: Dict[str, float]) -> Tuple[int, Dict]:
        """
        Predict credibility score (0-100)
        Returns: (score, explanation)
        """
        
        # Placeholder: simple weighted average
        # In production: XGBoost model inference
        
        source_score = features.get('source_base_score', 50)
        
        # Content quality signals
        content_signals = []
        
        # More words = generally more thorough
        word_count = features.get('word_count', 0)
        word_signal = min(word_count / 500, 1.0) * 20  # 0-20 points
        content_signals.append(word_signal)
        
        # External links are credibility signal
        has_links = features.get('has_external_links', 0)
        content_signals.append(has_links * 15)  # 0-15 points
        
        # Quotes signal sourcing
        has_quotes = features.get('has_quotes', 0)
        content_signals.append(has_quotes * 10)  # 0-10 points
        
        # Numbers/data are credibility signal
        has_numbers = features.get('has_numbers', 0)
        content_signals.append(has_numbers * 10)  # 0-10 points
        
        # Reading difficulty (too easy OR too hard = red flag)
        reading_level = features.get('reading_difficulty', 0.5)
        difficulty_signal = 20 * (1 - abs(reading_level - 0.5) * 2)
        content_signals.append(max(0, difficulty_signal))
        
        # Combine
        content_score = min(sum(content_signals), 100)
        final_score = int(source_score * self.source_weight + content_score * self.content_weight)
        
        return final_score, {
            'source_score': source_score,
            'content_score': int(content_score),
            'word_count': features.get('word_count', 0),
            'has_links': bool(has_links),
            'has_quotes': bool(has_quotes),
            'has_numbers': bool(has_numbers),
        }


# Singleton instance
credibility_model = CredibilityModel()
