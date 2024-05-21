FROM node:20-alpine

RUN apk add dumb-init perl

WORKDIR /enysomenm

COPY . .

RUN npm ci
RUN npm run build

ENV NODE_ENV production

CMD ["dumb-init", "node", "dist/index.js"]
