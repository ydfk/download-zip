FROM node:18-alpine AS runner
USER root
WORKDIR /
VOLUME /log
VOLUME /storage

COPY build ./build
COPY package.json ./
COPY .env ./
COPY node_modules ./node_modules

EXPOSE 23820
USER node
ENV NODE_ENV="production"
USER root
CMD ["npm", "start"]