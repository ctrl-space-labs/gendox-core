FROM maven:3.8.4-openjdk-17 AS builder

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

# Copy AWS credentials
COPY /root/.aws/credentials /root/.aws/credentials

ENTRYPOINT ["java","-jar","/app.jar"]
