FROM node:18-alpine AS runner
USER root
WORKDIR /app
RUN mkdir -p ./log
RUN mkdir -p ./storage
COPY build ./build
COPY package.json ./
COPY .env ./
COPY node_modules ./node_modules
EXPOSE 23820
USER node
ENV NODE_ENV="production"
USER root
CMD ["npm", "start"]