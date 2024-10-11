FROM eclipse-temurin:17-jdk
VOLUME /tmp

# Copy the built JAR file from the local app.jar
COPY ./target/*.jar /gendox-core-api.jar

# Run the application
ENTRYPOINT ["java","-jar","/gendox-core-api.jar"]
