CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    city TEXT NOT NULL,
    frequency TEXT NOT NULL,
    confirmed BOOLEAN DEFAULT FALSE,
    token TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);