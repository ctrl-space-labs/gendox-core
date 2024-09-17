
FROM eclipse-temurin:17-jdk

# Copy the built JAR file from the builder stage
COPY ./target/*.jar /gendox-core-api.jar

# Run the application
ENTRYPOINT ["java","-jar","/gendox-core-api.jar"]
