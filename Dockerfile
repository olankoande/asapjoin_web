# Étape 1: Build de l'application React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Injection de l'URL de l'API au moment du build
# Si non fourni, l'app utilisera le fallback '/api/v1' (proxifié par nginx vers le backend)
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_STRIPE_PUBLIC_KEY
ENV VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY

ARG VITE_ORS_API_KEY
ENV VITE_ORS_API_KEY=$VITE_ORS_API_KEY

RUN npm run build

# Étape 2: Service avec Nginx
FROM nginx:1.25-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
