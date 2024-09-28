# Alembic

Generic single-database configuration.

# 👣 Steps

<u>Step 1</u>: Auto-generate from SQLAlchemy models

```bash
alembic revision --autogenerate -m "<message>"
```

<u>Step 2</u>: Upgrade the specific revision

```bash
alembic upgrade {<revision_id>,head}
```

## 🎮 Commands

Display the current revision for a database:

```bash
alembic current
```

Show current available heads in the script directory:

```bash
alembic heads
```

## 💡 Trouble Shooting

Target database is not up to date:

```bash
alembic stamp head
```