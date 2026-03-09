# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Install system dependencies (Ruby is required for old Bahmni CSS/Sass)
RUN apt-get update && apt-get install -y \
    ruby-full \
    build-essential \
    git \
    dos2unix \
    && gem install sass -v 3.4.22 \
    && gem install compass -v 1.0.3

# 2. Install global tools (Bower is CRITICAL for Bahmni 0.92/Standard)
RUN npm install -g bower grunt-cli

WORKDIR /app

# 3. Copy everything first (to ensure scripts and folder structure are correct)
COPY . .

# 4. FIX WINDOWS LINE ENDINGS (CRLF to LF)
# We do this before running any scripts to prevent "Command not found"
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN dos2unix ui/package.json

# 5. Build the UI
# We go into the 'ui' folder, install JS libs, install Bower libs, and then package
RUN cd ui && \
    yarn install && \
    bower install --allow-root && \
    /bin/bash ./scripts/package.sh


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 6. Copy the compiled "dist" folder from the builder stage
# This is the result of the 'package.sh' command
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 7. Set permissions for Apache
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/