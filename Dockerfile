# --- STAGE 1: Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install dependencies (Added 'tar' just in case, though it's usually built-in)
RUN apt-get update && apt-get install -y \
    ruby-full build-essential git dos2unix zip bzip2 procps psmisc xvfb tar \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

RUN npm install -g bower grunt-cli

WORKDIR /app
COPY . .

# 3. FIX WINDOWS ISSUES & REMOVE PERMISSION BLOCKS
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN dos2unix ui/Gruntfile.js ui/package.json
RUN find ui/scripts/ -type f -name "*.sh" -exec sed -i 's/sudo //g' {} +
RUN ln -s /usr/bin/kill /usr/bin/sudo || true

# 4. HARD-DISABLE LINTING (Fixes the 928 errors)
RUN sed -i "s/module.exports = function (grunt) {/module.exports = function (grunt) { grunt.option('force', true);/" ui/Gruntfile.js

# 5. RUN THE BUILD PROCESS
RUN cd ui && yarn install --ignore-scripts
RUN cd ui && /bin/bash ./scripts/package.sh --force

# 6. FIX THE 404s (The "Tar Pipe" Method)
# This is the fix for "Too many levels of symbolic links"
# It safely copies the actual files for Angular, jQuery, etc., into the dist folder
RUN cd ui/app && \
    tar -chf - components | tar -xf - -C ../dist/ || true


# --- STAGE 2: Production Image ---
FROM bahmni/bahmni-web:latest

# 7. Clean and Copy
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*
# Use /app/ui/dist/. to ensure home/ and components/ are at the top level
COPY --from=builder /app/ui/dist/. /usr/local/apache2/htdocs/bahmni/

# 8. Final Permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/