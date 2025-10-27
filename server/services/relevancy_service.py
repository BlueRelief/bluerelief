from typing import List, Dict
from services.relevancy_scorer import RelevancyScorer
from db_utils.db import Post, get_db_session
import logging

logger = logging.getLogger(__name__)

class RelevancyService:
    def __init__(self):
        self.scorer = RelevancyScorer()
        
    def process_posts(self, posts_data: List[Dict]) -> List[Dict]:
        """Process a batch of posts and calculate relevancy scores."""
        processed_posts = []
        
        for post_data in posts_data:
            try:
                relevancy = self.scorer.calculate_score(post_data)
                post_data["relevancy_score"] = relevancy["score"]
                post_data["relevancy_breakdown"] = relevancy["breakdown"]
                post_data["relevancy_flags"] = relevancy["flags"]
                post_data["is_relevant"] = relevancy["is_relevant"]
                processed_posts.append(post_data)
            except Exception as e:
                logger.error(f"Error calculating relevancy for post: {e}")
                # Skip failed posts but continue processing others
                continue
                
        return processed_posts
        
    def update_post_relevancy(self, post_id: int) -> bool:
        """Update relevancy score for an existing post."""
        try:
            db = get_db_session()
            if not db:
                return False
                
            post = db.query(Post).filter(Post.id == post_id).first()
            if not post:
                return False
                
            # Reconstruct post data for scoring
            post_data = {
                "author": {
                    "handle": post.author_handle,
                    "display_name": post.author_display_name,
                    "description": post.author_description,
                    "followers_count": post.author_followers_count,
                    "following_count": post.author_following_count,
                    "posts_count": post.author_posts_count
                },
                "engagement": {
                    "likes": post.like_count,
                    "reposts": post.repost_count,
                    "replies": post.reply_count
                },
                "content": {
                    "text": post.text,
                    "hashtags": post.hashtags,
                    "mentions": post.mentions,
                    "external_urls": post.external_urls,
                    "language": post.language
                },
                "media": {
                    "has_media": post.has_media,
                    "count": post.media_count,
                    "urls": post.media_urls
                },
                "moderation": {
                    "labels": post.content_labels,
                    "warnings": post.content_warnings,
                    "status": post.moderation_status
                },
                "thread": {
                    "parent_uri": post.reply_to_post_id,
                    "root_uri": post.reply_root_post_id,
                    "depth": post.thread_depth
                },
                "indexed_at": post.indexed_at.isoformat() if post.indexed_at else None
            }
            
            # Calculate new relevancy
            relevancy = self.scorer.calculate_score(post_data)
            
            # Update post
            post.relevancy_score = relevancy["score"]
            post.relevancy_breakdown = relevancy["breakdown"]
            post.relevancy_flags = relevancy["flags"]
            post.is_relevant = relevancy["is_relevant"]
            
            db.commit()
            return True
            
        except Exception as e:
            logger.error(f"Error updating post relevancy: {e}")
            if db:
                db.rollback()
            return False
            
        finally:
            if db:
                db.close()
                
    def recalculate_all_posts(self, batch_size: int = 100) -> Dict:
        """Recalculate relevancy scores for all posts in the database."""
        try:
            db = get_db_session()
            if not db:
                return {"success": False, "message": "Database connection failed"}
                
            total_posts = db.query(Post).count()
            processed = 0
            failed = 0
            
            # Process in batches
            for offset in range(0, total_posts, batch_size):
                posts = db.query(Post).offset(offset).limit(batch_size).all()
                
                for post in posts:
                    try:
                        success = self.update_post_relevancy(post.id)
                        if success:
                            processed += 1
                        else:
                            failed += 1
                    except Exception as e:
                        logger.error(f"Error processing post {post.id}: {e}")
                        failed += 1
                        continue
                
            return {
                "success": True,
                "total": total_posts,
                "processed": processed,
                "failed": failed
            }
            
        except Exception as e:
            logger.error(f"Error in recalculate_all_posts: {e}")
            return {"success": False, "message": str(e)}
            
        finally:
            if db:
                db.close()