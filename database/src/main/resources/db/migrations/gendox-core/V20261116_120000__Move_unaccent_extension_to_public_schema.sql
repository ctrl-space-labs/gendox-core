-- Name search (DocumentPredicates, TaskPredicates) calls unaccent() without a schema, and the API's
-- search_path is "$user", public. V20251126_120610 created the extension in the migration's schema,
-- gendox_core, on a database that did not have it yet, so there the function is not found.
-- Same as V20240419_131410 did for uuid-ossp. Safe to run again: it changes nothing once unaccent is in public.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'unaccent') THEN
        CREATE EXTENSION unaccent SCHEMA public;
    ELSIF (SELECT extnamespace::regnamespace::text FROM pg_extension WHERE extname = 'unaccent') <> 'public' THEN
        ALTER EXTENSION unaccent SET SCHEMA public;
    END IF;
END
$$;
