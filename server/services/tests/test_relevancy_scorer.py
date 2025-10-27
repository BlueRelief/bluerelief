import pytest
from datetime import datetime, timedelta
from services.relevancy_scorer import RelevancyScorer

@pytest.fixture
def scorer():
    return RelevancyScorer()

@pytest.fixture
def mock_post_data():
    return {
        "author": {
            "handle": "test.bsky.social",
            "display_name": "Test User",
            "followers_count": 1000,
            "following_count": 800,
            "posts_count": 500,
            "description": "Disaster reporter"
        },
        "engagement": {
            "likes": 25,
            "reposts": 15,
            "replies": 10
        },
        "media": {
            "has_media": True,
            "count": 2,
            "urls": ["url1", "url2"]
        },
        "content": {
            "text": "Major earthquake reported in the region. Emergency services responding. Stay safe!",
            "hashtags": ["#earthquake", "#emergency"],
            "mentions": ["@emergencyservices"],
            "external_urls": ["https://reuters.com/article"],
            "language": "en"
        },
        "moderation": {
            "labels": [],
            "warnings": [],
            "status": "active"
        },
        "thread": {
            "parent_uri": None,
            "root_uri": None,
            "depth": 0
        },
        "indexed_at": datetime.utcnow().isoformat()
    }

def test_author_credibility_scoring(scorer, mock_post_data):
    """Test author credibility component scoring"""
    score = scorer.score_author_credibility(mock_post_data["author"])
    assert score >= 0 and score <= 30
    assert score > 20  # Should score high with good metrics

    # Test low follower count
    mock_post_data["author"]["followers_count"] = 5
    score = scorer.score_author_credibility(mock_post_data["author"])
    assert score < 20  # Should score lower

def test_engagement_scoring(scorer, mock_post_data):
    """Test engagement scoring component"""
    score = scorer.score_engagement(
        mock_post_data["engagement"],
        mock_post_data["indexed_at"]
    )
    assert score >= 0 and score <= 25
    assert score >= 15  # Should score well with good engagement

    # Test velocity bonus
    recent_time = datetime.utcnow().isoformat()
    high_engagement = {"likes": 30, "reposts": 20, "replies": 15}
    score = scorer.score_engagement(high_engagement, recent_time)
    assert score == 25  # Should get max score with velocity bonus

def test_content_quality_scoring(scorer, mock_post_data):
    """Test content quality scoring component"""
    score = scorer.score_content_quality(mock_post_data)
    assert score >= 0 and score <= 25
    assert score >= 20  # Should score high with good content

    # Test without media
    mock_post_data["media"]["has_media"] = False
    mock_post_data["media"]["count"] = 0
    score = scorer.score_content_quality(mock_post_data)
    assert score < 20  # Should score lower without media

def test_context_scoring(scorer, mock_post_data):
    """Test context scoring component"""
    score = scorer.score_context(
        mock_post_data["content"],
        mock_post_data["thread"]
    )
    assert score >= 0 and score <= 20
    assert score >= 15  # Should score high with good context

    # Test deep reply
    mock_post_data["thread"]["depth"] = 3
    score = scorer.score_context(
        mock_post_data["content"],
        mock_post_data["thread"]
    )
    assert score < 15  # Should score lower for deep replies

def test_disqualifiers(scorer, mock_post_data):
    """Test automatic disqualification conditions"""
    flags = scorer.check_disqualifiers(mock_post_data)
    assert not flags  # Should have no flags with good post

    # Test moderation labels
    mock_post_data["moderation"]["labels"] = ["spam"]
    flags = scorer.check_disqualifiers(mock_post_data)
    assert "moderation_labels" in flags

def test_overall_scoring(scorer, mock_post_data):
    """Test complete scoring calculation"""
    result = scorer.calculate_score(mock_post_data)
    
    assert "score" in result
    assert "breakdown" in result
    assert "is_relevant" in result
    assert "flags" in result
    
    assert result["score"] >= 0 and result["score"] <= 100
    assert isinstance(result["is_relevant"], bool)
    assert isinstance(result["flags"], list)
    
    # Test score components
    breakdown = result["breakdown"]
    assert "author_credibility" in breakdown
    assert "engagement" in breakdown
    assert "content_quality" in breakdown
    assert "context" in breakdown

def test_spam_detection(scorer):
    """Test identification of spam/low quality posts"""
    spam_post = {
        "author": {
            "handle": "spam.bsky.social",
            "followers_count": 1,
            "following_count": 5000,
            "posts_count": 10000,
        },
        "engagement": {
            "likes": 0,
            "reposts": 0,
            "replies": 0
        },
        "content": {
            "text": "Check out my profile! #follow #like #share #viral #trending #popular",
            "hashtags": ["#follow", "#like", "#share", "#viral", "#trending", "#popular"],
            "mentions": ["@user1", "@user2", "@user3", "@user4", "@user5", "@user6"],
            "external_urls": [],
            "language": "en"
        },
        "media": {
            "has_media": False,
            "count": 0,
            "urls": []
        },
        "moderation": {
            "labels": [],
            "warnings": [],
            "status": "active"
        },
        "thread": {
            "depth": 0
        },
        "indexed_at": datetime.utcnow().isoformat()
    }
    
    result = scorer.calculate_score(spam_post)
    assert result["score"] < 50  # Should fail relevancy threshold
    assert not result["is_relevant"]

def test_breaking_news_scenario(scorer):
    """Test handling of breaking news posts with low initial engagement"""
    breaking_news = {
        "author": {
            "handle": "news.bsky.social",
            "followers_count": 50000,
            "following_count": 1000,
            "posts_count": 10000,
        },
        "engagement": {
            "likes": 2,
            "reposts": 1,
            "replies": 1
        },
        "content": {
            "text": "BREAKING: Major earthquake hits downtown. First responders en route. Updates to follow.",
            "hashtags": ["#earthquake", "#breaking"],
            "mentions": ["@emergencyservices"],
            "external_urls": ["https://reuters.com/breaking"],
            "language": "en"
        },
        "media": {
            "has_media": True,
            "count": 1,
            "urls": ["url1"]
        },
        "moderation": {
            "labels": [],
            "warnings": [],
            "status": "active"
        },
        "thread": {
            "depth": 0
        },
        "indexed_at": datetime.utcnow().isoformat()
    }
    
    result = scorer.calculate_score(breaking_news)
    assert result["score"] >= 50  # Should still be relevant despite low engagement
    assert result["is_relevant"]

def test_old_post_scoring(scorer, mock_post_data):
    """Test scoring of older posts"""
    old_date = (datetime.utcnow() - timedelta(days=7)).isoformat()
    mock_post_data["indexed_at"] = old_date
    
    # Even with high engagement, shouldn't get velocity bonus
    mock_post_data["engagement"]["likes"] = 100
    mock_post_data["engagement"]["reposts"] = 50
    
    result = scorer.calculate_score(mock_post_data)
    assert result["breakdown"]["engagement"] <= 25  # No velocity bonus