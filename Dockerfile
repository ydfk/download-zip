FROM node:18-alpine AS runner
WORKDIR /app
COPY build ./build
COPY package.json ./
RUN npm install -g pnpm
RUN pnpm install -P --ignore-scripts
USER node
ENV NODE_ENV="production"
CMD ["npm", "start"]