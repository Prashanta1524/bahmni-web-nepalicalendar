# --- STAGE 1: The Build Environment (The "Kitchen") ---
# We use Node 14 as it is standard for Bahmni-Standard migrations
FROM node:14-bullseye AS builder

# 1. Increase Memory Limit for Node.js
# Bahmni builds are heavy; this prevents "JavaScript heap out of memory" errors
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install system dependencies
# Ruby/Sass/Compass are required for Bahmni's older CSS styles
# dos2unix is CRITICAL because you are developing on Windows
RUN apt-get update && apt-get install -y \
    ruby-full \
    build-essential \
    git \
    dos2unix \
    && gem install sass -v 3.4.22 \
    && gem install compass -v 1.0.3

# 3. Install global frontend tools
RUN npm install -g bower grunt-cli

WORKDIR /app

# 4. Copy the entire repository into the container
COPY . .

# 5. CRITICAL: Fix Windows Line Endings (CRLF to LF)
# This fixes the "Command not found" and "Exit Code 127" errors
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN find . -type f -name "*.json" -exec dos2unix {} +

# 6. Run the Multi-Step Build
# We run them separately so it's easier to see which step fails in GitHub Actions
# A. Install build-time dependencies
RUN cd ui && yarn install --network-timeout 1000000

# B. Install runtime UI libraries (Angular, JQuery, etc.)
RUN cd ui && bower install --allow-root --config.interactive=false

# C. Run the final Bahmni packaging script (This creates the 'dist' folder)
RUN cd ui && /bin/bash ./scripts/package.sh


# --- STAGE 2: The Production Image (The "Serving Plate") ---
# This is what actually runs on your server
FROM bahmni/bahmni-web:latest

# 7. Clean the default Bahmni files to make room for your custom features
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# 8. Copy the "cooked" files from Stage 1
# This takes the result of the build and puts it in the Apache web folder
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 9. Set correct permissions for the web server
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/