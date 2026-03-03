# ---------- 1) BUILD STAGE ----------
FROM node:20-alpine AS build
WORKDIR /app

# зависимости отдельно для кеша
COPY package*.json ./
RUN npm ci

# исходники
COPY . .

# сборка
RUN npm run build


# ---------- 2) RUN STAGE ----------
FROM nginx:alpine

# статические файлы
COPY --from=build /app/dist /usr/share/nginx/html

# (опционально) если у тебя SPA-роутинг (react-router), нужен fallback
# добавим nginx конфиг ниже через docker-compose (или можешь копировать тут)

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]