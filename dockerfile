# 使用 Node.js 的 Alpine Linux 版本作为基础镜像
FROM node:alpine

# 设置工作目录
WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npx prisma generate && npm run build

EXPOSE 3000

# 启动应用
CMD ["node", "dist/main"]