"""seed_history_for_existing_applications

Revision ID: 823286b57444
Revises: a5dc88e4b7b6
Create Date: 2026-01-29 10:39:00.321470

"""
from typing import Sequence, Union
import uuid
import random
from datetime import datetime, timedelta

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import table, column


# revision identifiers, used by Alembic.
revision: str = '823286b57444'
down_revision: Union[str, Sequence[str], None] = 'a5dc88e4b7b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def get_status_journey(current_status_name: str, statuses: dict) -> list:
    """
    Generate a realistic status journey from 'Applied' to the current status.

    Args:
        current_status_name: The final status of the application
        statuses: Dictionary mapping status names to their IDs

    Returns:
        List of status names representing the journey
    """
    journey = ['Applied']

    # Define intermediate statuses based on the final status
    if current_status_name == 'Applied':
        return journey
    elif current_status_name == 'Screening':
        journey.append('Screening')
    elif current_status_name == 'Interviewing':
        journey.extend(['Screening', 'Interviewing'])
    elif current_status_name == 'Offer':
        journey.extend(['Screening', 'Interviewing', 'Offer'])
    elif current_status_name == 'Accepted':
        journey.extend(['Screening', 'Interviewing', 'Offer', 'Accepted'])
    elif current_status_name == 'Rejected':
        # Rejection can happen at various stages, add Interviewing for variety
        journey.extend(['Screening', 'Interviewing', 'Rejected'])
    elif current_status_name == 'Withdrawn':
        # Withdrawn can happen at various stages
        journey.extend(['Withdrawn'])
    elif current_status_name == 'No Reply':
        journey.extend(['No Reply'])
    elif current_status_name == 'On Hold':
        journey.extend(['Screening', 'On Hold'])
    else:
        # For custom statuses, just go from Applied to current
        journey.append(current_status_name)

    return journey


def distribute_timestamps(created_at: datetime, now: datetime, num_steps: int) -> list:
    """
    Distribute timestamps between created_at and now.

    Args:
        created_at: When the application was created
        now: Current time
        num_steps: Number of timestamps to generate

    Returns:
        List of datetime objects sorted in ascending order
    """
    if num_steps <= 1:
        return [created_at]

    total_seconds = (now - created_at).total_seconds()
    timestamps = []

    for i in range(num_steps):
        # Use random distribution with bias towards earlier times
        progress = (i + 1) / num_steps
        # Add some randomness (±20% of the interval)
        random_offset = random.uniform(-0.2, 0.2) / num_steps
        progress = max(0, min(1, progress + random_offset))

        seconds_offset = total_seconds * progress
        timestamp = created_at + timedelta(seconds=seconds_offset)
        timestamps.append(timestamp)

    return sorted(timestamps)


def upgrade() -> None:
    """Upgrade schema."""
    conn = op.get_bind()

    # Check if migration has already been run (applications have history)
    check_query = sa.text("""
        SELECT COUNT(*) FROM applications a
        LEFT JOIN application_status_history ash ON a.id = ash.application_id
        WHERE ash.id IS NULL
    """)
    result = conn.execute(check_query).scalar()

    if result == 0:
        # All applications already have history, nothing to do
        return

    # Get all statuses
    statuses_query = sa.text("""
        SELECT id, name FROM application_statuses ORDER BY name
    """)
    status_rows = conn.execute(statuses_query).fetchall()
    statuses = {row.name: row.id for row in status_rows}

    # Get all applications without history
    applications_query = sa.text("""
        SELECT id, status_id, created_at
        FROM applications
        WHERE id NOT IN (SELECT DISTINCT application_id FROM application_status_history)
        ORDER BY created_at DESC
    """)
    applications = conn.execute(applications_query).fetchall()

    if not applications:
        return

    # Get current time for timestamp distribution
    now = datetime.utcnow()

    # Prepare bulk insert data
    history_entries = []

    for app in applications:
        # Get the current status name
        current_status_query = sa.text("""
            SELECT name FROM application_statuses WHERE id = :status_id
        """)
        current_status_row = conn.execute(
            current_status_query,
            {'status_id': app.status_id}
        ).fetchone()

        if not current_status_row:
            continue

        current_status_name = current_status_row.name

        # Generate the status journey
        journey = get_status_journey(current_status_name, statuses)

        # Parse created_at if it's a string, otherwise use as-is
        created_at = app.created_at
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))

        # Distribute timestamps
        timestamps = distribute_timestamps(created_at, now, len(journey))

        # Create history entries
        for i, status_name in enumerate(journey):
            from_status_id = None if i == 0 else statuses[journey[i - 1]]
            to_status_id = statuses[status_name]
            changed_at = timestamps[i]

            history_entries.append({
                'id': str(uuid.uuid4()),
                'application_id': app.id,
                'from_status_id': from_status_id,
                'to_status_id': to_status_id,
                'changed_at': changed_at,
                'note': None
            })

    # Bulk insert history entries
    if history_entries:
        history_table = table(
            'application_status_history',
            column('id'),
            column('application_id'),
            column('from_status_id'),
            column('to_status_id'),
            column('changed_at'),
            column('note')
        )

        conn.execute(history_table.insert().values(history_entries))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove all history entries that were created by this migration
    # Since we can't distinguish them, we'll remove all history for applications
    # that might have been seeded (applications created before this migration)
    pass
