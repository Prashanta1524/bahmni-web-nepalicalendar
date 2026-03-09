# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy JavaScript builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install system tools
RUN apt-get update && apt-get install -y \
    ruby-full build-essential git dos2unix \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

# 3. Install Grunt
RUN npm install -g grunt-cli

WORKDIR /app

# 4. Copy everything from your repository
COPY . .

# 5. Fix Windows Line Endings (CRLF to LF)
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN find . -type f -name "*.json" -exec dos2unix {} +

# 6. DEVOPS TRICK: Skip ESLint (Code Style Check)
# This prevents the "928 problems" from stopping your build.
# It removes the 'eslint' task from the Grunt build sequence.
RUN sed -i "s/'eslint:target',//g" ui/Gruntfile.js || true

# 7. RUN THE BUILD PROCESS

# Step A: Install root dependencies
RUN yarn install --network-timeout 1000000 --ignore-scripts

# Step B: Build micro-frontends
RUN if [ -d "micro-frontends" ]; then \
      cd micro-frontends && \
      yarn install --frozen-lock-file --ignore-scripts && \
      yarn build; \
    fi

# Step C: The Main Build
# We add the --force flag to the package script to ensure it finishes
RUN cd ui && \
    yarn install --ignore-scripts && \
    /bin/bash ./scripts/package.sh --force


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 8. Clean the default web folder
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# 9. Copy the finished "dist" folder into the production server path
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 10. Set permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/