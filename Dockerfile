# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy JavaScript builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install system tools (Ruby/Sass/Compass are still needed for Bahmni CSS)
RUN apt-get update && apt-get install -y \
    ruby-full build-essential git dos2unix \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

# 3. Install Grunt (Bahmni uses this to bundle the UI)
RUN npm install -g grunt-cli

WORKDIR /app

# 4. Copy everything from your repository
COPY . .

# 5. CRITICAL: Fix Windows Line Endings (CRLF to LF)
# Since you are on Windows, this prevents the "Command not found" errors
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN find . -type f -name "*.json" -exec dos2unix {} +

# 6. RUN THE BUILD PROCESS
# Step A: Install root dependencies
RUN yarn install --network-timeout 1000000

# Step B: Build micro-frontends (if your team is using them)
RUN if [ -d "micro-frontends" ]; then \
      cd micro-frontends && \
      yarn install --frozen-lock-file && \
      yarn build; \
    fi

# Step C: The Main Build (The "Brain" of the project)
# This command runs your Nepali Calendar and all other custom logic
RUN cd ui && \
    yarn install && \
    /bin/bash ./scripts/package.sh


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 7. Clean the default web folder
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# 8. Copy the finished "dist" folder into the production server path
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 9. Set permissions so the website is readable
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/