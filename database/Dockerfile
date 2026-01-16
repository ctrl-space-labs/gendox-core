FROM pgvector/pgvector:pg18-trixie

# Install Maven
RUN apt-get update && apt-get install -y maven

# Set the working directory
WORKDIR /usr/gendox-database

# Copy the application files
COPY . /usr/gendox-database

# copy flyway migrate script to postgres' image script execution folder
COPY docker-flyway-db-init.sh /docker-entrypoint-initdb.d/

# Change ownership to the postgres user and group

RUN chown -R postgres:postgres /usr/gendox-database

