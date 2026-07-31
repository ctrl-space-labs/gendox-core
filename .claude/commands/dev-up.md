Start the local development environment using Docker Compose.

Run `docker-compose -f gendox-compose-scripts/dev-ci-installation/docker-compose.yml up -d` to start all services.

Then check the status with `docker-compose -f gendox-compose-scripts/dev-ci-installation/docker-compose.yml ps`.

Report which services are running and their health status.

Service URLs:
- API: http://localhost:8080/gendox/api/v1
- Frontend: http://localhost:3000
- Keycloak: https://localhost:8443
- Database: localhost:5432
