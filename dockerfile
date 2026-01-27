FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]