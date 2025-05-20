const { Client } = require('pg');

const client = new Client();

client.connect()
    .then(() => console.log('Connected to DB ✅'))
    .catch(err => console.error('Connection error ❌', err.stack));