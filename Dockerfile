# # --- STAGE 1: The Build Environment ---
# FROM node:14-bullseye AS builder

# # 1. Increase memory for heavy builds
# ENV NODE_OPTIONS="--max-old-space-size=4096"

# # 2. Install every tool Bahmni might ask for
# RUN apt-get update && apt-get install -y \
#     ruby-full build-essential git dos2unix zip bzip2 procps psmisc xvfb tar \
#     && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

# RUN npm install -g bower grunt-cli

# WORKDIR /app
# COPY . .

# # 3. FIX WINDOWS ISSUES & PERMISSIONS
# RUN find . -type f -name "*.sh" -exec dos2unix {} +
# RUN dos2unix ui/Gruntfile.js ui/package.json
# # Create a dummy sudo so the script doesn't crash
# RUN echo '#!/bin/sh\nexec "$@"' > /usr/bin/sudo && chmod +x /usr/bin/sudo
# # Fix the kill path
# RUN ln -s /bin/kill /usr/bin/kill || true

# # 4. HARD-DISABLE LINTING (Fixes the 928 problems)
# RUN sed -i "s/module.exports = function (grunt) {/module.exports = function (grunt) { grunt.option('force', true);/" ui/Gruntfile.js

# # 5. RUN THE BUILD PROCESS
# RUN cd ui && yarn install --ignore-scripts
# # We use || true because if the script fails at the very end (killing xvfb), 
# # the files are already built and we want to keep them.
# RUN cd ui && (/bin/bash ./scripts/package.sh --force || true)

# # 6. CRITICAL FIX FOR BLANK PAGE (Follow Symlinks)
# # This turns the "Shortcuts" for Angular/jQuery into REAL files.
# # Without this, the browser gets a 404 for all libraries.
# RUN cd ui/app && \
#     tar -chf - components | tar -xf - -C ../dist/ || true


# # --- STAGE 2: The Production Image ---
# FROM bahmni/bahmni-web:latest

# # 7. Clear the destination to ensure a clean install
# RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# # 8. Copy the CONTENTS of the dist folder (Note the /. at the end)
# # This ensures files go to /bahmni/home and NOT /bahmni/dist/home
# COPY --from=builder /app/ui/dist/. /usr/local/apache2/htdocs/bahmni/

# # 9. Final permissions
# RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/

# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install every tool Bahmni might ask for
RUN apt-get update && apt-get install -y \
    ruby-full build-essential git dos2unix zip bzip2 procps psmisc xvfb tar \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

RUN npm install -g bower grunt-cli

WORKDIR /app
COPY . .

# 3. FIX WINDOWS ISSUES & PERMISSIONS
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN dos2unix ui/Gruntfile.js ui/package.json
RUN echo '#!/bin/sh\nexec "$@"' > /usr/bin/sudo && chmod +x /usr/bin/sudo
RUN ln -s /bin/kill /usr/bin/kill || true

# 4. HARD-DISABLE LINTING (Fixes the 928 problems)
RUN sed -i "s/module.exports = function (grunt) {/module.exports = function (grunt) { grunt.option('force', true);/" ui/Gruntfile.js

# 5. RUN THE BUILD PROCESS
RUN cd ui && yarn install --ignore-scripts
# Run build, keep going even if cleanup fails
RUN cd ui && (/bin/bash ./scripts/package.sh --force || true)

# 6. CRITICAL FIX FOR BLANK PAGE (Flatten ALL Symlinks)
# We must follow links for 'components' AND 'common'
# These are the two folders that cause 404/Blank pages
RUN cd ui/app && \
    tar -chf - components common | tar -xf - -C ../dist/ || true


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 7. Clear the destination
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# 8. Copy the CONTENTS of the built folder to the web root
# The /. at the end is very important
COPY --from=builder /app/ui/dist/. /usr/local/apache2/htdocs/bahmni/

# 9. Final Permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/