# Stage 1: Build image
FROM mcr.microsoft.com/playwright:v1.34.0-jammy AS builder

WORKDIR /app

# Copy only package files
COPY package*.json ./

# Install dependencies and Playwright dependencies
RUN npm install --production
RUN npx playwright install

# Stage 2: Create runtime image
FROM mcr.microsoft.com/playwright:v1.34.0-jammy

WORKDIR /app

# Copy only necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Copy the rest of the application files
COPY . .

# Set the entry point for the container
CMD ["npx", "playwright", "test", "--ui"]
