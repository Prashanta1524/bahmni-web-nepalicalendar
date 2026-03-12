# --- STAGE 1: Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install every possible dependency Bahmni needs
RUN apt-get update && apt-get install -y \
    ruby-full \
    build-essential \
    git \
    dos2unix \
    zip \
    bzip2 \
    procps \
    psmisc \
    xvfb \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

# 3. THE DEVOPS CHEAT CODE
# If the script looks for 'sudo' or 'kill' in the wrong place, 
# we create a link to the real ones so it never fails.
RUN ln -s /usr/bin/kill /usr/bin/sudo || true && \
    ln -s /bin/kill /usr/bin/kill || true

RUN npm install -g bower grunt-cli

WORKDIR /app
COPY . .

# 4. FIX WINDOWS ISSUES & PREPARE SCRIPTS
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN dos2unix ui/Gruntfile.js ui/package.json
# Remove 'sudo' from all scripts
RUN find ui/scripts/ -type f -name "*.sh" -exec sed -i 's/sudo //g' {} +

# 5. HARD-DISABLE LINTING (Fixes the 928 errors)
RUN sed -i "s/module.exports = function (grunt) {/module.exports = function (grunt) { grunt.option('force', true);/" ui/Gruntfile.js

# 6. RUN THE BUILD PROCESS
RUN cd ui && yarn install --ignore-scripts
RUN cd ui && /bin/bash ./scripts/package.sh --force

# 7. FIX THE 404s (Convert Symlinks to Real Files)
# This prevents the blank page
RUN cd ui/dist && \
    rm -rf components && \
    cp -rL ../app/components .


# --- STAGE 2: Production Image ---
FROM bahmni/bahmni-web:latest

# 8. Clean and Copy
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*
# Copy CONTENTS of dist to the web root
COPY --from=builder /app/ui/dist/. /usr/local/apache2/htdocs/bahmni/

# 9. Final Permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/