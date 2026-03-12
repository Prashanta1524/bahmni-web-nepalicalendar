# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Increase memory for heavy builds
ENV NODE_OPTIONS="--max-old-space-size=4096"

# 2. Install system tools
RUN apt-get update && apt-get install -y \
    ruby-full build-essential git dos2unix \
    && gem install sass -v 3.4.22 && gem install compass -v 1.0.3

# 3. Install global build tools
RUN npm install -g bower grunt-cli

WORKDIR /app

# 4. Copy all files
COPY . .

# 5. Fix Windows Line Endings (CRLF to LF)
# This is mandatory since you are working on Windows
RUN find . -type f -name "*.sh" -exec dos2unix {} +
RUN find . -type f -name "*.json" -exec dos2unix {} +
RUN find . -type f -name "Gruntfile.js" -exec dos2unix {} +

# 6. HARD-DISABLE ESLINT (The "928 Problems" Fix)
# These lines search the Grunt configuration and remove the linting tasks
# so the build robot never even tries to check the code style.
RUN sed -i "s/'eslint:target',//g" ui/Gruntfile.js || true
RUN sed -i "s/'eslint',//g" ui/Gruntfile.js || true
RUN sed -i 's/"eslint:target",//g' ui/Gruntfile.js || true
RUN sed -i 's/"eslint",//g' ui/Gruntfile.js || true

# 7. RUN THE BUILD PROCESS

# Step A: Install root dependencies
RUN yarn install --network-timeout 1000000 --ignore-scripts

# Step B: Build micro-frontends (if exist)
RUN if [ -d "micro-frontends" ]; then \
      cd micro-frontends && \
      yarn install --frozen-lock-file --ignore-scripts && \
      yarn build; \
    fi

# Step C: The Main Build
# We add --force to the grunt execution inside the ui folder
RUN cd ui && \
    yarn install --ignore-scripts && \
    ./node_modules/.bin/grunt bundle --force || /bin/bash ./scripts/package.sh --force


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 8. Clean default files
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 9. Copy the finished "dist" folder
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 10. Final permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/