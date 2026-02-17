FROM node:16 as base

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

FROM base as prod
EXPOSE 8001
RUN chmod +x start.sh
CMD ["sh", "start.sh"]
