CREATE TABLE IF NOT EXISTS promo_code_usage (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    promo_code_id INTEGER REFERENCES promo_codes(id),
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)