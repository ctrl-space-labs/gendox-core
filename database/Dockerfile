FROM ghcr.io/pgmq/pg18-pgmq:v1.8.0 AS pgmq_src

FROM pgvector/pgvector:pg18-trixie

# copy extension .so + control/sql files
COPY --from=pgmq_src /usr/lib/postgresql/18/lib/ /usr/lib/postgresql/18/lib/
COPY --from=pgmq_src /usr/share/postgresql/18/extension/ /usr/share/postgresql/18/extension/

# Install Maven
RUN apt-get update && apt-get install -y --no-install-recommends maven && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/gendox-database

# Copy the application files
COPY . /usr/gendox-database

# copy flyway migrate script to postgres' image script execution folder
COPY docker-flyway-db-init.sh /docker-entrypoint-initdb.d/
COPY <<'SQL' /docker-entrypoint-initdb.d/05_create_pgmq.sql
CREATE EXTENSION IF NOT EXISTS pgmq;
SQL
RUN chown -R postgres:postgres /usr/gendox-database
