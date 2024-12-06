CREATE TABLE IF NOT EXISTS packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
            ('STUDENT', 1, 'IND', 'INR', 349, ARRAY['AI screening', '1 mock interview']),
            ('STUDENT', 1, 'GBR', 'GBP', 3.99, ARRAY['AI screening', '1 mock interview']),
            ('STUDENT', 1, 'US', 'USD', 3.99, ARRAY['AI screening', '1 mock interview']),

            ('STUDENT', 5, 'IND', 'INR', 1399, ARRAY['AI screening', '5 mock interview']),
            ('STUDENT', 5, 'GBR', 'GBP', 16.99, ARRAY['AI screening', '5 mock interview']),
            ('STUDENT', 5, 'US', 'USD', 16.99, ARRAY['AI screening', '5 mock interview']),

            ('STUDENT', 10, 'IND', 'INR', 2499, ARRAY['AI screening', '10 mock interview']),
            ('STUDENT', 10, 'GBR', 'GBP', 24.99, ARRAY['AI screening', '10 mock interview']),
            ('STUDENT', 10, 'US', 'USD', 24.99, ARRAY['AI screening', '10 mock interview']),

            ('CORPORATE', 10, 'IND', 'INR', 9999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 10, 'GBR', 'GBP', 99, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 10, 'US', 'USD', 129, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

            ('CORPORATE', 20, 'IND', 'INR', 16999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 20, 'GBR', 'GBP', 169, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 20, 'US', 'USD', 199, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),

            ('CORPORATE', 50, 'IND', 'INR', 34999, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 50, 'GBR', 'GBP', 349, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']),
            ('CORPORATE', 50, 'US', 'USD', 399, ARRAY['Sponsored listing', 'AI Screening of candidates', 'AI Interview of candidates']);
    END IF;
END $$;
