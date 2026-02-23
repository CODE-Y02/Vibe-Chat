FROM node:20-alpine

WORKDIR /app

# Install dependencies first for cache layer utilization
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and prisma config
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript Code
RUN npm run build

# Expose server port
EXPOSE 3000

# Run in production mode
CMD ["npm", "run", "start"]
