import pandas as pd
import numpy as np
from sqlalchemy.orm import Session
from db_utils.db import SessionLocal, Post
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, r2_score, mean_absolute_error
import torch
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorWithPadding
)
from torch.utils.data import Dataset
import logging
from typing import List, Dict, Tuple
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Use 4-bit quantization to reduce memory usage
os.environ["PYTORCH_ENABLE_CPU_ADAPTIVE_TORCH"] = "1"

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

class DisasterSentimentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=512):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = str(self.texts[idx])
        encoding = self.tokenizer(
            text,
            truncation=True,
            max_length=self.max_length,
            padding="max_length",
            return_tensors="pt"
        )
        
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(self.labels[idx], dtype=torch.long)
        }

def train_model(data: pd.DataFrame) -> Tuple[float, Dict]:
    """Train and evaluate using LLaMA for sentiment classification"""
    # Split data
    train_df, test_df = train_test_split(data, test_size=0.2, random_state=42)
    
    # Define sentiment labels
    sentiment_labels = ['fearful', 'urgent', 'negative', 'neutral', 'positive']
    id2label = {idx: label for idx, label in enumerate(sentiment_labels)}
    label2id = {label: idx for idx, label in enumerate(sentiment_labels)}
    
    # Initialize tokenizer and model
    model_name = "NousResearch/Llama-2-7b-chat-hf"  # Using the chat version for better performance
    
    # Load tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        use_fast=True
    )
    
    # Load model
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(sentiment_labels),
        id2label=id2label,
        label2id=label2id,
        load_in_4bit=True,  # Use 4-bit quantization
        torch_dtype=torch.float16
    )
    
    # Prepare datasets
    train_dataset = DisasterSentimentDataset(
        train_df['text'].values,
        [label2id[label] for label in train_df['current_sentiment']],
        tokenizer
    )
    
    test_dataset = DisasterSentimentDataset(
        test_df['text'].values,
        [label2id[label] for label in test_df['current_sentiment']],
        tokenizer
    )
    
    # Setup training arguments
    training_args = TrainingArguments(
        output_dir="./sentiment_model",
        evaluation_strategy="epoch",
        learning_rate=2e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=3,
        weight_decay=0.01,
        push_to_hub=False,
        logging_dir='./logs'
    )
    
    # Initialize trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=test_dataset,
        tokenizer=tokenizer,
        data_collator=DataCollatorWithPadding(tokenizer=tokenizer)
    )
    
    # Train the model
    trainer.train()
    
    # Get predictions
    predictions = trainer.predict(test_dataset)
    predicted_labels = np.argmax(predictions.predictions, axis=1)
    predicted_labels = [id2label[idx] for idx in predicted_labels]
    
    # Calculate accuracy and report
    accuracy = sum(1 for i, pred in enumerate(predicted_labels) 
                  if pred == test_df['current_sentiment'].iloc[i]) / len(predicted_labels)
    
    report = classification_report(
        test_df['current_sentiment'],
        predicted_labels,
        output_dict=True
    )
    
    # Convert predictions to sentiment scores for regression metrics
    sentiment_scores = {
        'fearful': -1.0,
        'urgent': -0.8,
        'negative': -0.5,
        'neutral': 0.0,
        'positive': 1.0
    }
    
    predicted_scores = [sentiment_scores[label] for label in predicted_labels]
    true_scores = [sentiment_scores[label] for label in test_df['current_sentiment']]
    
    # Calculate regression metrics
    r2 = r2_score(true_scores, predicted_scores)
    mae = mean_absolute_error(true_scores, predicted_scores)
    score_correlation = np.corrcoef(predicted_scores, true_scores)[0, 1]
    
    report['score_metrics'] = {
        'r2_score': r2,
        'correlation': score_correlation,
        'mean_absolute_error': mae
    }
    
    # Save the model and tokenizer
    model.save_pretrained('./sentiment_model/final')
    tokenizer.save_pretrained('./sentiment_model/final')
    
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
    
    logger.info("\nConclusion:")
    logger.info("-----------")
    r2 = report['score_metrics']['r2_score']
    correlation = report['score_metrics']['correlation']
    mae = report['score_metrics']['mean_absolute_error']
    
    if r2 > 0.7 and correlation > 0.8 and mae < 0.3:
        logger.info("✅ The ML model shows excellent agreement with the current scoring system")
        logger.info("   This suggests we could replace the Gemini API calls with this model")
    elif r2 > 0.5 and correlation > 0.7 and mae < 0.4:
        logger.info("✅ The ML model shows good agreement with the current scoring system")
        logger.info("   With more training data, it could potentially replace the Gemini API")
    else:
        logger.info("⚠️ The model needs improvement before it can replace the Gemini API")
        logger.info("   Consider:")
        logger.info("   1. Collecting more training data")
        logger.info("   2. Adding more domain-specific features")
        logger.info("   3. Fine-tuning the model parameters")

if __name__ == "__main__":
    main()