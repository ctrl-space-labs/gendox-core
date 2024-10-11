# Stage 1: Use an image with jq pre-installed
FROM alpine:3.18 as builder

# Install jq in the builder image
RUN apk add --no-cache jq

# Use Keycloak 25.0.4 base image from Docker Hub
FROM quay.io/keycloak/keycloak:25.0.4

# Work directory for Keycloak
WORKDIR /opt/keycloak

# Copy jq binary from the builder stage
COPY --from=builder /usr/bin/jq /usr/bin/jq

USER root

# Copy custom theme to Keycloak themes directory
COPY ./themes /opt/keycloak/themes/

# Create a new directory
RUN mkdir -p /opt/keycloak/custom-conf

# Copy initialization script
COPY ./conf/gendox-local-init.sh /opt/keycloak/custom-conf/gendox-local-init.sh

# Switch to root to set executable permissions, then switch back
# Set executable permissions on custom scripts
RUN chmod +x /opt/keycloak/bin/kcadm.sh
RUN chmod +x /opt/keycloak/custom-conf/gendox-local-init.sh
USER keycloak

# Build Keycloak (optimized for faster start-up in production)
RUN /opt/keycloak/bin/kc.sh build

# Set up Keycloak with development mode enabled
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]



