from alembic import context
from alembic.runtime.migration import MigrationContext, MigrationInfo
from sqlalchemy import engine_from_config, pool, text
from src.database import SQLALCHEMY_DATABASE_URI, metadata

# Alembic Config object, which provides access to the values within the `.ini` file in use.
config = context.config
config.set_main_option(name="sqlalchemy.url", value=SQLALCHEMY_DATABASE_URI)


def include_name(name: str, type_: str, **kwargs) -> bool:
    """Prevent auto generated migrations to delete the newly created table

    Reference:
    - https://stackoverflow.com/questions/73248731/alembic-store-extra-information-in-alembic-version-table
    """
    if type_ == "table" and name == "alembic_version_history":
        return False

    return True


def update_history(ctx: MigrationContext, step: MigrationInfo, **kwargs) -> None:
    revision_id = step.up_revision_id

    if step.is_upgrade:
        message = step.up_revision.doc
        # Ensure that single quotes in the message are escaped properly
        message = message.replace("'", "''")

        sql_command = text(
            "INSERT INTO alembic_version_history (version_num, message, applied_at) VALUES (:revision_id, :message, NOW())"
        )
        ctx.connection.execute(
            sql_command, {"revision_id": revision_id, "message": message}
        )
    else:
        sql_command = text(
            "DELETE FROM alembic_version_history WHERE version_num = :revision_id"
        )
        ctx.connection.execute(sql_command, {"revision_id": revision_id})


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        literal_binds=True,
        target_metadata=metadata,
        dialect_opts={"paramstyle": "named"},
        include_name=include_name,
        on_version_apply=update_history,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=metadata,
            include_name=include_name,
            on_version_apply=update_history,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
