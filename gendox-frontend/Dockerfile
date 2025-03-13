# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and yarn.lock first to leverage Docker cache
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy the rest of the application code
COPY . .

# Expose the port your development server runs on (commonly 3000)
EXPOSE 3000

# Set environment variables (optional)
# ENV NODE_ENV=development

# Start the development server
CMD ["yarn", "dev"]


