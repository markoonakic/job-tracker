#!/usr/bin/env python3
"""
PostgreSQL Availability Check Script

This script checks if PostgreSQL is available and properly configured
for running the job-tracker tests.
"""

import asyncio
import sys
from urllib.parse import urlparse

try:
    import asyncpg
except ImportError:
    print("ERROR: asyncpg is not installed")
    print("Install it with: pip install asyncpg")
    sys.exit(1)


async def check_postgresql(
    host: str = "localhost",
    port: int = 5432,
    user: str = "postgres",
    password: str = "postgres",
    database: str = "postgres"  # Connect to default database first
):
    """Check if PostgreSQL is available and accessible."""
    print(f"Checking PostgreSQL connection...")
    print(f"  Host: {host}")
    print(f"  Port: {port}")
    print(f"  User: {user}")
    print(f"  Database: {database}")
    print()

    try:
        # Try to connect
        conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            timeout=5
        )

        print("✓ Successfully connected to PostgreSQL")

        # Get version
        version = await conn.fetchval('SELECT version()')
        print(f"✓ PostgreSQL version: {version.split(',')[0]}")

        # Check if we can create databases
        has_createdb = await conn.fetchval(
            "SELECT rolcreatedb FROM pg_roles WHERE rolname = $1", user
        )
        if has_createdb:
            print(f"✓ User '{user}' has CREATE DATABASE privilege")
        else:
            print(f"⚠ User '{user}' does not have CREATE DATABASE privilege")
            print("  You may need to create the test database manually")

        # Close connection
        await conn.close()

        return True

    except asyncpg.exceptions.CannotConnectNowError:
        print("✗ Cannot connect to PostgreSQL")
        print("  Is PostgreSQL running?")
        print("  Start it with: brew services start postgresql@17")
        return False

    except asyncpg.exceptions.InvalidPasswordError:
        print("✗ Authentication failed")
        print("  Check the password in your connection string")
        return False

    except asyncpg.exceptions.InvalidCatalogNameError:
        print("✗ Database does not exist")
        print("  Connect to the default 'postgres' database first")
        return False

    except Exception as e:
        print(f"✗ Error: {type(e).__name__}: {e}")
        return False


async def check_database_exists(
    host: str = "localhost",
    port: int = 5432,
    user: str = "postgres",
    password: str = "postgres",
    database: str = "jobtracker_test"
):
    """Check if the test database exists."""
    print(f"\nChecking if database '{database}' exists...")

    try:
        # Connect to default database
        conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database="postgres"
        )

        # Check if database exists
        exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = $1)",
            database
        )

        if exists:
            print(f"✓ Database '{database}' exists")

            # Check if tables exist
            try:
                await conn.execute(f"SET search_path TO {database}")
                tables = await conn.fetch(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                )
                if tables:
                    print(f"  Tables found: {[t['tablename'] for t in tables]}")
                else:
                    print(f"  No tables found. Run migrations:")
                    print(f"    DATABASE_URL=\"postgresql+asyncpg://{user}:{password}@{host}:{port}/{database}\" alembic upgrade head")
            except Exception:
                pass
        else:
            print(f"✗ Database '{database}' does not exist")
            print(f"  Create it with:")
            print(f"    createdb -U {user} {database}")
            print(f"  Or:")
            print(f"    psql -U {user} -c \"CREATE DATABASE {database};\"")

        await conn.close()
        return exists

    except Exception as e:
        print(f"✗ Error checking database: {type(e).__name__}: {e}")
        return False


async def check_json_support(
    host: str = "localhost",
    port: int = 5432,
    user: str = "postgres",
    password: str = "postgres",
    database: str = "jobtracker_test"
):
    """Check if JSON type is supported."""
    print(f"\nChecking JSON support in '{database}'...")

    try:
        conn = await asyncpg.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )

        # Check for users table
        table_exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'users')"
        )

        if not table_exists:
            print("⚠ Users table does not exist. Run migrations first.")
            await conn.close()
            return False

        # Check for settings column
        column_exists = await conn.fetchval(
            """SELECT EXISTS(
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'settings'
               )"""
        )

        if column_exists:
            # Get the data type
            data_type = await conn.fetchval(
                """SELECT data_type FROM information_schema.columns
                WHERE table_name = 'users' AND column_name = 'settings'"""
            )
            print(f"✓ Settings column exists with type: {data_type}")

            if data_type in ('json', 'jsonb'):
                print(f"✓ JSON type is supported ({data_type})")
            else:
                print(f"⚠ Unexpected data type: {data_type}")
        else:
            print("⚠ Settings column does not exist")

        await conn.close()
        return True

    except Exception as e:
        print(f"✗ Error checking JSON support: {type(e).__name__}: {e}")
        return False


async def main():
    """Main check routine."""
    print("=" * 60)
    print("PostgreSQL Availability Check for Job-Tracker")
    print("=" * 60)
    print()

    # Check basic connectivity
    connected = await check_postgresql()

    if not connected:
        print("\n" + "=" * 60)
        print("POSTGRESQL IS NOT AVAILABLE")
        print("=" * 60)
        print("\nTo install PostgreSQL:")
        print("  brew install postgresql@17")
        print("  brew services start postgresql@17")
        print("\nOr use Docker:")
        print("  docker run --name jobtracker-postgres \\")
        print("    -e POSTGRES_USER=postgres \\")
        print("    -e POSTGRES_PASSWORD=postgres \\")
        print("    -e POSTGRES_DB=jobtracker_test \\")
        print("    -p 5432:5432 -d postgres:17-alpine")
        sys.exit(1)

    # Check test database
    db_exists = await check_database_exists()

    # Check JSON support if database exists
    if db_exists:
        await check_json_support()

    print("\n" + "=" * 60)
    print("PostgreSQL is ready for testing!")
    print("=" * 60)
    print("\nTo run tests with PostgreSQL:")
    print("  cd backend")
    print("  DATABASE_URL=\"postgresql+asyncpg://postgres:postgres@localhost:5432/jobtracker_test\" pytest tests/test_export.py -v")


if __name__ == "__main__":
    asyncio.run(main())
