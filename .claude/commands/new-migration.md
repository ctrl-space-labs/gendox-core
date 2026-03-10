Create a new Flyway database migration file.

The user wants to create a migration for: $ARGUMENTS

Follow these steps:
1. Check the latest migration version in `database/src/main/resources/db/migrations/gendox-core/` to determine the next version number
2. Use the naming convention: `V[YYYYMMDD]_[HHMMSS]__Description.sql` (use today's date and current time)
3. Create the migration file with proper SQL
4. Follow existing migration patterns - check similar migrations for reference
5. Include rollback considerations as SQL comments

Important:
- Use `gendox_core` schema
- Use UUID primary keys with `uuid_generate_v4()` default
- Reference existing tables and types from the schema
- Add appropriate indexes for query patterns
