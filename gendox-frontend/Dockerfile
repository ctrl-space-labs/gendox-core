# Stage 1: Build the Next.js static site
FROM node:18-alpine AS builder

WORKDIR /app

# # Copy dependency files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install

# # Copy dependency files and install dependencies with increased timeout for slow connections (g)
# COPY package.json yarn.lock ./
# RUN yarn config set network-timeout 600000 && yarn install

# Copy the rest of the application code
COPY . .

# Build-time env vars (injected from docker-compose build args)
ARG NEXT_PUBLIC_OIDC_AUTHORITY
ARG NEXT_PUBLIC_OIDC_CLIENT_ID
ARG NEXT_PUBLIC_OIDC_REDIRECT_URI
ARG NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI
ARG NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI
ARG NEXT_PUBLIC_GENDOX_URL
ARG NEXT_PUBLIC_PROVEN_AI_URL

# Expose them to the build so Next.js picks them up
ENV NEXT_PUBLIC_OIDC_AUTHORITY=${NEXT_PUBLIC_OIDC_AUTHORITY}
ENV NEXT_PUBLIC_OIDC_CLIENT_ID=${NEXT_PUBLIC_OIDC_CLIENT_ID}
ENV NEXT_PUBLIC_OIDC_REDIRECT_URI=${NEXT_PUBLIC_OIDC_REDIRECT_URI}
ENV NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI=${NEXT_PUBLIC_OIDC_POST_LOGOUT_REDIRECT_URI}
ENV NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI=${NEXT_PUBLIC_OIDC_SILENT_REDIRECT_URI}
ENV NEXT_PUBLIC_GENDOX_URL=${NEXT_PUBLIC_GENDOX_URL}
ENV NEXT_PUBLIC_PROVEN_AI_URL=${NEXT_PUBLIC_PROVEN_AI_URL}

# Build and export the static site
RUN yarn build

# Stage 2: Serve the static files using Nginx
FROM nginx:alpine

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy static site output from the builder stage (default output directory is "out")
COPY --from=builder /app/out /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]

