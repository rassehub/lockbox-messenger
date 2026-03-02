FROM node:24-alpine3.21 AS base
WORKDIR /server
COPY package*.json .

FROM base AS development
RUN npm ci --include=dev
COPY . .

FROM base AS production
RUN npm ci --only=production
COPY . .