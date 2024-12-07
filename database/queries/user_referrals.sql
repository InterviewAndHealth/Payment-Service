CREATE TABLE IF NOT EXISTS user_referrals (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    promo_code_id INTEGER REFERENCES promo_codes(id),
    referral_code VARCHAR(255) NOT NULL,
    total_referrals INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);