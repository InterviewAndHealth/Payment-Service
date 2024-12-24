DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('student', 'recruiter');
    END IF;
END$$;

CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    role role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM promo_codes) THEN
        INSERT INTO promo_codes (code, discount_percent, role, expiration_date)
        VALUES
        ('3EUU6LNB', 50, 'student', '2026-01-01'),
        ('EZSTAJ01', 50, 'recruiter', '2026-01-01'),
        ('G8A5V27E', 100, 'student', '2026-01-01'),
        ('L15XZFQG', 100, 'recruiter', '2026-01-01');
    END IF;
END $$;