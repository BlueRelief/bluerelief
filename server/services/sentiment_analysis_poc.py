import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from db_utils.db import SessionLocal, Post
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import classification_report, r2_score, mean_absolute_error
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
import re
import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
import logging
from typing import List, Dict, Tuple
import os

# Download required NLTK data
nltk.download('punkt')
nltk.download('stopwords')
nltk.download('averaged_perceptron_tagger')

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_training_data() -> pd.DataFrame:
    """Fetch posts with their current sentiment labels from the database"""
    db = SessionLocal()
    try:
        # Query posts that have sentiment labels
        posts = db.query(Post).filter(Post.sentiment.isnot(None)).filter(Post.sentiment_score.isnot(None)).all()
        
        data = [{
            'text': post.text,
            'current_sentiment': post.sentiment,
            'current_sentiment_score': post.sentiment_score
        } for post in posts]
        
        df = pd.DataFrame(data)
        
        # Remove any rows with missing values
        df = df.dropna()
        
        # Convert sentiment_score to float if it's not already
        df['current_sentiment_score'] = df['current_sentiment_score'].astype(float)
        
        return df
    finally:
        db.close()

def extract_text_features(text: str) -> Dict[str, float]:
    """Extract advanced linguistic features from text"""
    # Convert to lowercase and tokenize
    tokens = word_tokenize(text.lower())
    
    # Get POS tags
    pos_tags = nltk.pos_tag(tokens)
    
    # Initialize emergency/disaster/intensity term lists
    emergency_terms = {'emergency', 'urgent', 'help', 'sos', 'critical', 'immediate'}
    disaster_terms = {'fire', 'flood', 'earthquake', 'hurricane', 'tornado', 'disaster'}
    intensity_terms = {'severe', 'extreme', 'massive', 'devastating', 'catastrophic', 'major'}
    
    # Additional emotion terms
    fear_terms = {'scared', 'afraid', 'terrified', 'panic', 'fear', 'worried', 'scary'}
    distress_terms = {'help', 'trapped', 'stranded', 'dying', 'hurt', 'injured', 'pain'}
    urgency_terms = {'now', 'immediately', 'asap', 'urgent', 'emergency', 'quickly'}
    
    # Count features
    features = {
        'word_count': len(tokens),
        'avg_word_length': np.mean([len(word) for word in tokens]),
        'emergency_terms': sum(1 for word in tokens if word in emergency_terms),
        'disaster_terms': sum(1 for word in tokens if word in disaster_terms),
        'intensity_terms': sum(1 for word in tokens if word in intensity_terms),
        'fear_terms': sum(1 for word in tokens if word in fear_terms),
        'distress_terms': sum(1 for word in tokens if word in distress_terms),
        'urgency_terms': sum(1 for word in tokens if word in urgency_terms),
        'exclamation_count': text.count('!'),
        'question_count': text.count('?'),
        'uppercase_ratio': sum(1 for c in text if c.isupper()) / len(text),
        'noun_count': sum(1 for _, pos in pos_tags if pos.startswith('NN')),
        'verb_count': sum(1 for _, pos in pos_tags if pos.startswith('VB')),
        'adjective_count': sum(1 for _, pos in pos_tags if pos.startswith('JJ')),
        'adverb_count': sum(1 for _, pos in pos_tags if pos.startswith('RB'))
    }
    
    # Add ratios
    total_words = len(tokens)
    features.update({
        'emergency_ratio': features['emergency_terms'] / total_words if total_words > 0 else 0,
        'disaster_ratio': features['disaster_terms'] / total_words if total_words > 0 else 0,
        'intensity_ratio': features['intensity_terms'] / total_words if total_words > 0 else 0,
        'fear_ratio': features['fear_terms'] / total_words if total_words > 0 else 0,
        'distress_ratio': features['distress_terms'] / total_words if total_words > 0 else 0,
        'urgency_ratio': features['urgency_terms'] / total_words if total_words > 0 else 0
    })
    
    return features

