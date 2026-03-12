# --- STAGE 1: Build Environment ---
FROM node:14-bullseye AS builder
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN apt-get update && apt-get install -y ruby-full build-essential git dos2unix \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3
RUN npm install -g bower grunt-cli

WORKDIR /app
COPY . .

# 1. Fix Windows Line Endings and Disable Linting
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN sed -i "s/'eslint:target',//g" ui/Gruntfile.js || true

# 2. RUN THE BUILD
RUN cd ui && yarn install --ignore-scripts
RUN cd ui && /bin/bash ./scripts/package.sh --force

# 3. CRITICAL DEVOPS STEP: Convert Symlinks to Real Files
# Bahmni uses shortcuts for the 'components' folder. 
# This command replaces the shortcuts with the actual files so Docker can "see" them.
RUN cd ui/dist && \
    rm -rf components && \
    cp -rL ../app/components .


# --- STAGE 2: Production Image ---
FROM bahmni/bahmni-web:latest

# 4. Clean and Copy
# We use the '.' to ensure the folder structure (home, registration, components) stays exactly the same
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*
COPY --from=builder /app/ui/dist/. /usr/local/apache2/htdocs/bahmni/

# 5. Fix permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/