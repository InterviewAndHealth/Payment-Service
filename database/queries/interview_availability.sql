CREATE TABLE IF NOT EXISTS interview_availability (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    interviews_available INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);