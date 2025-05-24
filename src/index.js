// const { Client } = require('pg');

// const client = new Client();

// client.connect()
//     .then(() => console.log('Connected to DB ✅'))
//     .catch(err => console.error('Connection error ❌', err.stack));

// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: 587,
//     secure: false,
//     auth: {
//         user: process.env.SMTP_USER,
//         pass: process.env.SMTP_PASS
//     }
// });

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { Pool } = require('pg');
const PORT = process.env.PORT || 3000;


const app = express();

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false, // Render's PostgreSQL requires SSL
            },
        }
        : {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DATABASE,
        }
);


module.exports = pool;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;


app.get('/api/weather', async (req, res) => {
    const { city } = req.query;

    // Validate input
    if (!city) return res.status(400).json({ error: 'City is required' });

    try {
        // Get weather
        const weather = await getWeather(city);
        const { temp_c, humidity, condition } = weather;
        res.status(200).json({
            temperature: temp_c,
            humidity,
            description: condition.text
        });
    } catch (err) {
        res.status(404).json({ error: 'City not found' });
    }
});


app.post('/api/subscribe', async (req, res) => {
    const { email, city, frequency } = req.query;

    // Validate input
    if (!email || !city || !['daily', 'hourly'].includes(frequency)) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    const valid = await isValidCity(city);
    if (!valid) {
        return res.status(400).json({ error: 'Invalid input: city not found' });
    }

    try {
        // Check for existing subscription
        const existing = await pool.query(
            'SELECT * FROM subscriptions WHERE email = $1 AND city = $2',
            [email, city]
        );

        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'Email already subscribed' });
        }

        // Insert new subscription
        const token = uuidv4();
        await pool.query(
            'INSERT INTO subscriptions(email, city, frequency, confirmed, token) VALUES ($1, $2, $3, $4, $5)',
            [email, city, frequency, false, token]
        );

        return res.status(200).json({ message: 'Confirmation email sent.' });

    } catch (err) {
        return res.status(500).json({ error: 'Internal server error' });
    }
});



if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Weather API running on http://localhost:${PORT}`);
    });
}

async function isValidCity(city) {
    try {
        await getWeather(city);
        return true;
    } catch {
        return false;
    }
}

async function getWeather(city) {
    const response = await axios.get(`http://api.weatherapi.com/v1/current.json`, {
        params: {
            key: WEATHER_API_KEY,
            q: city
        }
    });
    return response.data.current;
}




module.exports = { app, pool };

