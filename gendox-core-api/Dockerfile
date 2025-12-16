FROM eclipse-temurin:25-jdk-alpine
VOLUME /tmp

# Copy the built JAR file from the local app.jar
COPY ./target/*.jar /gendox-core-api.jar

# Run the application
ENTRYPOINT ["java","-jar","/gendox-core-api.jar"]
