FROM node:18-alpine AS runner
WORKDIR /app
COPY build ./build
COPY package.json ./
COPY node_modules ./node_modules
USER node
ENV NODE_ENV="production"
CMD ["npm", "start"]