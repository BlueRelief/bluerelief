"""
Schema validation tool to detect drift between ORM models and database
This ensures your database schema matches your SQLAlchemy ORM definitions
"""

from sqlalchemy import inspect, text, MetaData
from db_utils.db import engine, Base
import logging

logger = logging.getLogger(__name__)


def get_orm_schema():
    """Get the expected schema from ORM models (Base.metadata)"""
    schema = {}
    for table_name, table in Base.metadata.tables.items():
        columns = {}
        for col in table.columns:
            columns[col.name] = {
                "type": str(col.type),
                "nullable": col.nullable,
                "primary_key": col.primary_key,
                "unique": col.unique,
            }
        schema[table_name] = {
            "columns": columns,
            "indexes": [str(idx) for idx in table.indexes],
        }
    return schema


def get_db_schema():
    """Get the actual schema from the database"""
    inspector = inspect(engine)
    schema = {}

    for table_name in inspector.get_table_names():
        columns = {}
        for col in inspector.get_columns(table_name):
            columns[col["name"]] = {
                "type": str(col["type"]),
                "nullable": col["nullable"],
                "primary_key": False,
                "unique": col.get("unique", False),
            }

        # Get primary key
        pk = inspector.get_pk_constraint(table_name)
        for pk_col in pk.get("constrained_columns", []):
            columns[pk_col]["primary_key"] = True

        # Get indexes
        indexes = inspector.get_indexes(table_name)
        index_list = [f"{idx['name']}: {idx['column_names']}" for idx in indexes]

        schema[table_name] = {
            "columns": columns,
            "indexes": index_list,
        }

    return schema


def validate_schema():
    """
    Compare ORM schema with database schema
    Returns: (is_valid, differences)
    """
    orm_schema = get_orm_schema()
    db_schema = get_db_schema()
    differences = []

    # Check for tables in ORM but not in DB
    for table_name in orm_schema:
        if table_name not in db_schema:
            differences.append(f"❌ Table '{table_name}' missing in database")
        else:
            orm_cols = orm_schema[table_name]["columns"]
            db_cols = db_schema[table_name]["columns"]

            # Check for columns in ORM but not in DB
            for col_name in orm_cols:
                if col_name not in db_cols:
                    differences.append(
                        f"❌ Column '{table_name}.{col_name}' missing in database"
                    )

            # Check for columns in DB but not in ORM (orphaned)
            for col_name in db_cols:
                if col_name not in orm_cols:
                    differences.append(
                        f"⚠️  Column '{table_name}.{col_name}' in database but not in ORM"
                    )

    is_valid = len([d for d in differences if d.startswith("❌")]) == 0

    return is_valid, differences


def print_schema_report():
    """Print a detailed schema validation report"""
    print("\n" + "=" * 70)
    print("📊 DATABASE SCHEMA VALIDATION REPORT")
    print("=" * 70)

    is_valid, differences = validate_schema()

    if not differences:
        print("✅ Schema is in perfect sync!\n")
        return True

    if differences:
        print("\nIssues Found:")
        print("-" * 70)
        for diff in differences:
            print(f"  {diff}")

    print("\n" + "=" * 70)

    if not is_valid:
        print("❌ CRITICAL: Schema drift detected!")
        print("   Run: alembic revision --autogenerate -m 'fix schema'\n")
    else:
        print("✅ No critical issues (only orphaned objects)\n")

    return is_valid
