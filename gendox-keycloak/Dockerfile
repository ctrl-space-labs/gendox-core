# Use Keycloak 25.0.4 base image from Docker Hub
FROM quay.io/keycloak/keycloak:25.0.4

# Work directory for Keycloak
WORKDIR /opt/keycloak

# Copy custom theme to Keycloak themes directory
COPY ./themes /opt/keycloak/themes/

# Build Keycloak (optimized for faster start-up in production)
RUN /opt/keycloak/bin/kc.sh build

# Set up Keycloak with development mode enabled
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]



