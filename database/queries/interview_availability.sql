DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_type') THEN
        CREATE TYPE package_type AS ENUM ('ONETIME', 'RECURRING');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS interview_availability (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    interviews_available INT NOT NULL,
    package_type package_type NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);