FROM ankane/pgvector:latest

# Install Maven
RUN apt-get update && apt-get install -y maven

# Set the working directory
WORKDIR /usr/gendox-database

# Copy the application files
COPY . /usr/gendox-database
# copy flyway migrate script to postgres' image script execution folder
COPY docker-flyway-db-init.sh /docker-entrypoint-initdb.d/


# Build the Flyway artifacts
#RUN mvn clean install -DskipTests

# Change ownership to the postgres user and group
RUN chown -R postgres:postgres /usr/gendox-database

# Environment variables for PostgreSQL
ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=myuser
ENV POSTGRES_PASSWORD=mypassword

# Create a script to create PostgreSQL role and grant permissions
# RUN echo "CREATE ROLE $POSTGRES_USER WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';" > /docker-entrypoint-initdb.d/init.sql \
#     && echo "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" >> /docker-entrypoint-initdb.d/init.sql

# Environment variables for Flyway
ENV FLYWAY_URL=jdbc:postgresql://localhost:5432/$POSTGRES_DB
ENV FLYWAY_USER=$POSTGRES_USER
ENV FLYWAY_PASSWORD=$POSTGRES_PASSWORD
