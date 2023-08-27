FROM node:18-alpine AS runner
WORKDIR /app
RUN mkdir -p ./log
RUN mkdir -p ./storage
COPY build ./build
COPY package.json ./
COPY .env ./
COPY node_modules ./node_modules
USER node
ENV NODE_ENV="production"
CMD ["npm", "start"]