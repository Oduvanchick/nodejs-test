FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

COPY . .

# Ensure node_modules/.bin is in PATH
ENV PATH=/usr/src/app/node_modules/.bin:$PATH

EXPOSE 3000

CMD ["sh", "-c", "npx node-pg-migrate up -m migrations -j sql -d postgres://$PGUSER:$PGPASSWORD@$PGHOST:$PGPORT/$PGDATABASE && npm start"]
