# --- STAGE 1: The Build Environment ---
FROM node:14-bullseye AS builder

# 1. Install system dependencies for Bahmni (Ruby is needed for Compass/SASS)
RUN apt-get update && apt-get install -y \
    ruby-full \
    build-essential \
    git \
    dos2unix \
    && gem install sass -v 3.4.22 \
    && gem install compass -v 1.0.3

# 2. Install global frontend tools
RUN npm install -g bower grunt-cli

WORKDIR /app

# 3. Copy only dependency files first (for faster building)
COPY ui/package.json ui/yarn.lock* ./

# 4. Install dependencies
RUN yarn install

# 5. Copy the rest of the frontend code
COPY . .

# 6. CRITICAL: Fix Windows Line Endings so scripts work on Linux
RUN find . -type f -name "*.sh" -exec dos2unix {} +

# 7. Run the actual Bahmni build
# This creates the 'ui/dist' folder containing ALL your custom features
RUN cd ui && yarn install && /bin/bash ./scripts/package.sh


# --- STAGE 2: The Production Image ---
FROM bahmni/bahmni-web:latest

# 8. Copy the "cooked" files into the folder Bahmni serves
# This overwrites the default Bahmni UI with your custom version
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 9. Set permissions
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/