FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY tsconfig.base.json ./
COPY README.md ./

RUN npm install
RUN npm run build -w @materfold/core
RUN npm run build -w @materfold/api
RUN npm run build -w @materfold/frontend
RUN npm run build -w @materfold/data

EXPOSE 3000

CMD ["npm", "run", "dev"]