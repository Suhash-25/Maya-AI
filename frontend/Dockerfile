# Stage 1: Build the React app
FROM node:20-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Set the production API URL (Change this when hosting on a real domain)
ENV VITE_API_URL=http://localhost:8080 
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine
# Copy the built Vite assets to Nginx's web folder
COPY --from=build /app/dist /usr/share/nginx/html
# Expose port 80 for the web
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]