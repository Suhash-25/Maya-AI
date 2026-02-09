FROM node:18-bullseye

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --silent

COPY frontend/ ./frontend/
WORKDIR /app/frontend

RUN npm run build

# Serve with a simple static server (install serve) or use your own webserver
RUN npm install -g serve
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
