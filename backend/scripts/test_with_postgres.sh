#!/bin/bash
# Run tests with PostgreSQL backend
#
# This script provides convenient shortcuts for running tests against PostgreSQL
# instead of the default SQLite backend.

set -e

# Configuration
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-jobtracker_test}"

# Build connection string
DATABASE_URL="postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is available
check_postgres() {
    print_info "Checking PostgreSQL availability..."

    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL client (psql) not found"
        print_info "Install with: brew install postgresql@17"
        exit 1
    fi

    if ! pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" &> /dev/null; then
        print_error "Cannot connect to PostgreSQL at $POSTGRES_HOST:$POSTGRES_PORT"
        print_info "Start PostgreSQL with: brew services start postgresql@17"
        exit 1
    fi

    print_info "PostgreSQL is available ✓"
}

# Create test database if it doesn't exist
ensure_database() {
    print_info "Ensuring database '$POSTGRES_DB' exists..."

    if psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
        print_info "Database '$POSTGRES_DB' already exists"
    else
        print_info "Creating database '$POSTGRES_DB'..."
        createdb -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" "$POSTGRES_DB"
        print_info "Database created ✓"
    fi
}

# Run migrations
run_migrations() {
    print_info "Running migrations..."

    cd backend

    DATABASE_URL="$DATABASE_URL" alembic upgrade head

    print_info "Migrations completed ✓"
}

# Run tests
run_tests() {
    print_info "Running tests with PostgreSQL..."
    echo

    cd backend

    DATABASE_URL="$DATABASE_URL" pytest "$@"

    echo
    print_info "Tests completed ✓"
}

# Main script
main() {
    echo "=================================================="
    echo "PostgreSQL Test Runner for Job-Tracker"
    echo "=================================================="
    echo
    print_info "Configuration:"
    echo "  Host: $POSTGRES_HOST"
    echo "  Port: $POSTGRES_PORT"
    echo "  User: $POSTGRES_USER"
    echo "  Database: $POSTGRES_DB"
    echo

    # Parse command line arguments
    case "${1:-test}" in
        check)
            check_postgres
            ;;
        migrate)
            check_postgres
            ensure_database
            run_migrations
            ;;
        test)
            check_postgres
            run_tests "${@:2}"
            ;;
        full)
            check_postgres
            ensure_database
            run_migrations
            run_tests "${@:2}"
            ;;
        *)
            echo "Usage: $0 {check|migrate|test|full} [pytest options...]"
            echo
            echo "Commands:"
            echo "  check   - Check if PostgreSQL is available"
            echo "  migrate - Run migrations against PostgreSQL"
            echo "  test    - Run tests with PostgreSQL"
            echo "  full    - Run migrations and tests"
            echo
            echo "Environment variables:"
            echo "  POSTGRES_HOST     - PostgreSQL host (default: localhost)"
            echo "  POSTGRES_PORT     - PostgreSQL port (default: 5432)"
            echo "  POSTGRES_USER     - PostgreSQL user (default: postgres)"
            echo "  POSTGRES_PASSWORD - PostgreSQL password (default: postgres)"
            echo "  POSTGRES_DB       - PostgreSQL database (default: jobtracker_test)"
            echo
            echo "Examples:"
            echo "  $0 check                              # Check PostgreSQL availability"
            echo "  $0 test tests/test_export.py -v      # Run export tests"
            echo "  $0 full tests/ -v                    # Run all tests with migrations"
            exit 1
            ;;
    esac
}

main "$@"
