FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate && npm run build

FROM node:20-alpine

WORKDIR /usr/src/app/dist ./dist

EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]