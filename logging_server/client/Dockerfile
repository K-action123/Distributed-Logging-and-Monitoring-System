FROM node:16 as base

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --legacy-peer-deps

COPY . .

FROM base as prod
CMD ["sh","-c","npm run start"]