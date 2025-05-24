FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install && chmod +x ./node_modules/.bin/node-pg-migrate

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "npm run migrate && npm start"]