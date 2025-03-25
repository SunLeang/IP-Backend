FROM node:18.15-alpine

WORKDIR /myapp
COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY . .

# Expose the default application port (internal)
EXPOSE 1000

# Override the default command to ensure the app respects the dynamic port
CMD ["sh", "-c", "PORT=${PORT:-1000} npm run start:dev"]