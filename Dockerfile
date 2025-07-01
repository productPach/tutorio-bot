# Используем официальный Node.js образ
FROM node:20

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем зависимости и устанавливаем их
COPY package*.json ./
RUN npm install

# Копируем остальные файлы
COPY . .

# Запускаем сервер
CMD ["node", "index.js"]