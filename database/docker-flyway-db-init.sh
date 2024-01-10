#!/bin/bash

# Set environment variables for PostgreSQL
export POSTGRES_DB=${POSTGRES_DB:-default_db}
export POSTGRES_USER=${POSTGRES_USER:-default_user}
export POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-default_password}

# Set environment variables for Flyway
export FLYWAY_URL=jdbc:postgresql://localhost:5432/${POSTGRES_DB}
export FLYWAY_USER=${POSTGRES_USER}
export FLYWAY_PASSWORD=${POSTGRES_PASSWORD}

echo '----    Restarting DB to enable IPv4 database listener    ----'
pg_ctl -D "$PGDATA" -m fast -w stop
pg_ctl -D "$PGDATA" \
            -o "-c listen_addresses='localhost'" \
            -w start
echo '-----------------    Restart complete    ---------------------'

mvn clean install flyway:migrate

