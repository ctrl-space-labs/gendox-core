# FROM eclipse-temurin:17-jdk-alpine
FROM maven:3.9.6-eclipse-temurin-17
VOLUME /tmp

WORKDIR /usr
COPY ./ ./

ENTRYPOINT ["mvn", "clean", "install", "-DskipTests", "flyway:migrate"]
