FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source (note: .dockerignore excludes node_modules, .env, uploads)
COPY . .

# Create upload directories
RUN mkdir -p uploads/portfolio uploads/profiles

EXPOSE 3000
CMD ["node", "index.js"]
