# Alembic

Generic single-database configuration.

# Commands

Create a new revision:

```bash
alembic revision -m "<message>"
```

Display the current revision for a database:

```bash
alembic current
```

Show current available heads in the script directory:

```bash
alembic heads
```

Upgrade the specific revision:

```bash
alembic upgrade {<revision_id>,head}
```

Auto-generate from SQLAlchemy models:

```bash
alembic revision --autogenerate -m "<message>"
```
