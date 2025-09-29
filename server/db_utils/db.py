import mysql.connector
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def get_db_connection():
    """Get database connection using environment variables"""
    try:
        connection = mysql.connector.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            database=os.getenv('DB_NAME', 'bluerelief'),
            user=os.getenv('DB_USER', 'root'),
            password=os.getenv('DB_PASSWORD', ''),
            port=int(os.getenv('DB_PORT', 3306))
        )
        return connection
    except mysql.connector.Error as err:
        logger.error(f"Error connecting to database: {err}")
        return None

def log_user(user_id: str, user_email: str, user_name: str, user_pic: str, first_logged_in: datetime, last_accessed: datetime):
    """Log user information to database"""
    try:
        connection = get_db_connection()
        if connection is None:
            logger.error("Could not establish database connection")
            return
        
        cursor = connection.cursor()
        
        # Check if user exists
        check_query = "SELECT user_id FROM users WHERE user_id = %s"
        cursor.execute(check_query, (user_id,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            # Update existing user
            update_query = """
                UPDATE users 
                SET user_email = %s, user_name = %s, user_pic = %s, last_accessed = %s 
                WHERE user_id = %s
            """
            cursor.execute(update_query, (user_email, user_name, user_pic, last_accessed, user_id))
            logger.info(f"Updated existing user: {user_email}")
        else:
            # Insert new user
            insert_query = """
                INSERT INTO users (user_id, user_email, user_name, user_pic, first_logged_in, last_accessed) 
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, (user_id, user_email, user_name, user_pic, first_logged_in, last_accessed))
            logger.info(f"Created new user: {user_email}")
        
        connection.commit()
        
    except mysql.connector.Error as err:
        logger.error(f"Database error in log_user: {err}")
    except Exception as e:
        logger.error(f"Unexpected error in log_user: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()

def log_token(access_token: str, user_email: str, session_id: str):
    """Log token information to database"""
    try:
        connection = get_db_connection()
        if connection is None:
            logger.error("Could not establish database connection")
            return
        
        cursor = connection.cursor()
        
        # Insert token log
        insert_query = """
            INSERT INTO user_tokens (access_token, user_email, session_id, created_at) 
            VALUES (%s, %s, %s, %s)
        """
        cursor.execute(insert_query, (access_token, user_email, session_id, datetime.utcnow()))
        
        connection.commit()
        logger.info(f"Logged token for user: {user_email}")
        
    except mysql.connector.Error as err:
        logger.error(f"Database error in log_token: {err}")
    except Exception as e:
        logger.error(f"Unexpected error in log_token: {e}")
    finally:
        if connection and connection.is_connected():
            cursor.close()
            connection.close()
