from typing import Dict, List
from datetime import datetime

class RelevancyScorer:
    def __init__(self):
        self.min_threshold = 50  # Configurable minimum score threshold
        
    def calculate_score(self, post_data: Dict) -> Dict:
        """Calculate overall relevancy score for a post."""
        # Check disqualifiers first
        flags = self.check_disqualifiers(post_data)
        if flags:
            return {
                "score": 0,
                "breakdown": {
                    "author_credibility": 0,
                    "engagement": 0,
                    "content_quality": 0,
                    "context": 0
                },
                "is_relevant": False,
                "flags": flags
            }
            
        # Calculate component scores
        author_score = self.score_author_credibility(post_data.get("author", {}))
        engagement_score = self.score_engagement(
            post_data.get("engagement", {}),
            post_data.get("indexed_at", "")
        )
        content_score = self.score_content_quality(post_data)
        context_score = self.score_context(
            post_data.get("content", {}),
            post_data.get("thread", {})
        )
        
        # Calculate total score
        total_score = sum([
            author_score,
            engagement_score,
            content_score,
            context_score
        ])
        
        return {
            "score": min(total_score, 100),  # Cap at 100
            "breakdown": {
                "author_credibility": author_score,
                "engagement": engagement_score,
                "content_quality": content_score,
                "context": context_score
            },
            "is_relevant": total_score >= self.min_threshold,
            "flags": flags
        }
    
    def score_author_credibility(self, author: Dict) -> int:
        """Score based on author profile (0-30 points)."""
        score = 0
        
        # Follower count (0-10 points)
        followers = author.get("followers_count", 0)
        if followers >= 5000:
            score += 10
        elif followers >= 1000:
            score += 8
        elif followers >= 500:
            score += 6
        elif followers >= 100:
            score += 4
        elif followers >= 10:
            score += 2
            
        # Account activity (0-10 points)
        posts = author.get("posts_count", 0)
        if posts >= 500:
            score += 10
        elif posts >= 100:
            score += 7
        elif posts >= 50:
            score += 5
        elif posts >= 10:
            score += 3
            
        # Follower ratio (0-10 points)
        following = author.get("following_count", 1)
        if following > 0:
            ratio = followers / following
            if 0.5 <= ratio <= 2.0:
                score += 10
            elif ratio > 2.0 and ratio <= 10:
                score += 8
            elif ratio > 10:
                score += 5
            elif ratio >= 0.1:
                score += 3
                
        return score
        
    def score_engagement(self, engagement: Dict, indexed_at: str) -> int:
        """Score based on engagement metrics (0-25 points)."""
        score = 0
        
        # Total engagement
        total = sum([
            engagement.get("likes", 0),
            engagement.get("reposts", 0),
            engagement.get("replies", 0)
        ])
        
        if total >= 50:
            score = 25
        elif total >= 25:
            score = 20
        elif total >= 10:
            score = 15
        elif total >= 5:
            score = 10
        elif total >= 1:
            score = 5
            
        # Engagement velocity bonus
        if indexed_at:
            try:
                post_time = datetime.fromisoformat(indexed_at.replace('Z', '+00:00'))
                age = (datetime.now() - post_time).total_seconds() / 3600  # Hours
                if age <= 1 and total >= 10:  # High engagement in first hour
                    score = min(score + 5, 25)
            except ValueError:
                pass
                
        return score
        
    def score_content_quality(self, post: Dict) -> int:
        """Score based on content quality (0-25 points)."""
        score = 0
        content = post.get("content", {})
        media = post.get("media", {})
        
        # Media score (0-10 points)
        if media.get("has_media", False):
            media_count = media.get("count", 0)
            if media_count >= 2:
                score += 10
            else:
                score += 7
                
        # External links (0-5 points)
        urls = content.get("external_urls", [])
        if urls:
            # TODO: Implement URL reputation checking
            score += 3
            if any(self._is_reputable_news_url(url) for url in urls):
                score += 2
                
        # Text length (0-5 points)
        text = content.get("text", "")
        length = len(text)
        if 50 <= length <= 200:
            score += 5
        elif length > 200:
            score += 4
        elif length >= 20:
            score += 2
            
        # Language (0-5 points)
        lang = content.get("language", "").lower()
        if lang == "en":
            score += 5
        elif lang in ["es", "fr", "de", "it", "pt", "ja", "ko", "zh"]:
            score += 3
            
        return score
        
    def score_context(self, content: Dict, thread: Dict) -> int:
        """Score based on context and metadata (0-20 points)."""
        score = 0
        
        # Hashtag relevance (0-10 points)
        hashtags = content.get("hashtags", [])
        if len(hashtags) > 5:
            score -= 5  # Penalty for hashtag spam
        elif len([h for h in hashtags if self._is_disaster_hashtag(h)]) > 1:
            score += 10
        elif any(self._is_disaster_hashtag(h) for h in hashtags):
            score += 5
            
        # Thread context (0-5 points)
        depth = thread.get("depth", 0)
        if depth == 0:
            score += 5
        elif depth == 1:
            score += 3
        else:
            score += 1
            
        # Mentions (0-5 points)
        mentions = content.get("mentions", [])
        if len(mentions) > 5:
            score -= 3  # Penalty for mention spam
        elif any(self._is_official_account(m) for m in mentions):
            score += 5
        elif 1 <= len(mentions) <= 2:
            score += 3
            
        return score
        
    def check_disqualifiers(self, post: Dict) -> List[str]:
        """Check for automatic disqualifiers."""
        flags = []
        
        # Check moderation status
        moderation = post.get("moderation", {})
        if moderation.get("labels"):
            flags.append("moderation_labels")
        if moderation.get("status") != "active":
            flags.append("inactive_status")
            
        # Check for deleted/removed content
        if post.get("deleted", False):
            flags.append("deleted")
            
        # TODO: Add more sophisticated checks for non-disaster related content
        
        return flags
        
    def _is_reputable_news_url(self, url: str) -> bool:
        """Helper to check if URL is from a reputable news source."""
        reputable_domains = [
            "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk",
            "nytimes.com", "theguardian.com", "bloomberg.com",
            "washingtonpost.com", "aljazeera.com"
        ]
        return any(domain in url.lower() for domain in reputable_domains)
        
    def _is_disaster_hashtag(self, hashtag: str) -> bool:
        """Helper to check if hashtag is disaster-related."""
        disaster_keywords = [
            "earthquake", "tsunami", "hurricane", "tornado", "flood",
            "wildfire", "disaster", "emergency", "evacuation", "rescue",
            "storm", "cyclone", "typhoon", "landslide", "volcanic",
            "drought", "blizzard", "avalanche"
        ]
        return any(keyword in hashtag.lower() for keyword in disaster_keywords)
        
    def _is_official_account(self, mention: str) -> bool:
        """Helper to check if mentioned account is official/authoritative."""
        official_handles = [
            "fema", "redcross", "noaa", "nhc", "nws", "usgs",
            "ready.gov", "cdcgov", "who", "weatherchannel"
        ]
        return any(handle in mention.lower() for handle in official_handles)