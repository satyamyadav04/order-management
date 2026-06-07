# Stage 1: Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy dependency manifests
COPY package.json ./
RUN npm install

# Copy configuration and code files
COPY . ./

# Build production assets (outputs to /app/dist)
RUN npm run build

# Stage 2: Serve stage
FROM nginx:1.25-alpine

# Copy built outputs from the build container
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
