CREATE TABLE IF NOT EXISTS promo_codes (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_percent INTEGER NOT NULL,
    expiration_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM promo_codes) THEN
        INSERT INTO promo_codes (code, discount_percent, expiration_date)
        VALUES
        ('10OFF', 10, '2025-01-01'),
        ('20OFF', 20, '2025-01-01'),
        ('30OFF', 30, '2025-01-01'),
        ('40OFF', 40, '2025-01-01'),
        ('50OFF', 50, '2025-01-01'),
        ('60OFF', 60, '2025-01-01'),
        ('70OFF', 70, '2025-01-01'),
        ('80OFF', 80, '2025-01-01'),
        ('90OFF', 90, '2025-01-01'),
        ('100OFF', 100, '2025-01-01');
    END IF;
END $$;