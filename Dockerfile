# --- STAGE 1: Build the Nepali Calendar code ---
FROM node:14-alpine AS builder

# 1. Create a workspace
WORKDIR /app

# 2. Copy only the files that define dependencies (makes building faster)
COPY package.json yarn.lock ./

# 3. Install the tools (Yarn)
RUN yarn install

# 4. Copy all your code (including your Nepali calendar changes)
COPY . .

# 5. Build the project. This generates the "ui/dist" folder
RUN yarn build


# --- STAGE 2: Package it for Bahmni Standard ---
FROM bahmni/bahmni-web:latest

# 6. Delete the default Bahmni files inside the image
RUN rm -rf /usr/local/apache2/htdocs/bahmni/*

# 7. Copy your NEWly built files into the web server folder
# Note: In this repo, 'yarn build' puts files in 'ui/dist'
COPY --from=builder /app/ui/dist /usr/local/apache2/htdocs/bahmni/

# 8. Set correct permissions so the web server can read the files
RUN chmod -R 755 /usr/local/apache2/htdocs/bahmni/