FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --production
RUN npm install -g nodemon
COPY . .

EXPOSE 3002

CMD ["node", "index.js"]