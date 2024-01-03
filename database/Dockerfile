FROM ankane/pgvector:latest

# Install Maven
RUN apt-get update && apt-get install -y maven

# Set the working directory
WORKDIR /usr

# Copy the application files
COPY . /usr

# Build the Flyway artifacts
RUN mvn clean install -DskipTests

# Environment variables for PostgreSQL
ENV POSTGRES_DB=mydb
ENV POSTGRES_USER=mydb
ENV POSTGRES_PASSWORD=mypassword

# Create a script to create PostgreSQL role and grant permissions
# RUN echo "CREATE ROLE $POSTGRES_USER WITH LOGIN PASSWORD '$POSTGRES_PASSWORD';" > /docker-entrypoint-initdb.d/init.sql \
#     && echo "GRANT ALL PRIVILEGES ON DATABASE $POSTGRES_DB TO $POSTGRES_USER;" >> /docker-entrypoint-initdb.d/init.sql

# Environment variables for Flyway
ENV FLYWAY_URL=jdbc:postgresql://localhost:5432/mydb
ENV FLYWAY_USER=mydb
ENV FLYWAY_PASSWORD=mypassword

# Expose the PostgreSQL port
# EXPOSE 5432:5432

CMD ["mvn", "flyway:migrate"]

# RUN mvn clean install -DskipTests
# RUN sh -c until nc -z localhost 5432; do echo Waiting for PostgreSQL; sleep 1; done && mvn flyway:migrate

# ENTRYPOINT ["mvn", "clean", "install", "-DskipTests", "flyway:migrate"]

# CMD ["mvn", "clean", "install", "-DskipTests", "flyway:migrate", "-Durl:jdbc:postgresql://localhost:5432/mydb", "-Duser:myuser", "-Dpassword:mypassword"]

# Run Flyway migration on container startup
# Add a delay before running Flyway
# CMD ["sh", "-c", "sleep 30 && mvn flyway:migrate"]

# Wait for PostgreSQL to be ready, then run Flyway migration
# CMD ["sh", "-c", "until nc -z localhost 5432; do echo Waiting for PostgreSQL; sleep 1; done && mvn flyway:migrate"]

# Wait for PostgreSQL to be ready, then run Flyway migration
# CMD ["sh", "-c", "until command -v ncat > /dev/null 2>&1 || command -v nc > /dev/null 2>&1 && (nc -z localhost 5432 || ncat -z localhost 5432); do echo Waiting for PostgreSQL; sleep 1; done && mvn flyway:migrate"]

# -Durl:jdbc:postgresql://localhost:5432/mydb -Duser:myuser -Dpassword:mypassword