DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM ('student', 'recruiter');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'promo_code_type') THEN
        CREATE TYPE promo_code_type AS ENUM ('flat', 'percentage');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_value INTEGER NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    role role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    promo_code_type promo_code_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM promo_codes) THEN
        INSERT INTO promo_codes (code, discount_value, role, expiration_date, promo_code_type)
        VALUES
        ('3EUU6LNB', 50, 'student', '2026-01-01', 'percentage'),
        ('EZSTAJ01', 50, 'recruiter', '2026-01-01', 'percentage'),
        ('G8A5V27E', 100, 'student', '2026-01-01', 'flat'),
        ('L15XZFQG', 100, 'recruiter', '2026-01-01', 'flat');
    END IF;
END $$;