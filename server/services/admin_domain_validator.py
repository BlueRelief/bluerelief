import os
from typing import List, Set


class AdminDomainValidator:
    def __init__(self):
        self.enabled = os.getenv('ADMIN_DOMAIN_CHECK_ENABLED', 'true').lower() == 'true'

        # Parse allowed domains from env (comma-separated)
        domains_str = os.getenv('ADMIN_ALLOWED_DOMAINS', 'bluerelief.com')
        self.allowed_domains: Set[str] = set(
            domain.strip().lower()
            for domain in domains_str.split(',')
            if domain.strip()
        )

        # Parse exception emails from env (comma-separated)
        exceptions_str = os.getenv('ADMIN_EXCEPTION_EMAILS', '')
        self.exception_emails: Set[str] = set(
            email.strip().lower()
            for email in exceptions_str.split(',')
            if email.strip()
        )

    def is_valid_admin_email(self, email: str) -> bool:
        """Check if email is allowed for admin access"""
        if not self.enabled:
            return True

        if not email:
            return False

        email_lower = email.lower().strip()

        if email_lower in self.exception_emails:
            return True

        if '@' not in email_lower:
            return False

        parts = email_lower.split('@')
        if len(parts) != 2:
            return False

        domain = parts[1]

        return domain in self.allowed_domains

    def get_allowed_domains(self) -> List[str]:
        """Get list of allowed domains"""
        return list(self.allowed_domains)

    def get_exception_emails(self) -> List[str]:
        """Get list of exception emails (admin only)"""
        return list(self.exception_emails)


# Singleton instance
domain_validator = AdminDomainValidator()
