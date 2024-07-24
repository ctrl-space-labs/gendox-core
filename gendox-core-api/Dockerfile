FROM maven:3.8.4-openjdk-17 AS builder

WORKDIR /app

# Set build arguments for Git repository and token
ARG GIT_REPOSITORY
ARG GIT_BRANCH

# Clone the private repository using the token
RUN git clone -b ${GIT_BRANCH} https://${GIT_REPOSITORY} /proven-ai

# Navigate to the private repository directory and run Maven install
WORKDIR /proven-ai/provenai-sdk
RUN ls -la && mvn clean install -DskipTests

# Go back to the app directory
WORKDIR /app

# Copy only the POM file to download dependencies
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline

# Copy the rest of the application source code
COPY src src

# Build the application
RUN mvn clean install -DskipTests

# Final image
FROM eclipse-temurin:17-jdk
VOLUME /tmp

# Copy the built JAR file from the builder stage
COPY --from=builder /app/target/*.jar /app.jar



ENTRYPOINT ["java","-jar","/app.jar"]
