CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);