def train_model(data: pd.DataFrame) -> Tuple[float, Dict]:
    """Train and evaluate an enhanced sentiment classifier"""
    # Split data
    train_df, test_df = train_test_split(data, test_size=0.2, random_state=42)
    
    # Create sentiment mapping for training
    sentiment_map = {
        'urgent': -0.8,    # Very negative but not as extreme as fearful
        'fearful': -1.0,   # Most negative
        'negative': -0.5,  # Moderately negative
        'neutral': 0.0,    # Middle point
        'positive': 1.0    # Most positive
    }
    
    # Extract advanced features
    logger.info("Extracting text features...")
    train_features = pd.DataFrame([
        extract_text_features(text) for text in train_df['text']
    ])
    test_features = pd.DataFrame([
        extract_text_features(text) for text in test_df['text']
    ])
    
    # Create TF-IDF features
    logger.info("Creating TF-IDF features...")
    tfidf = TfidfVectorizer(
        max_features=1000,
        stop_words='english',
        ngram_range=(1, 3),  # Include phrases up to 3 words
        min_df=2,           # Ignore terms that appear in less than 2 documents
        max_df=0.95         # Ignore terms that appear in more than 95% of documents
    )
    
    # Create a pipeline
    pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', LogisticRegression(
            multi_class='ovr',
            class_weight='balanced',
            max_iter=1000
        ))
    ])
    
    # Define hyperparameters for grid search
    param_grid = {
        'classifier__C': [0.1, 1.0, 10.0],
        'classifier__solver': ['lbfgs', 'liblinear'],
    }
    
    # Combine TF-IDF with engineered features
    X_train_tfidf = tfidf.fit_transform(train_df['text']).toarray()
    X_test_tfidf = tfidf.transform(test_df['text']).toarray()
    
    X_train = np.hstack([X_train_tfidf, train_features])
    X_test = np.hstack([X_test_tfidf, test_features])
    
    # Train model with grid search
    logger.info("Training model with grid search...")
    grid_search = GridSearchCV(
        pipeline,
        param_grid,
        cv=5,
        scoring='f1_weighted',
        n_jobs=-1
    )
    grid_search.fit(X_train, train_df['current_sentiment'])
    
    # Get best model
    model = grid_search.best_estimator_
    
    # Make predictions
    predictions = model.predict(X_test)
    predicted_scores = model.predict_proba(X_test)  # Get probability scores
    
    # Calculate metrics
    accuracy = sum(1 for i, pred in enumerate(predictions) 
                  if pred == test_df['current_sentiment'].iloc[i]) / len(predictions)
    
    report = classification_report(
        test_df['current_sentiment'],
        predictions,
        output_dict=True
    )
    
    # Convert predictions to numerical scores for regression metrics
    sentiment_scores = {
        'fearful': -1.0,
        'urgent': -0.8,
        'negative': -0.5,
        'neutral': 0.0,
        'positive': 1.0
    }
    
    predicted_scores = [sentiment_scores[label] for label in predictions]
    true_scores = [sentiment_scores[label] for label in test_df['current_sentiment']]
    
    # Calculate regression metrics
    r2 = r2_score(true_scores, predicted_scores)
    mae = mean_absolute_error(true_scores, predicted_scores)
    score_correlation = np.corrcoef(predicted_scores, true_scores)[0, 1]
    
    # Get feature importance for the TF-IDF features
    feature_importance = []
    if hasattr(model.named_steps['classifier'], 'coef_'):
        coefficients = model.named_steps['classifier'].coef_
        feature_names = (
            tfidf.get_feature_names_out().tolist() + 
            train_features.columns.tolist()
        )
        # For multi-class, average the absolute coefficients across classes
        avg_coef = np.abs(coefficients).mean(axis=0)
        feature_importance = sorted(
            zip(feature_names, avg_coef),
            key=lambda x: abs(x[1]),
            reverse=True
        )[:10]  # Top 10 features
    
    report['score_metrics'] = {
        'r2_score': r2,
        'correlation': score_correlation,
        'mean_absolute_error': mae,
        'grid_search_best_params': grid_search.best_params_,
        'feature_importance': feature_importance
    }
    
    return accuracy, report

