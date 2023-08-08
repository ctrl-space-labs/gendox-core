-------------------------------------------------------------------------------
-- Creat APPLICATION role if it does not exist
DO
$$
    BEGIN
        IF NOT EXISTS(SELECT FROM pg_catalog.pg_roles WHERE rolname = 'application_role') THEN
            CREATE ROLE application_role;
        END IF;
    END
$$;

-- Grant privileges on all tables in each schema
DO
$$
    DECLARE
        schema_name_var TEXT;
    BEGIN
        FOR schema_name_var IN SELECT schema_name
                               FROM information_schema.schemata
                               WHERE schema_name NOT LIKE 'pg_%'
                                 AND schema_name != 'information_schema'
                               ORDER BY schema_name
            LOOP
                EXECUTE 'GRANT USAGE ON SCHEMA ' || schema_name_var || ' TO application_role';
                EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES ON ALL TABLES IN SCHEMA ' ||
                        schema_name_var || ' TO application_role';
                EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ' || schema_name_var || ' TO application_role';
                EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA ' || schema_name_var ||
                        ' GRANT SELECT, INSERT, UPDATE, DELETE, REFERENCES ON TABLES TO application_role';
                EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA ' || schema_name_var ||
                        ' GRANT EXECUTE ON FUNCTIONS TO application_role';
            END LOOP;
    END
$$;

-------------------------------------------------------------------------------------
-- Create READ-ONLY role if it does not exist
DO
$$
    BEGIN
        IF NOT EXISTS(SELECT FROM pg_catalog.pg_roles WHERE rolname = 'readonly_role') THEN
            CREATE ROLE readonly_role;
        END IF;
    END
$$;

-- Grant SELECT privileges to all existing schemas and tables to the readonly_role role
DO
$$
    DECLARE
        schema_name_var TEXT;
        table_name_var  TEXT;
    BEGIN
        FOR schema_name_var, table_name_var IN
            SELECT table_schema, table_name
            FROM information_schema.tables
            WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
              AND table_type = 'BASE TABLE'
            LOOP
                IF schema_name_var IS NOT NULL AND table_name_var IS NOT NULL THEN
                    EXECUTE format('GRANT SELECT ON TABLE %I.%I TO readonly_role', schema_name_var, table_name_var);
                END IF;
            END LOOP;
    END;
$$;

-- -- Create users if they do not exist
-- -- Never create users here since this is going to be public, this is just an example
-- DO
-- $$
--     BEGIN
--         IF NOT EXISTS(SELECT FROM pg_user WHERE usename = 'admin_user') THEN
--             CREATE USER admin_user PASSWORD 'a_strong_password';
--         END IF;
--         IF NOT EXISTS(SELECT FROM pg_user WHERE usename = 'be_user') THEN
--             CREATE USER be_user PASSWORD 'a_strong_password';
--         END IF;
--         IF NOT EXISTS(SELECT FROM pg_user WHERE usename = 'read_only_user1') THEN
--             CREATE USER read_only_user1 PASSWORD 'a_strong_password';
--         END IF;
--         IF NOT EXISTS(SELECT FROM pg_user WHERE usename = 'read_only_user2') THEN
--             CREATE USER read_only_user2 PASSWORD 'a_strong_password';
--         END IF;
--     END;
-- $$;
--
--
-- GRANT admin_role TO admin_user WITH ADMIN OPTION ;
--
-- GRANT application_role TO be_user;
--
-- GRANT readonly_role TO read_only_user1, read_only_user2;
