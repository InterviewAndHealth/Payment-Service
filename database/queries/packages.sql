CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    package_type VARCHAR(20),
    number_of_interviews INT,
    country VARCHAR(50),
    currency VARCHAR(10),
    price INT,
    features TEXT[]
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM packages) THEN
        INSERT INTO packages (package_type, number_of_interviews, country, currency, price, features)
        VALUES
            ('USER', 1, 'INDIA', 'INR', 349, ARRAY['AI screening', '1 mock interview']),
            ('USER', 1, 'UK', 'GBP', 3.99, ARRAY['AI screening', '1 mock interview']),
            ('USER', 1, 'US', 'USD', 3.99, ARRAY['AI screening', '1 mock interview']),

            ('USER', 5, 'INDIA', 'INR', 1399, ARRAY['AI screening', '5 mock interview']),
            ('USER', 5, 'UK', 'GBP', 16.99, ARRAY['AI screening', '5 mock interview']),
            ('USER', 5, 'US', 'USD', 16.99, ARRAY['AI screening', '5 mock interview']),

            ('USER', 10, 'INDIA', 'INR', 2499, ARRAY['AI screening', '10 mock interview']),
            ('USER', 10, 'UK', 'GBP', 24.99, ARRAY['AI screening', '10 mock interview']),
            ('USER', 10, 'US', 'USD', 24.99, ARRAY['AI screening', '10 mock interview']),

            ('CORPORATE', 10, 'INDIA', 'INR', 9999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 10, 'UK', 'GBP', 99, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 10, 'US', 'USD', 129, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

            ('CORPORATE', 20, 'INDIA', 'INR', 16999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 20, 'UK', 'GBP', 169, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 20, 'US', 'USD', 199, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

            ('CORPORATE', 50, 'INDIA', 'INR', 34999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 50, 'UK', 'GBP', 349, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 50, 'US', 'USD', 399, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']);
    END IF;
END $$;