def analyze_current_method(data: pd.DataFrame) -> Dict:
    """Analyze the consistency and distribution of current sentiment labels"""
    sentiment_dist = data['current_sentiment'].value_counts().to_dict()
    avg_score = data['current_sentiment_score'].mean()
    score_std = data['current_sentiment_score'].std()
    
    # Calculate distribution of sentiment scores in ranges
    score_ranges = {
        'highly_negative': lambda x: x <= -0.8,
        'moderately_negative': lambda x: -0.8 < x <= -0.3,
        'neutral': lambda x: -0.3 < x <= 0.3,
        'moderately_positive': lambda x: 0.3 < x <= 0.8,
        'highly_positive': lambda x: x > 0.8
    }
    
    score_dist = {
        range_name: len(data[data['current_sentiment_score'].apply(range_func)])
        for range_name, range_func in score_ranges.items()
    }
    
    return {
        'distribution': sentiment_dist,
        'average_score': avg_score,
        'score_std': score_std,
        'score_distribution': score_dist
    }

def main():
    """Run the POC comparison"""
    logger.info("Fetching training data...")
    data = get_training_data()
    
    logger.info(f"Retrieved {len(data)} labeled posts")
    
    # Analyze current method
    current_analysis = analyze_current_method(data)
    logger.info("\nCurrent Method Analysis:")
    logger.info("------------------------")
    logger.info("Sentiment Label Distribution:")
    for sentiment, count in current_analysis['distribution'].items():
        logger.info(f"  {sentiment}: {count} posts ({count/len(data)*100:.1f}%)")
    
    logger.info("\nSentiment Score Distribution:")
    for range_name, count in current_analysis['score_distribution'].items():
        logger.info(f"  {range_name}: {count} posts ({count/len(data)*100:.1f}%)")
    
    logger.info(f"\nAverage score: {current_analysis['average_score']:.2f} ± {current_analysis['score_std']:.2f}")
    
    # Train and evaluate new model
    logger.info("\nTraining and Evaluating ML Model...")
    logger.info("--------------------------------")
    accuracy, report = train_model(data)
    
    logger.info(f"\nModel Classification Accuracy: {accuracy:.2f}")
    logger.info("\nPer-Category Performance:")
    for label in report:
        if label not in ['accuracy', 'score_metrics']:
            logger.info(f"\n{label}:")
            logger.info(f"  Precision: {report[label]['precision']:.2f}")
            logger.info(f"  Recall: {report[label]['recall']:.2f}")
            logger.info(f"  F1-score: {report[label]['f1-score']:.2f}")
    
    logger.info("\nScore Prediction Performance:")
    logger.info(f"  R² Score: {report['score_metrics']['r2_score']:.2f}")
    logger.info(f"  Correlation with current scores: {report['score_metrics']['correlation']:.2f}")
    logger.info(f"  Mean Absolute Error: {report['score_metrics']['mean_absolute_error']:.2f}")
    
    logger.info("\nModel Performance:")
    logger.info("----------------")
    r2 = report['score_metrics']['r2_score']
    correlation = report['score_metrics']['correlation']
    mae = report['score_metrics']['mean_absolute_error']
    
    logger.info(f"Best parameters from grid search: {report['score_metrics']['grid_search_best_params']}")
    logger.info("\nTop Features by Importance:")
    for feature, importance in report['score_metrics']['feature_importance']:
        logger.info(f"  • {feature}: {importance:.3f}")
    
    logger.info("\nConclusion:")
    logger.info("-----------")
    if r2 > 0.7 and correlation > 0.8 and mae < 0.3:
        logger.info("✅ The ML model shows excellent agreement with the current scoring system")
        logger.info("   This suggests we could replace the Gemini API calls with this model")
    elif r2 > 0.5 and correlation > 0.7 and mae < 0.4:
        logger.info("✅ The ML model shows good agreement with the current scoring system")
        logger.info("   With more training data, it could potentially replace the Gemini API")
    else:
        logger.info("⚠️ The model needs improvement before it can replace the Gemini API")
        logger.info("   Consider:")
        logger.info("   1. Collecting more balanced training data")
        logger.info("   2. Feature engineering improvements:")
        logger.info("      - Add more emotion-specific features")
        logger.info("      - Consider using pre-trained word embeddings")
        logger.info("   3. Model tuning:")
        logger.info("      - Try different regularization parameters")
        logger.info("      - Experiment with feature selection")
        logger.info("      - Consider ensemble methods")

if __name__ == "__main__":
    main()